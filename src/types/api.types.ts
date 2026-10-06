/** Shared fields of api.auth's BaseResponse; route payloads use their own top-level keys. */
export interface BaseResponse {
  success: boolean;
  message?: string | null;
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

// HTTP Methods
export const HttpMethod = {
  GET: 'GET',
  HEAD: 'HEAD',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];
