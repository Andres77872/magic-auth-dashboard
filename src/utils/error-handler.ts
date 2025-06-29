import type { ApiResponse } from '@/types/api.types';
import { ERROR_MESSAGES } from './constants';

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

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

export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as Record<string, unknown>).success === 'boolean' &&
    'message' in response &&
    typeof (response as Record<string, unknown>).message === 'string'
  );
}

export function extractErrorMessage(response: ApiResponse<unknown>): string {
  if (response.success) {
    return '';
  }

  // Handle validation errors
  if (response.detail && Array.isArray(response.detail)) {
    return response.detail
      .map(err => `${err.loc.join('.')}: ${err.msg}`)
      .join(', ');
  }

  return response.message || ERROR_MESSAGES.INTERNAL_ERROR;
} 