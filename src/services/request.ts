import { apiClient } from './api.client';

/** JSON requests and query/path encoding for each endpoint's actual response type. */

type Params = Record<string, string | number | boolean | null | undefined>;

/** Drop empty values; keep meaningful `false` and `0`; send booleans as "true"/"false". */
function toQuery(params?: Params): Record<string, string | number> | undefined {
  if (!params) return undefined;
  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query[key] = typeof value === 'boolean' ? String(value) : value;
  }
  return query;
}

/** Encode a path segment (opaque ids, names). */
export function seg(value: string): string {
  return encodeURIComponent(value);
}

export async function getJson<T>(
  endpoint: string,
  params?: Params
): Promise<T> {
  return apiClient.get<T>(endpoint, toQuery(params));
}

export async function postJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient.post<T>(endpoint, body);
}

export async function postFormJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient.postForm<T>(endpoint, body);
}

export async function putJson<T>(endpoint: string, body?: unknown): Promise<T> {
  return apiClient.put<T>(endpoint, body);
}

export async function putFormJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient.putForm<T>(endpoint, body);
}

export async function patchFormJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return apiClient.patchForm<T>(endpoint, body);
}

/** DELETE; pass `formBody` only for routes that read optional `Form(...)` fields. */
export async function deleteJson<T>(
  endpoint: string,
  formBody?: Record<string, unknown>
): Promise<T> {
  const response = formBody
    ? await apiClient.delete<T>(endpoint, formBody)
    : await apiClient.delete<T>(endpoint);
  return response;
}

/** Page size used when the dashboard needs a complete catalogue (backend max). */
export const CATALOG_PAGE_SIZE = 100;
