import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonStatusDashboard } from '../PatreonStatusDashboard';
import { usePatreonStatus } from '@/hooks/usePatreonStatus';
import type { PatreonAdminStatus } from '@/types/patreon.types';

vi.mock('@/hooks/usePatreonStatus', () => ({
  usePatreonStatus: vi.fn(),
}));

const mockUsePatreonStatus = vi.mocked(usePatreonStatus);

type PatreonStatusOverrides = Partial<Omit<PatreonAdminStatus, 'readiness'>> & {
  readiness?: Partial<Omit<PatreonAdminStatus['readiness'], 'featureFlags'>> & {
    featureFlags?: Partial<PatreonAdminStatus['readiness']['featureFlags']>;
  };
};

function makeStatus(overrides: PatreonStatusOverrides = {}): PatreonAdminStatus {
  const base: PatreonAdminStatus = {
    success: true,
    status: 'disabled',
    generatedAt: '2026-06-18T12:00:00Z',
    readiness: {
      status: 'disabled',
      ready: false,
      disabled: true,
      missing: [],
      degraded: [],
      featureFlags: {
        linking: false,
        webhooks: false,
        sync: false,
        s2sEntitlement: false,
        creatorTokenRefresh: false,
        rawPayloadCapture: false,
      },
      configuredCampaignCount: 0,
      configuredTierMapEntries: 0,
      retention: {},
    },
    creatorToken: { status: 'disabled', configured: false, degraded: false, details: {} },
    webhooks: { status: 'disabled', enabled: false, details: {} },
    snapshots: { status: 'disabled', details: {} },
    tierMap: { status: 'disabled', details: {} },
    proofDelivery: { status: 'disabled', details: {} },
    s2s: { status: 'disabled', enabled: false, ready: false, details: {} },
    worker: { status: 'disabled', details: {} },
    syncQueue: { status: 'disabled', details: {} },
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

function renderWithStatus(status: PatreonAdminStatus): void {
  mockUsePatreonStatus.mockReturnValue({
    status,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  render(<PatreonStatusDashboard />);
}

describe('PatreonStatusDashboard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the disabled state and safety note', () => {
    renderWithStatus(makeStatus());

    expect(screen.getByText('Patreon operations')).toBeInTheDocument();
    expect(screen.getByText('All primary Patreon surfaces are disabled')).toBeInTheDocument();
    expect(screen.getByText('Linking')).toBeInTheDocument();
    expect(screen.getByText('S2S entitlement')).toBeInTheDocument();
    expect(screen.getByText(/Patreon is entitlement\/link only/i)).toBeInTheDocument();
  });

  it('renders the ready rollout state', () => {
    renderWithStatus(
      makeStatus({
        status: 'ready',
        readiness: {
          status: 'ready',
          ready: true,
          disabled: false,
          configuredCampaignCount: 1,
          configuredTierMapEntries: 3,
          featureFlags: {
            linking: true,
            webhooks: true,
            sync: true,
            s2sEntitlement: true,
            creatorTokenRefresh: true,
            rawPayloadCapture: false,
          },
        },
      })
    );

    expect(screen.getByText('Ready for enabled Patreon surfaces')).toBeInTheDocument();
    expect(screen.getByText('Creator token refresh')).toBeInTheDocument();
    expect(screen.getByText('Raw payload capture')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders degraded and missing-env readiness details', () => {
    renderWithStatus(
      makeStatus({
        status: 'degraded',
        readiness: {
          status: 'not_ready',
          ready: false,
          disabled: false,
          missing: ['PATREON_WEBHOOK_SECRET'],
          degraded: ['Creator token missing campaigns.members scope'],
          configuredCampaignCount: 0,
          configuredTierMapEntries: 0,
        },
      })
    );

    expect(screen.getByText('Configuration needs attention before activation')).toBeInTheDocument();
    expect(screen.getByText('PATREON_WEBHOOK_SECRET')).toBeInTheDocument();
    expect(screen.getByText('Creator token missing campaigns.members scope')).toBeInTheDocument();
  });
});
