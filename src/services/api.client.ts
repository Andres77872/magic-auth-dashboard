import { API_CONFIG, ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';
import type { ApiResponse } from '@/types/api.types';
import { HttpMethod } from '@/types/api.types';

interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  skipRefresh?: boolean;
  retries?: number;
  isFormData?: boolean;
  isMultipart?: boolean;
}

type QueryParamValue = string | number;

export function filterUndefinedValues(params: object): Record<string, QueryParamValue> {
  const cleanParams: Record<string, QueryParamValue> = {};

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      (typeof value !== 'string' || value !== '') &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      cleanParams[key] = value;
    }
  });

  return cleanParams;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
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
    params: Record<string, unknown>
  ): Record<string, QueryParamValue> {
    return filterUndefinedValues(params);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private serializeFormValue(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return String(value);
    }

    return JSON.stringify(value) ?? '';
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
            formData.append(key, this.serializeFormValue(item));
          }
        });
        return;
      }

      formData.append(key, this.serializeFormValue(value));
    });

    return formData;
  }

  private isLoginEndpoint(endpoint: string): boolean {
    return endpoint === '/auth/login' || endpoint === '/auth/platform/login';
  }

  private isRefreshEndpoint(endpoint: string): boolean {
    return endpoint === '/auth/refresh';
  }

  private shouldAttemptRefresh(endpoint: string, config: RequestConfig): boolean {
    return (
      !config.skipAuth &&
      !config.skipRefresh &&
      !this.isLoginEndpoint(endpoint) &&
      !this.isRefreshEndpoint(endpoint)
    );
  }

  private dispatchUnauthorized(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('magic-auth-unauthorized'));
    }
  }

  private async refreshAuthSession(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.requestRawWithRetry('/auth/refresh', {
        method: HttpMethod.POST,
        skipAuth: true,
        skipRefresh: true,
        retries: 0,
      })
        .then((response) => response.ok)
        .catch(() => false)
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  private async handleResponse<T>(
    response: Response,
    endpoint: string
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      throw new Error(`Unexpected response type: ${contentType || 'unknown'}`);
    }

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      // Handle specific HTTP status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          if (this.isLoginEndpoint(endpoint)) {
            // For login failures, return the error response to be handled by the login form
            throw new Error(data.message || 'Invalid username or password');
          } else {
            this.dispatchUnauthorized();
            throw new Error(data.message || ERROR_MESSAGES.SESSION_EXPIRED);
          }
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

    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    if (config.isMultipart) {
      delete headers['Content-Type'];
    }

    const requestInit: RequestInit = {
      method: config.method,
      headers,
      credentials: 'include',
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
    let response = await this.requestRawWithRetry(endpoint, config);

    if (
      response.status === HTTP_STATUS.UNAUTHORIZED &&
      this.shouldAttemptRefresh(endpoint, config)
    ) {
      const refreshed = await this.refreshAuthSession();
      if (refreshed) {
        response = await this.requestRawWithRetry(endpoint, config);
      }
    }

    return this.handleResponse<T>(response, endpoint);
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
    void token;
  }

  clearAuthToken(): void {
    // Auth credentials are stored in HttpOnly cookies by the API.
  }

  isAuthenticated(): boolean {
    return false;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
