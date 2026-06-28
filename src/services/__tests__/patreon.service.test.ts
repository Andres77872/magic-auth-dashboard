/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { patreonService } from '../patreon.service';
import { apiClient } from '../api.client';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = vi.mocked(apiClient);

describe('patreonService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getStatus() maps the snake_case admin response to dashboard domain types', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      status: 'degraded',
      generated_at: '2026-06-18T12:00:00Z',
      readiness: {
        status: 'not_ready',
        ready: false,
        disabled: false,
        missing: ['PATREON_WEBHOOK_SECRET'],
        degraded: ['creator token missing campaigns.members scope'],
        feature_flags: {
          linking: true,
          webhooks: false,
          sync: false,
          s2s_entitlement: true,
          creator_token_refresh: true,
          raw_payload_capture: false,
        },
        configured_campaign_count: 2,
        configured_tier_map_entries: 4,
        retention: { raw_payload_retention_days: 0 },
        last_check: '2026-06-18T11:59:00Z',
      },
      creator_token: {
        status: 'configured',
        configured: true,
        degraded: false,
        expires_at: '2026-07-18T12:00:00Z',
      },
      webhooks: {
        status: 'disabled',
        enabled: false,
        signature_failure_count: 0,
        retrying_deliveries: 1,
      },
      snapshots: {
        status: 'stale',
        stale_snapshot_count: 3,
        oldest_snapshot_age_seconds: 3600,
      },
      tier_map: { status: 'configured', misses_24h: 0 },
      proof_delivery: { status: 'healthy', failed_24h: 0 },
      s2s: { status: 'ready', enabled: true, ready: true },
      worker: { status: 'disabled', sync_enabled: false },
      sync_queue: { status: 'healthy', pending_jobs: 2, retry_jobs: 1 },
      metrics: {
        patreon_stale_snapshot_count: 3,
        patreon_webhook_retrying_deliveries: 1,
      },
    } as never);

    const result = await patreonService.getStatus();

    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/status');
    expect(result.status).toBe('degraded');
    expect(result.generatedAt).toBe('2026-06-18T12:00:00Z');
    expect(result.readiness.featureFlags.s2sEntitlement).toBe(true);
    expect(result.readiness.featureFlags.creatorTokenRefresh).toBe(true);
    expect(result.readiness.configuredCampaignCount).toBe(2);
    expect(result.readiness.configuredTierMapEntries).toBe(4);
    expect(result.creatorToken.configured).toBe(true);
    expect(result.creatorToken.details.expires_at).toBe('2026-07-18T12:00:00Z');
    expect(result.syncQueue.details.pending_jobs).toBe(2);
    expect(result.metrics.patreon_stale_snapshot_count).toBe(3);
  });

  it('getEntitlements() maps rows + pagination and cleans params', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      items: [
        {
          user_hash: 'usr-aaa',
          display_name: 'alice',
          status: 'active',
          link_status: 'linked',
          plan_code: 'tier1',
          tier_code: 'gold',
          tier_name: 'Gold',
          last_synced_at: '2026-06-20T00:00:00Z',
          updated_at: '2026-06-20T01:00:00Z',
        },
      ],
      pagination: { limit: 20, offset: 0, total: 5, has_more: false },
    } as never);

    const result = await patreonService.getEntitlements({ limit: 20, offset: 0, status: 'active' });

    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/entitlements', {
      limit: 20,
      offset: 0,
      status: 'active',
    });
    expect(result.items[0]).toEqual({
      userHash: 'usr-aaa',
      displayName: 'alice',
      status: 'active',
      linkStatus: 'linked',
      planCode: 'tier1',
      tierCode: 'gold',
      tierName: 'Gold',
      lastSyncedAt: '2026-06-20T00:00:00Z',
      updatedAt: '2026-06-20T01:00:00Z',
    });
    expect(result.pagination).toEqual({ limit: 20, offset: 0, total: 5, has_more: false });
  });

  it('getEntitlements() omits empty status from the query params', async () => {
    mockApi.get.mockResolvedValue({ success: true, items: [], pagination: {} } as never);
    await patreonService.getEntitlements({ limit: 20, offset: 0, status: '' });
    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/entitlements', { limit: 20, offset: 0 });
  });

  it('getEntitlement() maps a single detail object', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      user_hash: 'usr-bbb',
      entitlement: {
        external_source: 'patreon',
        status: 'active',
        plan_code: 'tier1',
        tier_code: 'gold',
        tier_name: 'Gold',
        link_status: 'linked',
        last_synced_at: '2026-06-20T00:00:00Z',
        classification_version: 1,
      },
      contract_version: 1,
    } as never);

    const detail = await patreonService.getEntitlement('usr-bbb');
    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/entitlements/usr-bbb');
    expect(detail.userHash).toBe('usr-bbb');
    expect(detail.planCode).toBe('tier1');
    expect(detail.linkStatus).toBe('linked');
    expect(detail.externalSource).toBe('patreon');
  });

  it('getTierMap() maps tier entries', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      items: [
        {
          campaign_fingerprint: 'abc123def456',
          campaign_name: 'Main',
          tier_fingerprint: 'fed654cba321',
          plan_code: 'tier1',
          tier_code: 'gold',
          tier_name: 'Gold',
          priority: 10,
          active: true,
          effective_from: '2026-01-01T00:00:00Z',
          effective_until: null,
        },
      ],
    } as never);

    const entries = await patreonService.getTierMap();
    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/tier-map');
    expect(entries[0].campaignFingerprint).toBe('abc123def456');
    expect(entries[0].tierFingerprint).toBe('fed654cba321');
    expect(entries[0].active).toBe(true);
  });

  it('getSyncJobs() maps jobs + pagination', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      items: [
        {
          job_id: 'psj-1',
          job_type: 'user_member',
          status: 'retry',
          priority: 5,
          attempts: 2,
          max_attempts: 8,
          source: 'manual',
          created_at: '2026-06-20T00:00:00Z',
          has_error: true,
        },
      ],
      pagination: { limit: 20, offset: 0, total: 1, has_more: false },
    } as never);

    const result = await patreonService.getSyncJobs({ limit: 20, offset: 0 });
    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/sync-jobs', { limit: 20, offset: 0 });
    expect(result.items[0].jobId).toBe('psj-1');
    expect(result.items[0].hasError).toBe(true);
    expect(result.pagination.total).toBe(1);
  });

  it('getWebhooks() maps deliveries + pagination', async () => {
    mockApi.get.mockResolvedValue({
      success: true,
      items: [
        {
          delivery_id: 'pwd-1',
          event_type: 'members:update',
          status: 'processed',
          signature_valid: true,
          received_at: '2026-06-20T00:00:00Z',
          processed_at: '2026-06-20T00:00:01Z',
        },
      ],
      pagination: { limit: 20, offset: 0, total: 1, has_more: false },
    } as never);

    const result = await patreonService.getWebhooks({ limit: 20, offset: 0 });
    expect(mockApi.get).toHaveBeenCalledWith('/admin/patreon/webhooks', { limit: 20, offset: 0 });
    expect(result.items[0].eventType).toBe('members:update');
    expect(result.items[0].signatureValid).toBe(true);
  });

  it('resync() posts the request body and maps the result', async () => {
    mockApi.post.mockResolvedValue({
      success: true,
      accepted: true,
      status: 'queued',
      correlation_id: 'psj-xyz',
      message: 'Patreon entitlement resync request accepted.',
    } as never);

    const result = await patreonService.resync({
      scope: 'user',
      userHash: 'usr-aaa',
      reason: 'manual check',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/admin/patreon/resync', {
      scope: 'user',
      user_hash: 'usr-aaa',
      reason: 'manual check',
      force: false,
    });
    expect(result.accepted).toBe(true);
    expect(result.status).toBe('queued');
    expect(result.correlationId).toBe('psj-xyz');
  });
});
