/**
 * Patreon dashboard types.
 *
 * The backend contract is read-only and deliberately sanitized. These types do
 * not include provider secrets, raw Patreon identifiers, hashes, raw payloads,
 * signatures, or login/session material. Campaign/tier fingerprints are
 * non-reversible support markers, not provider IDs.
 */

import type { PaginationResponse } from '@/types/api.types';

// ===========================================================================
// Operational status (`GET /admin/patreon/status`)
// ===========================================================================

export interface RawPatreonFeatureFlags {
  linking?: boolean;
  webhooks?: boolean;
  sync?: boolean;
  s2s_entitlement?: boolean;
  creator_token_refresh?: boolean;
  raw_payload_capture?: boolean;
}

export interface PatreonFeatureFlags {
  linking: boolean;
  webhooks: boolean;
  sync: boolean;
  s2sEntitlement: boolean;
  creatorTokenRefresh: boolean;
  rawPayloadCapture: boolean;
}

export interface RawPatreonReadiness {
  status?: string;
  ready?: boolean;
  disabled?: boolean;
  missing?: string[];
  degraded?: string[];
  feature_flags?: RawPatreonFeatureFlags;
  configured_campaign_count?: number;
  configured_tier_map_entries?: number;
  retention?: Record<string, unknown>;
  last_check?: string;
  /** Present (redacted) only when the readiness check itself failed. */
  error?: string;
}

export interface PatreonReadiness {
  status: string;
  ready: boolean;
  disabled: boolean;
  /** True when the readiness check itself failed (as opposed to a disabled setup). */
  checkFailed: boolean;
  missing: string[];
  degraded: string[];
  featureFlags: PatreonFeatureFlags;
  configuredCampaignCount: number;
  configuredTierMapEntries: number;
  retention: Record<string, unknown>;
  lastCheck?: string;
}

export interface RawPatreonStatusGroup {
  status?: string;
  enabled?: boolean;
  ready?: boolean;
  configured?: boolean;
  degraded?: boolean;
  [key: string]: unknown;
}

export interface PatreonStatusGroup {
  status: string;
  enabled?: boolean;
  ready?: boolean;
  configured?: boolean;
  degraded?: boolean;
  details: Record<string, unknown>;
}

export interface RawPatreonAdminStatusResponse {
  success?: boolean;
  status?: string;
  generated_at?: string;
  readiness?: RawPatreonReadiness;
  creator_token?: RawPatreonStatusGroup;
  webhooks?: RawPatreonStatusGroup;
  snapshots?: RawPatreonStatusGroup;
  tier_map?: RawPatreonStatusGroup;
  proof_delivery?: RawPatreonStatusGroup;
  s2s?: RawPatreonStatusGroup;
  worker?: RawPatreonStatusGroup;
  sync_queue?: RawPatreonStatusGroup;
  database_clock?: RawPatreonStatusGroup;
  metrics?: Record<string, unknown>;
}

export interface PatreonAdminStatus {
  success: boolean;
  status: string;
  generatedAt?: string;
  readiness: PatreonReadiness;
  creatorToken: PatreonStatusGroup;
  webhooks: PatreonStatusGroup;
  snapshots: PatreonStatusGroup;
  tierMap: PatreonStatusGroup;
  proofDelivery: PatreonStatusGroup;
  s2s: PatreonStatusGroup;
  worker: PatreonStatusGroup;
  syncQueue: PatreonStatusGroup;
  databaseClock: PatreonStatusGroup;
  metrics: Record<string, unknown>;
}

// ===========================================================================
// ROOT admin management contracts (entitlements, tier map, sync jobs, webhooks)
// ===========================================================================
// Rows expose the non-secret local user_hash and normalized codes only — never
// raw Patreon IDs, emails, hashes, or payloads.

export type PatreonResyncScope = 'user' | 'all';

export interface RawPatreonPagination {
  limit?: number;
  offset?: number;
  total?: number;
  has_more?: boolean;
}

// ---- Entitlements ----

export interface RawPatreonEntitlement {
  user_hash?: string;
  display_name?: string | null;
  status?: string;
  link_status?: string;
  plan_code?: string;
  tier_code?: string | null;
  tier_name?: string | null;
  next_renewal_at?: string | null;
  last_synced_at?: string | null;
  stale_after?: string | null;
  updated_at?: string | null;
}

export interface PatreonEntitlement {
  userHash: string;
  displayName: string | null;
  status: string;
  linkStatus: string;
  planCode: string;
  tierCode: string | null;
  tierName: string | null;
  nextRenewalAt: string | null;
  lastSyncedAt: string | null;
  staleAfter: string | null;
  updatedAt: string | null;
}

export interface RawPatreonEntitlementListResponse {
  success?: boolean;
  items?: RawPatreonEntitlement[];
  pagination?: RawPatreonPagination;
}

export interface PatreonEntitlementList {
  items: PatreonEntitlement[];
  pagination: PaginationResponse;
}

export interface PatreonEntitlementListParams {
  limit?: number;
  offset?: number;
  status?: string;
  linkStatus?: string;
  planCode?: string;
  search?: string;
}

// Single entitlement detail reuses the safe S2S entitlement shape.
export interface RawPatreonEntitlementDetail {
  success?: boolean;
  user_hash?: string;
  entitlement?: {
    external_source?: string | null;
    status?: string;
    plan_code?: string;
    tier_code?: string | null;
    tier_name?: string | null;
    link_status?: string;
    next_renewal_at?: string | null;
    grace_period_until?: string | null;
    last_synced_at?: string | null;
    stale_after?: string | null;
    classification_version?: number;
  };
  contract_version?: number;
}

export interface PatreonEntitlementDetail {
  userHash: string;
  externalSource: string | null;
  status: string;
  planCode: string;
  tierCode: string | null;
  tierName: string | null;
  linkStatus: string;
  nextRenewalAt: string | null;
  gracePeriodUntil: string | null;
  lastSyncedAt: string | null;
  staleAfter: string | null;
  classificationVersion: number | null;
}

// ---- Entitlement history ----

export interface RawPatreonHistoryItem {
  history_id?: string;
  previous_status?: string | null;
  new_status?: string;
  previous_plan_code?: string | null;
  new_plan_code?: string;
  previous_tier_code?: string | null;
  new_tier_code?: string | null;
  link_status?: string | null;
  reason?: string;
  sync_source?: string;
  observed_at?: string | null;
}

export interface RawPatreonHistoryResponse {
  success?: boolean;
  user_hash?: string;
  items?: RawPatreonHistoryItem[];
}

export interface PatreonHistoryItem {
  historyId: string;
  previousStatus: string | null;
  newStatus: string;
  previousPlanCode: string | null;
  newPlanCode: string;
  previousTierCode: string | null;
  newTierCode: string | null;
  linkStatus: string | null;
  reason: string;
  syncSource: string;
  observedAt: string | null;
}

// ---- Tier map ----

export interface RawPatreonTierMapEntry {
  campaign_fingerprint?: string | null;
  campaign_name?: string | null;
  tier_fingerprint?: string | null;
  plan_code?: string;
  tier_code?: string;
  tier_name?: string | null;
  priority?: number;
  active?: boolean;
  effective_from?: string | null;
  effective_until?: string | null;
}

export interface PatreonTierMapEntry {
  campaignFingerprint: string | null;
  campaignName: string | null;
  tierFingerprint: string | null;
  planCode: string;
  tierCode: string;
  tierName: string | null;
  priority: number;
  active: boolean;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
}

export interface RawPatreonTierMapResponse {
  success?: boolean;
  items?: RawPatreonTierMapEntry[];
  pagination?: RawPatreonPagination;
}

export interface PatreonTierMapList {
  items: PatreonTierMapEntry[];
  pagination: PaginationResponse;
}

// ---- Sync jobs ----

export interface RawPatreonSyncJob {
  job_id?: string;
  job_type?: string;
  status?: string;
  priority?: number;
  attempts?: number;
  max_attempts?: number;
  not_before?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
  has_error?: boolean;
}

export interface PatreonSyncJob {
  jobId: string;
  jobType: string;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  notBefore: string | null;
  source: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
  hasError: boolean;
}

export interface RawPatreonSyncJobListResponse {
  success?: boolean;
  items?: RawPatreonSyncJob[];
  pagination?: RawPatreonPagination;
}

export interface PatreonSyncJobList {
  items: PatreonSyncJob[];
  pagination: PaginationResponse;
}

// ---- Webhook deliveries ----

export interface RawPatreonWebhookDelivery {
  delivery_id?: string;
  event_type?: string;
  status?: string;
  signature_valid?: boolean;
  received_at?: string | null;
  processed_at?: string | null;
}

export interface PatreonWebhookDelivery {
  deliveryId: string;
  eventType: string;
  status: string;
  signatureValid: boolean;
  receivedAt: string | null;
  processedAt: string | null;
}

export interface RawPatreonWebhookListResponse {
  success?: boolean;
  items?: RawPatreonWebhookDelivery[];
  pagination?: RawPatreonPagination;
}

export interface PatreonWebhookList {
  items: PatreonWebhookDelivery[];
  pagination: PaginationResponse;
}

// ---- Resync ----

export interface PatreonResyncRequest {
  scope: PatreonResyncScope;
  userHash?: string;
  /** Optional operator note stored with the job (at most 128 characters). */
  reason?: string;
  /** Queue at higher priority. */
  force?: boolean;
}

export const PATREON_RESYNC_REASON_MAX_LENGTH = 128;

export interface RawPatreonResyncResponse {
  success?: boolean;
  accepted?: boolean;
  status?: string;
  user_hash?: string | null;
  correlation_id?: string | null;
  retry_after_seconds?: number | null;
  message?: string | null;
}

/**
 * `accepted: false` is a normal outcome, not an error: `disabled` (sync off),
 * `not_linked` (the user has no linked membership), `rate_limited`, `degraded`.
 */
export interface PatreonResyncResult {
  accepted: boolean;
  status: string;
  correlationId: string | null;
  message: string | null;
}

// ===========================================================================
// Display helpers
// ===========================================================================

const LABEL_OVERRIDES: Record<string, string> = {
  s2s: 'S2S',
  not_ready: 'Not ready',
  partially_disabled: 'Partially disabled',
  not_linked: 'Not linked',
  refresh_failed: 'Refresh failed',
  user_member: 'User resync',
  campaign_member: 'Member resync',
  full_campaign: 'Full campaign sweep',
  webhook_resync: 'Webhook resync',
  token_refresh: 'Token refresh',
  retention: 'Retention purge',
  link_activation: 'Link activation',
  manual: 'Manual',
  manual_resync: 'Manual resync',
  scheduled: 'Scheduled',
  api_pull: 'Scheduled sync',
  admin_correction: 'Admin correction',
};

/** `snake_case` status/code → sentence-case label ("partially_disabled" → "Partially disabled"). */
export function patreonStatusLabel(status?: string | null): string {
  const raw = String(status || 'unknown');
  if (LABEL_OVERRIDES[raw]) return LABEL_OVERRIDES[raw];
  const value = raw.replace(/[_:]+/g, ' ').trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function patreonLinkStatusLabel(status?: string): string {
  return patreonStatusLabel(status);
}

const REASON_LABELS: Record<string, string> = {
  snapshot_upsert: 'Membership read',
  mapped_tier_grant: 'Paid tier granted',
  complete_non_paid_source_of_truth: 'No paid tier on Patreon',
  member_absent_from_source_of_truth: 'Member no longer on Patreon',
  source_of_truth_downgrade: 'Downgraded by source of truth',
  tier_map_miss: 'Tier not in tier map',
  resync_required: 'Resync required',
  user_requested: 'Unlinked by user',
  link_activation_pending_source_of_truth: 'Linked, awaiting first read',
};

/** Human label for an entitlement-history `reason` code. */
export function patreonReasonLabel(reason?: string | null): string {
  const raw = String(reason || '');
  return REASON_LABELS[raw] ?? patreonStatusLabel(raw || 'unknown');
}

export function formatPatreonMetric(value: unknown, fallback = '0'): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString() : fallback;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return fallback;
}

const NAIVE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

/**
 * The API serializes its UTC timestamps without a zone designator; `new Date()`
 * would read those as browser-local time. Mark them as UTC explicitly.
 */
export function normalizePatreonTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  return NAIVE_ISO.test(value) ? `${value}Z` : value;
}

/** True when an ISO timestamp is in the past (used for `stale_after`). */
export function isPatreonTimestampPast(
  value: string | null | undefined,
  now = Date.now()
): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time < now;
}
