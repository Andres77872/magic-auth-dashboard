/**
 * API Key Types
 *
 * Types for admin-managed API key operations.
 * Admins create/list/revoke project-scoped machine-to-machine credentials
 * FOR consumer users. Consumers cannot log into the dashboard.
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
  revoked_at?: string | null;
}

/**
 * Create request (FormData per backend spec)
 * Admin creates a key FOR a consumer user on a specific project.
 */
export interface CreateApiKeyRequest {
  user_hash: string;          // Required — target consumer user
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