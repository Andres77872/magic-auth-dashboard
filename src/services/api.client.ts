import { API_CONFIG, HTTP_STATUS, STORAGE_KEYS } from '@/utils/constants';
import type { ApiResponse } from '@/types/api.types';
import { HttpMethod } from '@/types/api.types';

interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  retries?: number;
  isFormData?: boolean;
  isMultipart?: boolean;
}

export function filterUndefinedValues<T extends Record<string, any>>(
  params: T
): Partial<T> {
  const cleanParams: Partial<T> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== 'string' || value !== '')
    ) {
      cleanParams[key as keyof T] = value as T[keyof T];
    }
  });

  return cleanParams;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private buildURL(
    endpoint: string,
    params?: Record<string, string | number>
  ): string {
    const url = new URL(endpoint, this.baseURL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Only add parameter if value is not null, undefined, or empty string
        if (
          value !== null &&
          value !== undefined &&
          (typeof value !== 'string' || value !== '')
        ) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private cleanRequestData(
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      // Only include properties that are not undefined
      if (value !== undefined) {
        // Convert null to empty string if needed, or keep null
        cleaned[key] = value === null ? '' : value;
      }
    });

    return cleaned;
  }

  // Public utility method to filter undefined values from params
  static filterUndefinedValues(
    params: Record<string, any>
  ): Record<string, any> {
    return filterUndefinedValues(params);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private buildFormBody(data: Record<string, unknown>): URLSearchParams {
    const formData = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null) {
            formData.append(key, String(item));
          }
        });
        return;
      }

      formData.append(key, String(value));
    });

    return formData;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      throw new Error(`Unexpected response type: ${contentType || 'unknown'}`);
    }

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      // Handle specific HTTP status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Check if this is a login endpoint - if so, just throw error instead of redirecting
          const isLoginEndpoint = response.url.includes('/auth/login');

          if (isLoginEndpoint) {
            // For login failures, return the error response to be handled by the login form
            throw new Error(data.message || 'Invalid username or password');
          } else {
            // For other 401s (expired sessions, etc.), clear auth data and redirect
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
            window.location.href = '/login';
          }
          break;
        case HTTP_STATUS.FORBIDDEN:
          throw new Error('Access denied. Insufficient permissions.');
        case HTTP_STATUS.NOT_FOUND:
          throw new Error('Resource not found.');
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          // Return validation errors as-is
          return data;
        default:
          throw new Error(data.message || `HTTP Error: ${response.status}`);
      }
    }

    return data;
  }

  private async performRequest(
    endpoint: string,
    config: RequestConfig
  ): Promise<Response> {
    const url = this.buildURL(endpoint, config.params);
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    if (token && !config.skipAuth) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (config.isMultipart) {
      delete headers['Content-Type'];
    }

    const requestInit: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    };

    if (
      config.body &&
      config.method !== HttpMethod.GET &&
      config.method !== HttpMethod.HEAD
    ) {
      if (config.isMultipart) {
        requestInit.body = config.body as FormData;
      } else if (config.isFormData) {
        requestInit.body = this.buildFormBody(
          config.body as Record<string, unknown>
        );
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else {
        const cleanedData = this.cleanRequestData(
          config.body as Record<string, unknown>
        );
        requestInit.body = JSON.stringify(cleanedData);
      }
    }

    return fetch(url, requestInit);
  }

  private async requestRawWithRetry(
    endpoint: string,
    config: RequestConfig
  ): Promise<Response> {
    const maxRetries = config.retries ?? API_CONFIG.RETRY_ATTEMPTS;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.performRequest(endpoint, config);
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error) {
          const isRetryableError =
            error.name === 'NetworkError' ||
            error.name === 'TimeoutError' ||
            error.message.includes('fetch');

          if (!isRetryableError || attempt === maxRetries) {
            throw error;
          }
        }

        if (attempt < maxRetries) {
          await this.sleep(API_CONFIG.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    throw new Error('Request failed after all retries');
  }

  private async requestWithRetry<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.requestRawWithRetry(endpoint, config);
    return this.handleResponse<T>(response);
  }

  // Public HTTP methods
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.GET,
      params,
    });
  }

  async head(
    endpoint: string,
    params?: Record<string, string | number>,
    skipAuth = false
  ): Promise<Response> {
    return this.requestRawWithRetry(endpoint, {
      method: HttpMethod.HEAD,
      params,
      skipAuth,
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.POST,
      body: data,
      skipAuth,
    });
  }

  async postForm<T>(
    endpoint: string,
    data?: unknown,
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.POST,
      body: data,
      skipAuth,
      isFormData: true,
    });
  }

  async upload<T>(
    endpoint: string,
    formData: FormData,
    skipAuth = false
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.POST,
      body: formData,
      skipAuth,
      isMultipart: true,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PUT,
      body: data,
    });
  }

  async putForm<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PUT,
      body: data,
      isFormData: true,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.DELETE,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PATCH,
      body: data,
    });
  }

  async patchForm<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PATCH,
      body: data,
      isFormData: true,
    });
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  clearAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
