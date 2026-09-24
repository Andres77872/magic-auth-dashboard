/**
 * Patreon admin service.
 *
 * ROOT dashboard contract for Patreon entitlement/link operations
 * (`/admin/patreon/*`). Responses are sanitized server-side; this module maps
 * snake_case payloads to domain types and marks the API's zone-less UTC
 * timestamps as UTC.
 */

import { apiClient } from './api.client';
import type { PaginationResponse } from '@/types/api.types';
import {
  normalizePatreonTimestamp,
  type PatreonAdminStatus,
  type PatreonEntitlement,
  type PatreonEntitlementDetail,
  type PatreonEntitlementList,
  type PatreonEntitlementListParams,
  type PatreonFeatureFlags,
  type PatreonHistoryItem,
  type PatreonReadiness,
  type PatreonResyncRequest,
  type PatreonResyncResult,
  type PatreonStatusGroup,
  type PatreonSyncJob,
  type PatreonSyncJobList,
  type PatreonTierMapEntry,
  type PatreonTierMapList,
  type PatreonWebhookDelivery,
  type PatreonWebhookList,
  type RawPatreonAdminStatusResponse,
  type RawPatreonEntitlement,
  type RawPatreonEntitlementDetail,
  type RawPatreonEntitlementListResponse,
  type RawPatreonFeatureFlags,
  type RawPatreonHistoryItem,
  type RawPatreonHistoryResponse,
  type RawPatreonPagination,
  type RawPatreonReadiness,
  type RawPatreonResyncResponse,
  type RawPatreonStatusGroup,
  type RawPatreonSyncJob,
  type RawPatreonSyncJobListResponse,
  type RawPatreonTierMapEntry,
  type RawPatreonTierMapResponse,
  type RawPatreonWebhookDelivery,
  type RawPatreonWebhookListResponse,
} from '@/types/patreon.types';

const BASE = '/admin/patreon';

interface ListParams {
  limit?: number;
  offset?: number;
  status?: string;
}

type QueryParams = Record<string, string | number>;

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

const timestamp = normalizePatreonTimestamp;

function bool(value: unknown): boolean {
  return value === true;
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function listValue(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Drop empty optional filters; keep meaningful `0`/`false`. */
function cleanParams(
  params: Record<string, string | number | boolean | undefined>
): QueryParams {
  const clean: QueryParams = {};
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'number' && Number.isFinite(value)) clean[key] = value;
    else if (typeof value === 'boolean') clean[key] = String(value);
    else if (typeof value === 'string' && value.trim() !== '')
      clean[key] = value.trim();
  });
  return clean;
}

function mapPagination(
  raw: RawPatreonPagination | undefined,
  fallbackCount: number
): PaginationResponse {
  return {
    limit: numberValue(raw?.limit) || 20,
    offset: numberValue(raw?.offset),
    total: typeof raw?.total === 'number' ? raw.total : fallbackCount,
    has_more: bool(raw?.has_more),
  };
}

function mapEntitlement(raw: RawPatreonEntitlement): PatreonEntitlement {
  return {
    userHash: String(raw.user_hash || ''),
    displayName: stringOrNull(raw.display_name),
    status: String(raw.status || 'free'),
    linkStatus: String(raw.link_status || 'none'),
    planCode: String(raw.plan_code || 'free'),
    tierCode: stringOrNull(raw.tier_code),
    tierName: stringOrNull(raw.tier_name),
    nextRenewalAt: timestamp(raw.next_renewal_at),
    lastSyncedAt: timestamp(raw.last_synced_at),
    staleAfter: timestamp(raw.stale_after),
    updatedAt: timestamp(raw.updated_at),
  };
}

function mapTierMapEntry(raw: RawPatreonTierMapEntry): PatreonTierMapEntry {
  return {
    campaignFingerprint: stringOrNull(raw.campaign_fingerprint),
    campaignName: stringOrNull(raw.campaign_name),
    tierFingerprint: stringOrNull(raw.tier_fingerprint),
    planCode: String(raw.plan_code || ''),
    tierCode: String(raw.tier_code || ''),
    tierName: stringOrNull(raw.tier_name),
    priority: numberValue(raw.priority),
    active: bool(raw.active),
    effectiveFrom: timestamp(raw.effective_from),
    effectiveUntil: timestamp(raw.effective_until),
  };
}

function mapSyncJob(raw: RawPatreonSyncJob): PatreonSyncJob {
  return {
    jobId: String(raw.job_id || ''),
    jobType: String(raw.job_type || ''),
    status: String(raw.status || ''),
    priority: numberValue(raw.priority),
    attempts: numberValue(raw.attempts),
    maxAttempts: numberValue(raw.max_attempts),
    notBefore: timestamp(raw.not_before),
    source: stringOrNull(raw.source),
    createdAt: timestamp(raw.created_at),
    updatedAt: timestamp(raw.updated_at),
    completedAt: timestamp(raw.completed_at),
    hasError: bool(raw.has_error),
  };
}

function mapWebhookDelivery(
  raw: RawPatreonWebhookDelivery
): PatreonWebhookDelivery {
  return {
    deliveryId: String(raw.delivery_id || ''),
    eventType: String(raw.event_type || ''),
    status: String(raw.status || ''),
    signatureValid: bool(raw.signature_valid),
    receivedAt: timestamp(raw.received_at),
    processedAt: timestamp(raw.processed_at),
  };
}

function mapHistoryItem(raw: RawPatreonHistoryItem): PatreonHistoryItem {
  return {
    historyId: String(raw.history_id || ''),
    previousStatus: stringOrNull(raw.previous_status),
    newStatus: String(raw.new_status || 'free'),
    previousPlanCode: stringOrNull(raw.previous_plan_code),
    newPlanCode: String(raw.new_plan_code || 'free'),
    previousTierCode: stringOrNull(raw.previous_tier_code),
    newTierCode: stringOrNull(raw.new_tier_code),
    linkStatus: stringOrNull(raw.link_status),
    reason: String(raw.reason || 'unknown'),
    syncSource: String(raw.sync_source || 'unknown'),
    observedAt: timestamp(raw.observed_at),
  };
}

function mapEntitlementDetail(
  raw: RawPatreonEntitlementDetail
): PatreonEntitlementDetail {
  const ent = raw.entitlement || {};
  return {
    userHash: String(raw.user_hash || ''),
    externalSource: stringOrNull(ent.external_source),
    status: String(ent.status || 'free'),
    planCode: String(ent.plan_code || 'free'),
    tierCode: stringOrNull(ent.tier_code),
    tierName: stringOrNull(ent.tier_name),
    linkStatus: String(ent.link_status || 'none'),
    nextRenewalAt: timestamp(ent.next_renewal_at),
    gracePeriodUntil: timestamp(ent.grace_period_until),
    lastSyncedAt: timestamp(ent.last_synced_at),
    staleAfter: timestamp(ent.stale_after),
    classificationVersion:
      typeof ent.classification_version === 'number'
        ? ent.classification_version
        : null,
  };
}

function mapFeatureFlags(raw?: RawPatreonFeatureFlags): PatreonFeatureFlags {
  return {
    linking: bool(raw?.linking),
    webhooks: bool(raw?.webhooks),
    sync: bool(raw?.sync),
    s2sEntitlement: bool(raw?.s2s_entitlement),
    creatorTokenRefresh: bool(raw?.creator_token_refresh),
    rawPayloadCapture: bool(raw?.raw_payload_capture),
  };
}

function mapReadiness(raw?: RawPatreonReadiness): PatreonReadiness {
  return {
    status: raw?.status || 'unknown',
    ready: bool(raw?.ready),
    disabled: bool(raw?.disabled),
    checkFailed: typeof raw?.error === 'string' && raw.error.length > 0,
    missing: listValue(raw?.missing),
    degraded: listValue(raw?.degraded),
    featureFlags: mapFeatureFlags(raw?.feature_flags),
    configuredCampaignCount: numberValue(raw?.configured_campaign_count),
    configuredTierMapEntries: numberValue(raw?.configured_tier_map_entries),
    retention: objectValue(raw?.retention),
    lastCheck: timestamp(raw?.last_check) ?? undefined,
  };
}

function mapGroup(raw?: RawPatreonStatusGroup): PatreonStatusGroup {
  const source = objectValue(raw);
  const { status, enabled, ready, configured, degraded, ...details } = source;
  return {
    status: typeof status === 'string' ? status : 'unknown',
    enabled: typeof enabled === 'boolean' ? enabled : undefined,
    ready: typeof ready === 'boolean' ? ready : undefined,
    configured: typeof configured === 'boolean' ? configured : undefined,
    degraded: typeof degraded === 'boolean' ? degraded : undefined,
    details,
  };
}

class PatreonService {
  async getStatus(): Promise<PatreonAdminStatus> {
    const res = await apiClient.get<RawPatreonAdminStatusResponse>(
      `${BASE}/status`
    );
    const data = res as unknown as RawPatreonAdminStatusResponse;
    return {
      success: bool(data.success),
      status: data.status || 'unknown',
      generatedAt: timestamp(data.generated_at) ?? undefined,
      readiness: mapReadiness(data.readiness),
      creatorToken: mapGroup(data.creator_token),
      webhooks: mapGroup(data.webhooks),
      snapshots: mapGroup(data.snapshots),
      tierMap: mapGroup(data.tier_map),
      proofDelivery: mapGroup(data.proof_delivery),
      s2s: mapGroup(data.s2s),
      worker: mapGroup(data.worker),
      syncQueue: mapGroup(data.sync_queue),
      databaseClock: mapGroup(data.database_clock),
      metrics: objectValue(data.metrics),
    };
  }

  async getEntitlements(
    params: PatreonEntitlementListParams = {}
  ): Promise<PatreonEntitlementList> {
    const res = await apiClient.get<RawPatreonEntitlementListResponse>(
      `${BASE}/entitlements`,
      cleanParams({
        limit: params.limit,
        offset: params.offset,
        status: params.status,
        link_status: params.linkStatus,
        plan_code: params.planCode,
        search: params.search,
      })
    );
    const data = res as unknown as RawPatreonEntitlementListResponse;
    const items = (data.items ?? []).map(mapEntitlement);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async getEntitlement(userHash: string): Promise<PatreonEntitlementDetail> {
    // The admin endpoint returns the detail object directly (not ApiResponse-wrapped).
    const res = await apiClient.get<RawPatreonEntitlementDetail>(
      `${BASE}/entitlements/${encodeURIComponent(userHash)}`
    );
    return mapEntitlementDetail(res);
  }

  async getEntitlementHistory(
    userHash: string,
    limit = 50
  ): Promise<PatreonHistoryItem[]> {
    const res = await apiClient.get<RawPatreonHistoryResponse>(
      `${BASE}/entitlements/${encodeURIComponent(userHash)}/history`,
      { limit }
    );
    const data = res as unknown as RawPatreonHistoryResponse;
    return (data.items ?? []).map(mapHistoryItem);
  }

  async getTierMap(
    params: { limit?: number; offset?: number; active?: boolean } = {}
  ): Promise<PatreonTierMapList> {
    const res = await apiClient.get<RawPatreonTierMapResponse>(
      `${BASE}/tier-map`,
      cleanParams({
        limit: params.limit,
        offset: params.offset,
        active: params.active,
      })
    );
    const data = res as unknown as RawPatreonTierMapResponse;
    const items = (data.items ?? []).map(mapTierMapEntry);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async getSyncJobs(params: ListParams = {}): Promise<PatreonSyncJobList> {
    const res = await apiClient.get<RawPatreonSyncJobListResponse>(
      `${BASE}/sync-jobs`,
      cleanParams({
        limit: params.limit,
        offset: params.offset,
        status: params.status,
      })
    );
    const data = res as unknown as RawPatreonSyncJobListResponse;
    const items = (data.items ?? []).map(mapSyncJob);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async getWebhooks(params: ListParams = {}): Promise<PatreonWebhookList> {
    const res = await apiClient.get<RawPatreonWebhookListResponse>(
      `${BASE}/webhooks`,
      cleanParams({
        limit: params.limit,
        offset: params.offset,
        status: params.status,
      })
    );
    const data = res as unknown as RawPatreonWebhookListResponse;
    const items = (data.items ?? []).map(mapWebhookDelivery);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async resync(request: PatreonResyncRequest): Promise<PatreonResyncResult> {
    const res = await apiClient.post<RawPatreonResyncResponse>(
      `${BASE}/resync`,
      {
        scope: request.scope,
        user_hash: request.scope === 'user' ? request.userHash : undefined,
        reason: request.reason?.trim() || undefined,
        force: request.force ?? false,
      }
    );
    const data = res as unknown as RawPatreonResyncResponse;
    return {
      accepted: bool(data.accepted),
      status: String(data.status || (data.accepted ? 'queued' : 'unknown')),
      correlationId: stringOrNull(data.correlation_id),
      message: stringOrNull(data.message),
    };
  }
}

export const patreonService = new PatreonService();
export default PatreonService;
