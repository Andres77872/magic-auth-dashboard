import { apiClient } from './api.client';

/**
 * Typed wrappers over `apiClient`.
 *
 * `apiClient` types every body as `ApiResponse<T>` (`{success, message, data}`),
 * but many api.auth routes return bare objects (`/admin/dashboard/stats`,
 * `/permissions/*`) or put their payload under a route-specific key
 * (`roles`, `user_groups`, …). Services use these helpers to state the real
 * response shape once, at the transport boundary, and then normalise it.
 * Transport behaviour (credentials, refresh, retries, errors) is unchanged.
 */

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
  return (await apiClient.get<T>(endpoint, toQuery(params))) as unknown as T;
}

export async function postJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return (await apiClient.post<T>(endpoint, body)) as unknown as T;
}

export async function postFormJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return (await apiClient.postForm<T>(endpoint, body)) as unknown as T;
}

export async function putJson<T>(endpoint: string, body?: unknown): Promise<T> {
  return (await apiClient.put<T>(endpoint, body)) as unknown as T;
}

export async function putFormJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return (await apiClient.putForm<T>(endpoint, body)) as unknown as T;
}

export async function patchFormJson<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  return (await apiClient.patchForm<T>(endpoint, body)) as unknown as T;
}

/** DELETE; pass `formBody` only for routes that read optional `Form(...)` fields. */
export async function deleteJson<T>(
  endpoint: string,
  formBody?: Record<string, unknown>
): Promise<T> {
  const response = formBody
    ? await apiClient.delete<T>(endpoint, formBody)
    : await apiClient.delete<T>(endpoint);
  return response as unknown as T;
}

/** Page size used when the dashboard needs a complete catalogue (backend max). */
export const CATALOG_PAGE_SIZE = 100;
