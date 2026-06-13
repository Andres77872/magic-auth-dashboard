/**
 * API Key Types
 *
 * Types for admin-managed API key operations.
 * Admins create/list/revoke project-scoped machine-to-machine credentials
 * for user or service-account owners.
 */

/**
 * API Key entity (returned from list/get operations — no secret)
 */
export interface ApiKey {
  id: string;
  public_id: string;
  name: string;
  description?: string;
  fingerprint: string;        // 12-char human-readable ID
  secret_last4: string;       // Last 4 chars for confirmation
  project_id: string;
  owner_user_id: string;
  expires_at: string;         // ISO 8601 UTC
  last_used_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  revoked_at?: string | null;
  revoke_reason?: string | null;
  hash_algorithm?: string;
  // Enrichment fields joined in by the list/detail endpoints (optional —
  // not present on the one-time create response).
  project_name?: string;
  project_hash?: string;
  owner_username?: string;
  owner_user_hash?: string;
  owner_user_type?: string;
}

/**
 * Create request (FormData per backend spec)
 * Admin creates a key for a user on a specific project.
 */
export interface CreateApiKeyRequest {
  user_hash: string;          // Required — target owner user
  project_hash: string;       // Required
  name?: string;
  description?: string;
  expires_at?: string;        // ISO 8601, optional
}

/**
 * Create response (includes one-time token)
 * CRITICAL: api_key field is returned ONLY at creation.
 * Frontend must display and allow immediate copy.
 */
export interface CreateApiKeyResponse {
  success: boolean;
  message: string;
  data: ApiKey & {
    api_key: string;          // Full token sk_{public_id}.{secret} — ONLY at creation
  };
}

/**
 * UI-only metadata for delegated-auth service tokens.
 *
 * These values are not persisted by api.auth. They are used after creation to
 * render the env snippets required by the caller service and the target LLM
 * service.
 */
export interface DelegatedAuthRevealConfig {
  sourceProjectHash: string;
  sourceProjectName?: string;
  targetProjectHash: string;
  targetProjectName?: string;
  ownerUserHash: string;
}

/**
 * List response
 */
export interface ApiKeyListResponse {
  success: boolean;
  message: string;
  data: {
    keys: ApiKey[];
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Update request
 */
export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
  expires_at?: string;
}

/**
 * Single key response
 */
export interface ApiKeyResponse {
  success: boolean;
  message: string;
  data: ApiKey;
}

/**
 * Revoke response
 */
export interface RevokeApiKeyResponse {
  success: boolean;
  message: string;
}

/**
 * API Key status type for UI display
 */
export type ApiKeyStatus = 'active' | 'expired' | 'revoked' | 'revoking';

/**
 * Compute API key status from key data
 */
export function computeApiKeyStatus(key: ApiKey): ApiKeyStatus {
  if (!key.is_active) {
    // Could be revoked or just inactive
    if (key.revoked_at) {
      return 'revoked';
    }
    return 'revoked';
  }
  
  // Check if expired
  if (key.expires_at) {
    const expiryDate = new Date(key.expires_at);
    if (expiryDate < new Date()) {
      return 'expired';
    }
  }
  
  return 'active';
}
