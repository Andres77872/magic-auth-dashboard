import type { ApiResponse } from '@/types/api.types';
import { ERROR_MESSAGES } from './constants';

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function handleApiError(error: any): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (error.name === 'TimeoutError') {
    return 'Request timed out. Please try again.';
  }

  return error.message || ERROR_MESSAGES.INTERNAL_ERROR;
}

export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.success === 'boolean' &&
    typeof response.message === 'string'
  );
}

export function extractErrorMessage(response: ApiResponse<any>): string {
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