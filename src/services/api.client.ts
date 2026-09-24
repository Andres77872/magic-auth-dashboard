import { API_CONFIG, ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';
import { ApiError } from '@/utils/error-handler';
import type { ApiResponse } from '@/types/api.types';
import { HttpMethod } from '@/types/api.types';
import type { LoginResponse, ValidationResponse } from '@/types/auth.types';
import {
  sessionRefreshCoordinator,
  type SessionRefreshResult,
} from './session-refresh-coordinator';

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
  validationRechecks?: number;
}

type QueryParamValue = string | number;

class AuthGenerationChangedError extends Error {}

/**
 * The backend reports failures as `{status: "error", error: {code, message}}`;
 * older routes use a top-level `message` or FastAPI's `detail` string.
 */
function readBackendError(data: unknown): { message?: string; code?: string } {
  if (!data || typeof data !== 'object') return {};
  const record = data as Record<string, unknown>;
  const text = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value : undefined;
  const nested =
    record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : undefined;
  return {
    message:
      text(nested?.message) ?? text(record.message) ?? text(record.detail),
    code: text(nested?.code) ?? text(record.error_code),
  };
}

/**
 * 401s that mean "your session is fine, but this action needs more proof".
 * Refreshing can't help and they must never sign the operator out:
 * - `AUTH_1008`: a recent sign-in is required (API key changes, project switch);
 * - `AUTH_1001` on the password-change route: the current password was wrong.
 * (`AUTH_1001` is the backend's default auth code elsewhere, so it is scoped.)
 */
function isStepUpRequired(endpoint: string, code: string | undefined): boolean {
  if (code === 'AUTH_1008') return true;
  return code === 'AUTH_1001' && endpoint === '/auth/password/change';
}

/** Read a JSON error body without consuming the response. */
async function peekErrorCode(response: Response): Promise<string | undefined> {
  try {
    const data: unknown = await response.clone().json();
    return readBackendError(data).code;
  } catch {
    return undefined;
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

export function filterUndefinedValues(
  params: object
): Record<string, QueryParamValue> {
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

    // Drop `undefined` (field not sent); keep `null`, which JSON routes use to clear a value.
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = value;
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

  private isValidationEndpoint(endpoint: string): boolean {
    return endpoint === '/auth/validate';
  }

  private isSessionMutationEndpoint(endpoint: string): boolean {
    return (
      this.isLoginEndpoint(endpoint) ||
      endpoint === '/auth/register' ||
      endpoint === '/auth/switch-project' ||
      endpoint === '/auth/logout'
    );
  }

  private isTokenPairPayload(
    payload: LoginResponse | undefined
  ): payload is LoginResponse {
    return (
      payload?.success === true &&
      typeof payload.expires_at === 'string' &&
      typeof payload.remember_me === 'boolean'
    );
  }

  private isTerminalRefreshStatus(status: number): boolean {
    return status >= 400 && status < 500 && status !== 429;
  }

  private shouldAttemptRefresh(
    endpoint: string,
    config: RequestConfig
  ): boolean {
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

  async refreshAuthSession(
    observedGeneration:
      | string
      | null = sessionRefreshCoordinator.getGeneration()
  ): Promise<SessionRefreshResult> {
    return sessionRefreshCoordinator.refresh(async () => {
      const response = await this.requestRawWithRetry('/auth/refresh', {
        method: HttpMethod.POST,
        skipAuth: true,
        skipRefresh: true,
        retries: 0,
      });

      let payload: LoginResponse | undefined;
      try {
        payload = (await response.json()) as LoginResponse;
      } catch {
        // A successful refresh must satisfy the documented token-pair contract.
      }

      const success = response.ok && this.isTokenPairPayload(payload);

      return {
        success,
        terminal: !response.ok && this.isTerminalRefreshStatus(response.status),
        response: success ? payload : undefined,
      };
    }, observedGeneration);
  }

  private async requestRawCoordinated(
    endpoint: string,
    config: RequestConfig
  ): Promise<Response> {
    if (!this.isSessionMutationEndpoint(endpoint)) {
      return this.requestRawWithRetry(endpoint, config);
    }

    return sessionRefreshCoordinator.runSessionMutation(
      async () => {
        const response = await this.requestRawWithRetry(endpoint, config);

        if (!response.ok) {
          return { value: response };
        }

        if (endpoint === '/auth/logout') {
          return { value: response, signedOut: true };
        }

        let payload: LoginResponse | undefined;
        try {
          payload = (await response.clone().json()) as LoginResponse;
        } catch {
          // Registration may legitimately return no token pair.
        }

        return {
          value: response,
          completion: this.isTokenPairPayload(payload)
            ? { success: true, response: payload }
            : undefined,
        };
      },
      { requiresCrossTabLock: endpoint === '/auth/switch-project' }
    );
  }

  private async reconcileValidationResponse(
    endpoint: string,
    config: RequestConfig,
    initialResponse: Response,
    initialGeneration: string | null
  ): Promise<{ response: Response; generation: string | null }> {
    if (!this.isValidationEndpoint(endpoint)) {
      return { response: initialResponse, generation: initialGeneration };
    }

    let response = initialResponse;
    let generation = initialGeneration;

    for (let attempt = 0; attempt < 3; attempt++) {
      const currentGeneration = sessionRefreshCoordinator.getGeneration();
      if (currentGeneration !== generation) {
        generation = currentGeneration;
        response = await this.requestRawWithRetry(endpoint, config);
      }

      if (!response.ok) {
        return { response, generation };
      }

      let validation: ValidationResponse | undefined;
      try {
        validation = (await response.clone().json()) as ValidationResponse;
      } catch {
        return { response, generation };
      }

      const expiresAt = validation.session?.expires_at;
      if (validation.valid !== true || typeof expiresAt !== 'string') {
        return { response, generation };
      }

      const adopted = await sessionRefreshCoordinator.adoptValidatedSession(
        {
          expiresAt,
          refreshExpiresAt: validation.session?.refresh_expires_at,
          rememberMe: validation.session?.remember_me,
        },
        generation
      );
      if (adopted) {
        return {
          response,
          generation: sessionRefreshCoordinator.getGeneration(),
        };
      }
    }

    throw new Error('Authentication session changed during validation');
  }

  private async handleResponse<T>(
    response: Response,
    endpoint: string,
    requestGeneration: string | null,
    allowUnauthorizedDispatch: boolean
  ): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      throw new Error(`Unexpected response type: ${contentType || 'unknown'}`);
    }

    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      const backendError = readBackendError(data);
      // Handle specific HTTP status codes
      switch (response.status) {
        case HTTP_STATUS.UNAUTHORIZED:
          if (this.isLoginEndpoint(endpoint)) {
            // For login failures, return the error response to be handled by the login form
            throw new Error(
              backendError.message || 'Invalid username or password'
            );
          } else if (isStepUpRequired(endpoint, backendError.code)) {
            throw new ApiError(
              backendError.message || 'Sign in again to continue.',
              response.status,
              backendError.code
            );
          } else {
            const generationChanged =
              sessionRefreshCoordinator.getGeneration() !== requestGeneration;
            if (generationChanged && this.isValidationEndpoint(endpoint)) {
              throw new AuthGenerationChangedError(
                'Authentication session changed while the request was in flight'
              );
            }
            if (allowUnauthorizedDispatch && !generationChanged) {
              this.dispatchUnauthorized();
            }
            throw new Error(
              backendError.message || ERROR_MESSAGES.SESSION_EXPIRED
            );
          }
        case HTTP_STATUS.FORBIDDEN:
          throw new ApiError(
            backendError.message || ERROR_MESSAGES.FORBIDDEN,
            response.status,
            backendError.code
          );
        case HTTP_STATUS.NOT_FOUND:
          throw new ApiError(
            backendError.message || 'Resource not found.',
            response.status,
            backendError.code
          );
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          // Return validation errors as-is
          return data;
        default: {
          const error = new ApiError(
            backendError.message || `HTTP Error: ${response.status}`,
            response.status,
            backendError.code
          );
          error.retryAfterSeconds = parseRetryAfter(
            response.headers.get('retry-after')
          );
          throw error;
        }
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
    // Only auto-retry idempotent methods. Retrying POST/PUT/PATCH/DELETE on a
    // timeout risks executing a mutation the server already processed (e.g. a
    // duplicate create/charge). An explicit config.retries still wins.
    const isIdempotent =
      config.method === HttpMethod.GET || config.method === HttpMethod.HEAD;
    const maxRetries =
      config.retries ?? (isIdempotent ? API_CONFIG.RETRY_ATTEMPTS : 0);
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
    const observedRefreshGeneration = sessionRefreshCoordinator.getGeneration();
    let requestGeneration = observedRefreshGeneration;
    let allowUnauthorizedDispatch = true;
    let response = await this.requestRawCoordinated(endpoint, config);

    if (
      response.status === HTTP_STATUS.UNAUTHORIZED &&
      this.shouldAttemptRefresh(endpoint, config) &&
      !isStepUpRequired(endpoint, await peekErrorCode(response))
    ) {
      const refreshed = await this.refreshAuthSession(
        observedRefreshGeneration
      );
      if (refreshed.success) {
        requestGeneration = sessionRefreshCoordinator.getGeneration();
        response = await this.requestRawCoordinated(endpoint, config);
      } else {
        // Terminal failures are broadcast by the coordinator. Transient
        // failures must not turn a temporary outage into a forced logout.
        allowUnauthorizedDispatch = false;
      }
    }

    const reconciledValidation = await this.reconcileValidationResponse(
      endpoint,
      config,
      response,
      requestGeneration
    );
    response = reconciledValidation.response;
    requestGeneration = reconciledValidation.generation;

    let data: ApiResponse<T>;
    try {
      data = await this.handleResponse<T>(
        response,
        endpoint,
        requestGeneration,
        allowUnauthorizedDispatch
      );
    } catch (error) {
      if (
        this.isValidationEndpoint(endpoint) &&
        error instanceof AuthGenerationChangedError
      ) {
        return this.retryValidationAfterGenerationChange<T>(endpoint, config);
      }
      throw error;
    }

    if (
      this.isValidationEndpoint(endpoint) &&
      sessionRefreshCoordinator.getGeneration() !== requestGeneration
    ) {
      return this.retryValidationAfterGenerationChange<T>(endpoint, config);
    }

    return data;
  }

  private retryValidationAfterGenerationChange<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<ApiResponse<T>> {
    const validationRechecks = config.validationRechecks ?? 0;
    if (validationRechecks >= 2) {
      return Promise.reject(
        new Error('Authentication session changed during validation')
      );
    }

    return this.requestWithRetry<T>(endpoint, {
      ...config,
      validationRechecks: validationRechecks + 1,
    });
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

  // POST that returns a binary Blob (e.g. streamed CSV/JSON export downloads).
  // Keeps the client's timeout + one-shot 401→refresh behaviour, but skips the
  // JSON content-type handling in handleResponse so streamed bodies come through.
  async postBlob(endpoint: string, data?: unknown): Promise<Blob> {
    const config: RequestConfig = { method: HttpMethod.POST, body: data };

    const observedRefreshGeneration = sessionRefreshCoordinator.getGeneration();
    let requestGeneration = observedRefreshGeneration;
    let allowUnauthorizedDispatch = true;
    let response = await this.requestRawWithRetry(endpoint, config);

    if (
      response.status === HTTP_STATUS.UNAUTHORIZED &&
      this.shouldAttemptRefresh(endpoint, config) &&
      !isStepUpRequired(endpoint, await peekErrorCode(response))
    ) {
      const refreshed = await this.refreshAuthSession(
        observedRefreshGeneration
      );
      if (refreshed.success) {
        requestGeneration = sessionRefreshCoordinator.getGeneration();
        response = await this.requestRawWithRetry(endpoint, config);
      } else {
        allowUnauthorizedDispatch = false;
      }
    }

    if (!response.ok) {
      let backendError: { message?: string; code?: string } = {};
      try {
        backendError = readBackendError(await response.json());
      } catch {
        // Non-JSON error body; fall back to a status-based message.
      }

      if (
        response.status === HTTP_STATUS.UNAUTHORIZED &&
        !isStepUpRequired(endpoint, backendError.code)
      ) {
        if (
          allowUnauthorizedDispatch &&
          sessionRefreshCoordinator.getGeneration() === requestGeneration
        ) {
          this.dispatchUnauthorized();
        }
        throw new ApiError(
          backendError.message || ERROR_MESSAGES.SESSION_EXPIRED,
          response.status,
          backendError.code
        );
      }

      const error = new ApiError(
        backendError.message || `Export failed with status ${response.status}`,
        response.status,
        backendError.code
      );
      error.retryAfterSeconds = parseRetryAfter(
        response.headers.get('retry-after')
      );
      throw error;
    }

    return response.blob();
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

  /**
   * DELETE with no body by default. Pass `formData` for the few routes that
   * read optional `Form(...)` fields on delete (e.g. an API key's `revoke_reason`).
   */
  async delete<T>(
    endpoint: string,
    formData?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, {
      method: HttpMethod.DELETE,
      ...(formData ? { body: formData, isFormData: true } : {}),
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
