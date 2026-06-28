/**
 * Patreon dashboard types.
 *
 * The backend contract is read-only and deliberately sanitized. These types do
 * not include provider secrets, raw Patreon identifiers, hashes, fingerprints,
 * raw payloads, signatures, or login/session material.
 */

import type { PaginationResponse } from '@/types/api.types';

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
}

export interface PatreonReadiness {
  status: string;
  ready: boolean;
  disabled: boolean;
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
  metrics: Record<string, unknown>;
}

export function patreonStatusLabel(status?: string): string {
  const value = String(status || 'unknown').replace(/_/g, ' ');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ===========================================================================
// ROOT admin management contracts (entitlements, tier map, sync jobs, webhooks)
// ===========================================================================
// The backend remains sanitized: rows expose the non-secret local user_hash and
// normalized codes only — never raw Patreon IDs, emails, hashes, or payloads.

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
  last_synced_at?: string | null;
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
  lastSyncedAt: string | null;
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

export type PatreonTierMap = PatreonTierMapEntry[];

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
  reason: string;
  force?: boolean;
}

export interface RawPatreonResyncResponse {
  success?: boolean;
  accepted?: boolean;
  status?: string;
  correlation_id?: string | null;
  retry_after_seconds?: number | null;
  message?: string | null;
}

export interface PatreonResyncResult {
  accepted: boolean;
  status: string;
  correlationId: string | null;
  message: string | null;
}

export function patreonLinkStatusLabel(status?: string): string {
  return patreonStatusLabel(status);
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
