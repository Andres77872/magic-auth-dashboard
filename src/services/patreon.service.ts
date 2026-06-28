/**
 * Patreon admin status service.
 *
 * Read-only ROOT dashboard contract for Patreon entitlement/link operations.
 */

import { apiClient } from './api.client';
import type { PaginationResponse } from '@/types/api.types';
import type {
  PatreonAdminStatus,
  PatreonEntitlement,
  PatreonEntitlementDetail,
  PatreonEntitlementList,
  PatreonFeatureFlags,
  PatreonReadiness,
  PatreonResyncRequest,
  PatreonResyncResult,
  PatreonStatusGroup,
  PatreonSyncJob,
  PatreonSyncJobList,
  PatreonTierMap,
  PatreonTierMapEntry,
  PatreonWebhookDelivery,
  PatreonWebhookList,
  RawPatreonAdminStatusResponse,
  RawPatreonEntitlement,
  RawPatreonEntitlementDetail,
  RawPatreonEntitlementListResponse,
  RawPatreonFeatureFlags,
  RawPatreonPagination,
  RawPatreonReadiness,
  RawPatreonResyncResponse,
  RawPatreonStatusGroup,
  RawPatreonSyncJob,
  RawPatreonSyncJobListResponse,
  RawPatreonTierMapEntry,
  RawPatreonTierMapResponse,
  RawPatreonWebhookDelivery,
  RawPatreonWebhookListResponse,
} from '@/types/patreon.types';

const BASE = '/admin/patreon';

interface ListParams {
  limit?: number;
  offset?: number;
  status?: string;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function cleanListParams(params: ListParams): Record<string, string | number> {
  const clean: Record<string, string | number> = {};
  if (typeof params.limit === 'number') clean.limit = params.limit;
  if (typeof params.offset === 'number') clean.offset = params.offset;
  if (typeof params.status === 'string' && params.status !== '') clean.status = params.status;
  return clean;
}

function mapPagination(raw: RawPatreonPagination | undefined, fallbackCount: number): PaginationResponse {
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
    lastSyncedAt: stringOrNull(raw.last_synced_at),
    updatedAt: stringOrNull(raw.updated_at),
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
    effectiveFrom: stringOrNull(raw.effective_from),
    effectiveUntil: stringOrNull(raw.effective_until),
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
    notBefore: stringOrNull(raw.not_before),
    source: stringOrNull(raw.source),
    createdAt: stringOrNull(raw.created_at),
    updatedAt: stringOrNull(raw.updated_at),
    completedAt: stringOrNull(raw.completed_at),
    hasError: bool(raw.has_error),
  };
}

function mapWebhookDelivery(raw: RawPatreonWebhookDelivery): PatreonWebhookDelivery {
  return {
    deliveryId: String(raw.delivery_id || ''),
    eventType: String(raw.event_type || ''),
    status: String(raw.status || ''),
    signatureValid: bool(raw.signature_valid),
    receivedAt: stringOrNull(raw.received_at),
    processedAt: stringOrNull(raw.processed_at),
  };
}

function mapEntitlementDetail(raw: RawPatreonEntitlementDetail): PatreonEntitlementDetail {
  const ent = raw.entitlement || {};
  return {
    userHash: String(raw.user_hash || ''),
    externalSource: stringOrNull(ent.external_source),
    status: String(ent.status || 'free'),
    planCode: String(ent.plan_code || 'free'),
    tierCode: stringOrNull(ent.tier_code),
    tierName: stringOrNull(ent.tier_name),
    linkStatus: String(ent.link_status || 'none'),
    nextRenewalAt: stringOrNull(ent.next_renewal_at),
    gracePeriodUntil: stringOrNull(ent.grace_period_until),
    lastSyncedAt: stringOrNull(ent.last_synced_at),
    staleAfter: stringOrNull(ent.stale_after),
  };
}

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
    missing: listValue(raw?.missing),
    degraded: listValue(raw?.degraded),
    featureFlags: mapFeatureFlags(raw?.feature_flags),
    configuredCampaignCount: numberValue(raw?.configured_campaign_count),
    configuredTierMapEntries: numberValue(raw?.configured_tier_map_entries),
    retention: objectValue(raw?.retention),
    lastCheck: raw?.last_check,
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
    const res = await apiClient.get<RawPatreonAdminStatusResponse>(`${BASE}/status`);
    const data = res as unknown as RawPatreonAdminStatusResponse;
    return {
      success: bool(data.success),
      status: data.status || 'unknown',
      generatedAt: data.generated_at,
      readiness: mapReadiness(data.readiness),
      creatorToken: mapGroup(data.creator_token),
      webhooks: mapGroup(data.webhooks),
      snapshots: mapGroup(data.snapshots),
      tierMap: mapGroup(data.tier_map),
      proofDelivery: mapGroup(data.proof_delivery),
      s2s: mapGroup(data.s2s),
      worker: mapGroup(data.worker),
      syncQueue: mapGroup(data.sync_queue),
      metrics: objectValue(data.metrics),
    };
  }

  async getEntitlements(params: ListParams = {}): Promise<PatreonEntitlementList> {
    const res = await apiClient.get<RawPatreonEntitlementListResponse>(
      `${BASE}/entitlements`,
      cleanListParams(params)
    );
    const data = res as unknown as RawPatreonEntitlementListResponse;
    const items = (data.items ?? []).map(mapEntitlement);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async getEntitlement(userHash: string): Promise<PatreonEntitlementDetail> {
    // The admin endpoint returns the detail object directly (not ApiResponse-wrapped);
    // RawPatreonEntitlementDetail's optional fields make a cast unnecessary.
    const res = await apiClient.get<RawPatreonEntitlementDetail>(
      `${BASE}/entitlements/${encodeURIComponent(userHash)}`
    );
    return mapEntitlementDetail(res);
  }

  async getTierMap(): Promise<PatreonTierMap> {
    const res = await apiClient.get<RawPatreonTierMapResponse>(`${BASE}/tier-map`);
    const data = res as unknown as RawPatreonTierMapResponse;
    return (data.items ?? []).map(mapTierMapEntry);
  }

  async getSyncJobs(params: ListParams = {}): Promise<PatreonSyncJobList> {
    const res = await apiClient.get<RawPatreonSyncJobListResponse>(
      `${BASE}/sync-jobs`,
      cleanListParams(params)
    );
    const data = res as unknown as RawPatreonSyncJobListResponse;
    const items = (data.items ?? []).map(mapSyncJob);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async getWebhooks(params: ListParams = {}): Promise<PatreonWebhookList> {
    const res = await apiClient.get<RawPatreonWebhookListResponse>(
      `${BASE}/webhooks`,
      cleanListParams(params)
    );
    const data = res as unknown as RawPatreonWebhookListResponse;
    const items = (data.items ?? []).map(mapWebhookDelivery);
    return { items, pagination: mapPagination(data.pagination, items.length) };
  }

  async resync(request: PatreonResyncRequest): Promise<PatreonResyncResult> {
    const res = await apiClient.post<RawPatreonResyncResponse>(`${BASE}/resync`, {
      scope: request.scope,
      user_hash: request.userHash,
      reason: request.reason,
      force: request.force ?? false,
    });
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
