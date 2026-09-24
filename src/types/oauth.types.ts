/**
 * OAuth admin types — mirror api.auth ``/admin/oauth`` (``src/routes/admin_oauth.py``) and
 * its DTOs in ``src/Util/oauth/admin_models.py``, in snake_case.
 *
 * A CONNECTION holds one provider client (client id + encrypted secret + endpoints).
 * A BINDING attaches a connection to one project under a ``connection_key`` slug and
 * carries that project's sign-in policy plus its exact-match URL allow-lists.
 *
 * Secrets are WRITE-ONLY: no response type here has a field that could carry a client
 * secret, signing key, ciphertext or HMAC — only presence flags, 12-character
 * fingerprints and timestamps.
 */

import type { PaginationResponse } from '@/types/api.types';

export type OAuthProvisioningMode =
  | 'disabled'
  | 'link_only'
  | 'auto_create'
  | 'both';
export type OAuthExistingUserPolicy = 'deny' | 'join_default_group';
export type OAuthConnectionStatus =
  | 'draft'
  | 'active'
  | 'disabled'
  | 'archived';
export type OAuthCatalogStatus =
  | 'disabled'
  | 'enabled'
  | 'degraded'
  | 'archived';
export type OAuthUrlKind = 'redirect_uri' | 'return_origin';
export type OAuthCredentialStatus =
  | 'absent'
  | 'active'
  | 'rotating'
  | 'revoked';

// --- provider catalog ---------------------------------------------------------------------

/** One row of ``oauth_provider_catalog`` plus whether the running backend has an adapter. */
export interface OAuthProviderCatalogEntry {
  provider_type: string;
  display_name: string;
  protocol: string;
  status: OAuthCatalogStatus;
  login_enabled: boolean;
  link_enabled: boolean;
  /** TRUE only for provider types whose endpoints/issuer may be supplied per tenant (``oidc``). */
  tenant_endpoints_allowed: boolean;
  default_scopes?: string | null;
  adapter_registered: boolean;
  capabilities?: Record<string, unknown> | null;
  /** Non-archived connections of this type. */
  connection_count: number;
}

/** ``GET /admin/oauth/providers``. */
export interface OAuthProviderCatalog {
  /** Deployment-wide ``OAUTH_ENABLED`` switch. */
  oauth_enabled: boolean;
  providers: OAuthProviderCatalogEntry[];
}

// --- credentials --------------------------------------------------------------------------

export interface OAuthCredentialsStatus {
  credential_status: OAuthCredentialStatus;
  has_client_secret: boolean;
  has_signing_key: boolean;
  client_secret_fingerprint?: string | null;
  signing_key_fingerprint?: string | null;
  credential_key_id?: string | null;
  credentials_set_at?: string | null;
}

export interface OAuthCredentialProbeResult {
  valid: boolean;
  problems: string[];
  client_secret_fingerprint?: string | null;
}

// --- connections --------------------------------------------------------------------------

export interface OAuthConnectionInfo {
  connection_hash: string;
  provider_type: string;
  display_name: string;
  status: OAuthConnectionStatus;
  client_id?: string | null;
  scopes?: string | null;
  identity_namespace?: string | null;
  owner_project_hash?: string | null;
  owner_project_name?: string | null;
  issuer?: string | null;
  discovery_url?: string | null;
  authorize_endpoint?: string | null;
  token_endpoint?: string | null;
  jwks_uri?: string | null;
  userinfo_endpoint?: string | null;
  /** ``{"hosted_domains":[...]}`` / ``{"tenant_ids":[...]}`` / ``{"orgs":[...]}``. */
  restrictions?: Record<string, unknown> | null;
  /** ``{"tenant":"…"}`` (Microsoft). */
  provider_params?: Record<string, unknown> | null;
  tenant_endpoints_allowed: boolean;
  catalog_status?: string | null;
  /** Bindings across ALL projects, including ones the caller cannot see. */
  binding_count: number;
  linked_identity_count: number;
  /** TRUE once an identity is linked: issuer / tenant / team can no longer change. */
  namespace_locked: boolean;
  credentials: OAuthCredentialsStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Row shape of ``GET /admin/oauth/connections`` — a narrower projection than the detail DTO. */
export interface OAuthConnectionListItem {
  connection_hash: string;
  provider_type: string;
  display_name: string;
  status: OAuthConnectionStatus;
  credential_status: OAuthCredentialStatus;
  credentials_set_at?: string | null;
  client_secret_fingerprint?: string | null;
  identity_namespace?: string | null;
  scopes?: string | null;
  owner_project_hash?: string | null;
  owner_project_name?: string | null;
  catalog_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  binding_count: number;
}

/**
 * One page of ``GET /admin/oauth/connections``. ``pagination.total`` applies the same
 * provider/status/search filters as the rows (and, for admins, only counts the
 * connections they can see), so it is safe to show.
 */
export interface OAuthConnectionPage {
  connections: OAuthConnectionListItem[];
  pagination: PaginationResponse;
}

/**
 * ``DELETE /admin/oauth/connections/{hash}``: ``deleted`` when nobody ever signed in
 * through it, ``archived`` (kept, credentials erased) when external identities
 * still reference it.
 */
export type OAuthConnectionDeleteOutcome = 'deleted' | 'archived';

// --- bindings and allow-lists -------------------------------------------------------------

export interface OAuthAllowedUrl {
  id: string;
  kind: OAuthUrlKind;
  url: string;
  created_at?: string | null;
}

export interface OAuthReadinessCheck {
  check: string;
  ok: boolean;
  /** Empty when the check passes. */
  message: string;
}

export interface OAuthBindingInfo {
  connection_key: string;
  connection_hash: string;
  provider_type: string;
  connection_display_name: string;
  connection_status: OAuthConnectionStatus;
  credential_status: OAuthCredentialStatus;
  project_hash: string;
  project_name?: string | null;
  enabled: boolean;
  login_enabled: boolean;
  link_enabled: boolean;
  provisioning_mode: OAuthProvisioningMode;
  default_user_group_hash?: string | null;
  default_user_group_name?: string | null;
  existing_user_policy: OAuthExistingUserPolicy;
  /** ``api`` or ``legacy_redeem``. */
  init_mode: string;
  has_legacy_redeem: boolean;
  delivery_mode: string;
  state_ttl_seconds?: number | null;
  urls: OAuthAllowedUrl[];
  /** Server roll-up: every readiness check passes. */
  ready: boolean;
  readiness: OAuthReadinessCheck[];
}

/** Per-binding readiness returned by ``GET /projects/{hash}/readiness``. */
export interface OAuthProjectReadinessEntry {
  connection_key: string;
  provider_type: string;
  ready: boolean;
  checks: OAuthReadinessCheck[];
}

/** ``GET /admin/oauth/projects/{hash}/readiness``. */
export interface OAuthProjectReadiness {
  oauth_enabled: boolean;
  providers: OAuthProjectReadinessEntry[];
}

// --- request bodies (JSON; every OAuth admin endpoint takes a JSON body) ------------------

export interface OAuthProviderCatalogUpdateRequest {
  status?: OAuthCatalogStatus;
  login_enabled?: boolean;
  link_enabled?: boolean;
}

export interface OAuthConnectionCreateRequest {
  provider_type: string;
  display_name: string;
  client_id: string;
  /** Omitted: the catalog's default scopes. */
  scopes?: string;
  owner_project_hash?: string;
  issuer?: string;
  discovery_url?: string;
  authorize_endpoint?: string;
  token_endpoint?: string;
  jwks_uri?: string;
  userinfo_endpoint?: string;
  restrictions?: Record<string, unknown>;
  provider_params?: Record<string, unknown>;
}

/**
 * Partial update: omitted fields keep their stored value. The dashboard clears an
 * optional text field with ``''`` and a JSON field with ``{}`` — the transport turns a
 * top-level ``null`` into ``''`` (see ``api.client.ts`` ``cleanRequestData``), which the
 * backend rejects for the dict-typed fields.
 */
export interface OAuthConnectionUpdateRequest {
  display_name?: string;
  client_id?: string;
  scopes?: string;
  issuer?: string;
  discovery_url?: string;
  authorize_endpoint?: string;
  token_endpoint?: string;
  jwks_uri?: string;
  userinfo_endpoint?: string;
  restrictions?: Record<string, unknown>;
  provider_params?: Record<string, unknown>;
}

/**
 * Write-only. Sent as JSON so secrets never land in URL-encoded request logs. An omitted
 * field keeps the stored secret; at least one field must be sent.
 */
export interface OAuthCredentialsRequest {
  client_secret?: string;
  signing_key?: string;
}

/** ``POST .../credentials/test``: only ``client_secret`` is used; nothing is saved. */
export interface OAuthCredentialProbeRequest {
  client_secret?: string;
}

export interface OAuthBindingUpsertRequest {
  connection_hash: string;
  enabled?: boolean;
  login_enabled?: boolean;
  link_enabled?: boolean;
  provisioning_mode?: OAuthProvisioningMode;
  /** ``''`` clears the default group (the transport sends ``null`` as ``''`` anyway). */
  default_user_group_hash?: string;
  existing_user_policy?: OAuthExistingUserPolicy;
  /** Backend accepts 30–600 seconds; omitted keeps the stored value. */
  state_ttl_seconds?: number;
}

export interface OAuthBindingUrlCreateRequest {
  kind: OAuthUrlKind;
  url: string;
}

export interface OAuthConnectionListParams {
  provider_type?: string;
  status?: OAuthConnectionStatus;
  /** Case-insensitive substring match on ``display_name`` (max 120 characters). */
  search?: string;
  /** 1–200 (backend default 50). */
  limit?: number;
  offset?: number;
}
