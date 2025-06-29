// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error_code?: string;
  detail?: ValidationError[];
}

export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationResponse {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationResponse;
}

// HTTP Methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Error Response Types
export interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  required_access_level?: string;
  detail?: ValidationError[];
} 