import type {
  PatreonAdminStatus,
  PatreonEntitlement,
} from '@/types/patreon.types';

type StatusOverrides = Partial<Omit<PatreonAdminStatus, 'readiness'>> & {
  readiness?: Partial<Omit<PatreonAdminStatus['readiness'], 'featureFlags'>> & {
    featureFlags?: Partial<PatreonAdminStatus['readiness']['featureFlags']>;
  };
};

/** A fully enabled, healthy status payload; override what a test needs. */
export function makeStatus(
  overrides: StatusOverrides = {}
): PatreonAdminStatus {
  const base: PatreonAdminStatus = {
    success: true,
    status: 'healthy',
    generatedAt: '2026-06-18T12:00:00Z',
    readiness: {
      status: 'ready',
      ready: true,
      disabled: false,
      checkFailed: false,
      missing: [],
      degraded: [],
      featureFlags: {
        linking: true,
        webhooks: true,
        sync: true,
        s2sEntitlement: true,
        creatorTokenRefresh: false,
        rawPayloadCapture: false,
      },
      configuredCampaignCount: 1,
      configuredTierMapEntries: 3,
      retention: {
        proof_retention_after_expiry_hours: 24,
        webhook_delivery_retention_days: 90,
      },
    },
    creatorToken: {
      status: 'configured',
      configured: true,
      degraded: false,
      details: { source: 'environment' },
    },
    webhooks: {
      status: 'healthy',
      enabled: true,
      details: { signature_failure_count: 0, retrying_deliveries: 0 },
    },
    snapshots: {
      status: 'healthy',
      details: {
        linked_count: 12,
        active_paid_count: 9,
        stale_snapshot_count: 0,
      },
    },
    tierMap: {
      status: 'healthy',
      details: { configured_entries: 3, misses_24h: 0 },
    },
    proofDelivery: {
      status: 'healthy',
      details: { delivered_24h: 2, failed_24h: 0, in_flight: 0 },
    },
    s2s: { status: 'healthy', enabled: true, ready: true, details: {} },
    worker: {
      status: 'healthy',
      details: { latest_heartbeat_age_seconds: 20, latest_mode: 'queued' },
    },
    syncQueue: {
      status: 'healthy',
      details: {
        pending_jobs: 1,
        running_jobs: 0,
        retry_jobs: 0,
        failed_jobs: 0,
      },
    },
    databaseClock: { status: 'healthy', details: { utc_offset_seconds: 0 } },
    metrics: {},
  };
  return {
    ...base,
    ...overrides,
    readiness: {
      ...base.readiness,
      ...overrides.readiness,
      featureFlags: {
        ...base.readiness.featureFlags,
        ...overrides.readiness?.featureFlags,
      },
    },
  };
}

export const disabledReadiness = {
  status: 'disabled',
  ready: false,
  disabled: true,
  featureFlags: {
    linking: false,
    webhooks: false,
    sync: false,
    s2sEntitlement: false,
  },
};

export const entitlementRow: PatreonEntitlement = {
  userHash: 'usr-aaa',
  displayName: 'alice',
  status: 'active',
  linkStatus: 'linked',
  planCode: 'tier1',
  tierCode: 'gold',
  tierName: 'Gold',
  nextRenewalAt: '2099-07-01T00:00:00Z',
  lastSyncedAt: '2026-06-20T00:00:00Z',
  staleAfter: '2099-06-21T00:00:00Z',
  updatedAt: '2026-06-20T01:00:00Z',
};
