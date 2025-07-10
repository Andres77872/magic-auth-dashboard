import { API_CONFIG, HTTP_STATUS, STORAGE_KEYS } from '@/utils/constants';
import { encodeFormData, prepareMagicAuthData } from '@/utils/form-data';
import type { ApiResponse } from '@/types/api.types';
import { HttpMethod } from '@/types/api.types';

interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number>;
  skipAuth?: boolean;
  retries?: number;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string = API_CONFIG.BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private buildURL(endpoint: string, params?: Record<string, string | number>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Only add parameter if value is not null, undefined, or empty string
        if (value !== null && value !== undefined && (typeof value !== 'string' || value !== '')) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  private cleanRequestData(data: Record<string, unknown>): Record<string, unknown> {
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
  static filterUndefinedValues(params: Record<string, any>): Record<string, any> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    return cleanParams;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      throw new Error(`Unexpected response type: ${contentType || 'unknown'}`);
    }

    const data = await response.json() as ApiResponse<T>;

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

  private async requestWithRetry<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const maxRetries = config.retries ?? API_CONFIG.RETRY_ATTEMPTS;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = this.buildURL(endpoint, config.params);
        const token = this.getAuthToken();
        
        const headers: Record<string, string> = {
          ...this.defaultHeaders,
          ...config.headers,
        };

        // Add auth header if token exists and auth is not skipped
        if (token && !config.skipAuth) {
          headers.Authorization = `Bearer ${token}`;
        }

        const requestInit: RequestInit = {
          method: config.method,
          headers,
          signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        };

        // Add body for non-GET requests - NOW USING FORM DATA ✅
        if (config.body && config.method !== HttpMethod.GET) {
          const cleanedData = this.cleanRequestData(config.body as Record<string, unknown>);
          const preparedData = prepareMagicAuthData(cleanedData);
          requestInit.body = encodeFormData(preparedData);
        }

        const response = await fetch(url, requestInit);
        return await this.handleResponse<T>(response);

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          const isRetryableError = 
            error.name === 'NetworkError' ||
            error.name === 'TimeoutError' ||
            error.message.includes('fetch');
            
          if (!isRetryableError || attempt === maxRetries) {
            throw error;
          }
        }

        // Wait before retrying
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

  // Public HTTP methods
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.GET,
      params,
    });
  }

  async post<T>(endpoint: string, data?: unknown, skipAuth = false): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.POST,
      body: data,
      skipAuth,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.PUT,
      body: data,
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