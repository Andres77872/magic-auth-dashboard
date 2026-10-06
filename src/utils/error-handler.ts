import { ERROR_MESSAGES } from './constants';

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;
  /** Seconds from the `Retry-After` header on throttled (429) responses. */
  public retryAfterSeconds?: number;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (error.name === 'TimeoutError') {
      return 'Request timed out. Please try again.';
    }

    return error.message;
  }

  return ERROR_MESSAGES.INTERNAL_ERROR;
}
