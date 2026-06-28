/**
 * Billing admin types — mirror api.auth ``/admin/billing`` response models.
 *
 * Billing is owned by a BILLING GROUP (one Stripe account + one catalog) that can span
 * multiple projects. api.auth is the centralized source of truth for the catalog and stays
 * agnostic of product meaning: ``features``/``metadata`` are opaque passthrough objects.
 * Credentials are write-only — responses expose only presence flags + non-secret fingerprints.
 */

import type { ApiResponse } from '@/types/api.types';

export type BillingGroupStatus = 'active' | 'suspended' | 'archived';
export type CredentialStatus = 'absent' | 'active' | 'rotating' | 'revoked';
export type CatalogItemType = 'subscription_plan' | 'credit_package';
export type ProvisioningStatus = 'pending' | 'active' | 'failed' | 'archived';

export interface BillingGroup {
  group_hash: string;
  name: string;
  description?: string | null;
  owner_id?: string | null;
  provider: string;
  status: BillingGroupStatus;
  checkout_enabled: boolean;
  portal_enabled: boolean;
  provisioning_enabled: boolean;
  webhooks_enabled: boolean;
  credential_status: CredentialStatus;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
  project_count?: number | null;
  catalog_item_count?: number | null;
  last_catalog_synced_at?: string | null;
  catalog_sync_status?: 'never' | 'ok' | 'drift' | 'error' | string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface BillingGroupProject {
  project_hash: string;
  project_name?: string | null;
  project_description?: string | null;
  status: string;
  added_at?: string | null;
}

export interface CatalogItem {
  item_hash: string;
  item_type: CatalogItemType;
  plan_code: string;
  tier_code?: string | null;
  tier_name?: string | null;
  display_name: string;
  currency?: string | null;
  unit_amount?: number | null;
  recurring_interval?: string | null;
  lookup_key?: string | null;
  provider: string;
  provider_price_fingerprint?: string | null;
  features: Record<string, unknown>;
  metadata: Record<string, unknown>;
  sort_order: number;
  active: boolean;
  provisioning_status: ProvisioningStatus;
  provisioning_error?: string | null;
  provisioned_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Aggregate billing counts for dashboard widgets (counts only; never secrets). */
export interface BillingMetrics {
  groups_total: number;
  groups_active: number;
  groups_suspended: number;
  groups_archived: number;
  credentials_active: number;
  credentials_absent: number;
  credentials_rotating: number;
  credentials_revoked: number;
  subscription_plans: number;
  credit_packages: number;
  catalog_active: number;
  catalog_pending: number;
  catalog_failed: number;
  catalog_archived: number;
  projects_mapped: number;
}

export interface BillingCredentialsStatus {
  credential_status: CredentialStatus;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
  secret_key_fingerprint?: string | null;
  webhook_secret_fingerprint?: string | null;
  stripe_account_label?: string | null;
  stripe_account_fingerprint?: string | null;
  credential_key_id?: string | null;
  credentials_set_at?: string | null;
}

export interface BillingGroupReadiness {
  ready: boolean;
  status: string;
  missing: string[];
  capabilities: Record<string, boolean>;
  webhook_endpoint_path?: string | null;
}

// --- request bodies ---------------------------------------------------------------------
export interface BillingGroupCreateRequest {
  group_name: string;
  description?: string;
  provider?: string;
}

export interface BillingGroupUpdateRequest {
  group_name?: string;
  description?: string;
  status?: BillingGroupStatus;
}

export interface StripeCredentialsRequest {
  secret_key: string;
  webhook_secret?: string;
  portal_configuration_id?: string;
  stripe_account_label?: string;
}

export interface BillingCapabilitiesUpdateRequest {
  checkout_enabled?: boolean;
  portal_enabled?: boolean;
  provisioning_enabled?: boolean;
  webhooks_enabled?: boolean;
}

export interface CatalogItemCreateRequest {
  item_type: CatalogItemType;
  plan_code: string;
  display_name: string;
  tier_code?: string;
  tier_name?: string;
  amount_cents?: number;
  currency?: string;
  recurring_interval?: string;
  lookup_key?: string;
  /** Opaque JSON string (e.g. '{"daily_credit_limit":100}'); never interpreted by api.auth. */
  features?: string;
  metadata?: string;
  sort_order?: number;
}

export type CatalogItemUpdateRequest = Partial<
  Omit<CatalogItemCreateRequest, 'item_type' | 'plan_code'>
>;

export interface CredentialValidationResponse extends ApiResponse {
  valid: boolean;
  secret_key_valid: boolean;
  portal_configuration_valid?: boolean | null;
  livemode?: boolean | null;
  account_fingerprint?: string | null;
}

export interface CatalogDriftItem {
  item_hash: string;
  plan_code: string;
  item_type: CatalogItemType | string;
  drift_kind: string;
  local_unit_amount?: number | null;
  stripe_unit_amount?: number | null;
  local_interval?: string | null;
  stripe_interval?: string | null;
  price_fingerprint?: string | null;
}

export interface CatalogImportCandidate {
  item_type: CatalogItemType | string;
  plan_code: string;
  display_name: string;
  currency?: string | null;
  unit_amount?: number | null;
  recurring_interval?: string | null;
  lookup_key?: string | null;
  product_fingerprint: string;
  price_fingerprint: string;
  plan_code_conflict: boolean;
}

export interface CatalogReconcileResult {
  gated: boolean;
  error?: string | null;
  in_sync: number;
  missing_ref_repaired: number;
  drift: CatalogDriftItem[];
  candidates: CatalogImportCandidate[];
  synced_at?: string | null;
}

export interface CatalogReconcileResponse extends ApiResponse {
  result: CatalogReconcileResult;
}

export interface CatalogImportRequest {
  price_fingerprints: string[];
  plan_code_overrides?: Record<string, string>;
}

export interface CatalogImportResponse extends ApiResponse {
  imported: string[];
  skipped: string[];
  conflicts: string[];
}

// --- response envelopes (extend ApiResponse; fields are top-level per api.auth) ----------
export interface ListBillingGroupsResponse extends ApiResponse {
  billing_groups: BillingGroup[];
  pagination?: {
    limit: number;
    offset: number;
    total?: number;
    has_more?: boolean;
  };
}

export interface BillingGroupResponse extends ApiResponse {
  billing_group: BillingGroup;
}

export interface BillingGroupDetailsResponse extends ApiResponse {
  billing_group: BillingGroup;
  projects: BillingGroupProject[];
  catalog: CatalogItem[];
  credentials: BillingCredentialsStatus;
  readiness?: BillingGroupReadiness | null;
}

export interface BillingGroupProjectsResponse extends ApiResponse {
  projects: BillingGroupProject[];
}

export interface CatalogListResponse extends ApiResponse {
  catalog: CatalogItem[];
}

export interface CatalogItemResponse extends ApiResponse {
  item: CatalogItem;
}

export interface BillingCredentialsStatusResponse extends ApiResponse {
  credentials: BillingCredentialsStatus;
}

export interface BillingMetricsResponse extends ApiResponse {
  metrics: BillingMetrics;
}
