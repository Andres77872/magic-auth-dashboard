/**
 * Admin-managed API keys (api.auth `src/routes/api_keys.py`, prefix `/api-keys`).
 *
 * Keys are project-scoped machine credentials owned by a user. The full token
 * (`sk_{public_id}.{secret}`) is returned once, by the create call; every other
 * response carries metadata only. `project_id` and `owner_user_id` are internal
 * ids — link with `project_hash` / `owner_user_hash`, never with the ids.
 */

/** Key metadata (`_format_key_response`, api_keys.py:227). */
export interface ApiKey {
  /** Equal to `public_id`; the `{key_id}` path parameter. */
  id: string;
  public_id: string;
  name: string;
  description: string | null;
  /** Internal id — not a route parameter. */
  project_id: string;
  /** Internal id — not a route parameter. */
  owner_user_id: string;
  is_active: boolean;
  /** UTC ISO timestamp, or null for a key that never expires. */
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  fingerprint: string;
  secret_last4: string;
  hash_algorithm: string | null;
  /** Joined by list/detail procedures (both listings and the detail call). */
  project_name?: string | null;
  project_hash?: string | null;
  /** Joined by the project listing and the detail call; absent in user listings. */
  owner_username?: string | null;
  owner_user_hash?: string | null;
  /** Detail call only. */
  owner_user_type?: string | null;
}

/** The create response: metadata plus the one-time secret token. */
export interface CreatedApiKey extends ApiKey {
  /** Full `sk_{public_id}.{secret}` token. Shown once; never store or log it. */
  api_key: string;
}

/** `data` of `GET /api-keys` (and the per-user / per-project listings). */
export interface ApiKeyPage {
  keys: ApiKey[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiKeyListParams {
  userHash?: string;
  projectHash?: string;
  /** Honoured by the backend for project listings only (not with `userHash`). */
  activeOnly?: boolean;
  /** 1–200. */
  limit?: number;
  offset?: number;
}

/** `POST /api-keys` form fields. */
export interface CreateApiKeyRequest {
  user_hash: string;
  project_hash: string;
  /** Defaults to `API Key - <owner username>` on the server. */
  name?: string;
  description?: string;
  /** ISO 8601, in the future. Omit for a key that never expires. */
  expires_at?: string;
}

/** `PUT /api-keys/{key_id}` form fields. Empty values count as absent server-side. */
export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  expires_at?: string;
}

/** `data` of `DELETE /api-keys/{key_id}`. */
export interface RevokedApiKey {
  key_id: string;
  revoked_at: string;
}

/**
 * UI-only metadata for delegated-auth service keys. Not persisted by api.auth;
 * used after creation to render the env snippets for the caller service and
 * the target service.
 */
export interface DelegatedAuthRevealConfig {
  sourceProjectHash: string;
  sourceProjectName?: string;
  targetProjectHash: string;
  targetProjectName?: string;
  ownerUserHash: string;
}

export type ApiKeyStatus = 'active' | 'expired' | 'revoked';

/**
 * Display status. A key with `revoked_at` is revoked. An inactive key without
 * it was deactivated after expiring. An active key past `expires_at` has
 * expired but not been swept yet.
 */
export function computeApiKeyStatus(
  key: Pick<ApiKey, 'is_active' | 'revoked_at' | 'expires_at'>,
  now = Date.now()
): ApiKeyStatus {
  if (key.revoked_at) return 'revoked';
  if (!key.is_active) return 'expired';
  if (key.expires_at) {
    const expiry = new Date(key.expires_at).getTime();
    if (!Number.isNaN(expiry) && expiry <= now) return 'expired';
  }
  return 'active';
}
