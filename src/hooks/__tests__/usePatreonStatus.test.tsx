import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatreonStatus } from '../usePatreonStatus';
import { patreonService } from '@/services/patreon.service';
import type { PatreonAdminStatus } from '@/types/patreon.types';

vi.mock('@/services/patreon.service', () => ({
  patreonService: {
    getStatus: vi.fn(),
  },
}));

const mockService = vi.mocked(patreonService);

const sampleStatus: PatreonAdminStatus = {
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
  creatorToken: { status: 'disabled', details: {} },
  webhooks: { status: 'disabled', details: {} },
  snapshots: { status: 'disabled', details: {} },
  tierMap: { status: 'disabled', details: {} },
  proofDelivery: { status: 'disabled', details: {} },
  s2s: { status: 'disabled', details: {} },
  worker: { status: 'disabled', details: {} },
  syncQueue: { status: 'disabled', details: {} },
  metrics: {},
};

describe('usePatreonStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads Patreon status on mount', async () => {
    mockService.getStatus.mockResolvedValue(sampleStatus);

    const { result } = renderHook(() => usePatreonStatus());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toEqual(sampleStatus);
    expect(result.current.error).toBeNull();
    expect(mockService.getStatus).toHaveBeenCalledTimes(1);
  });

  it('sets an error when the status request fails', async () => {
    mockService.getStatus.mockRejectedValue(new Error('Patreon status unavailable'));

    const { result } = renderHook(() => usePatreonStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBeNull();
    expect(result.current.error).toBe('Patreon status unavailable');
  });

  it('supports manual refetch when autoFetch is disabled', async () => {
    mockService.getStatus.mockResolvedValue(sampleStatus);

    const { result } = renderHook(() => usePatreonStatus({ autoFetch: false }));

    expect(result.current.isLoading).toBe(false);
    expect(mockService.getStatus).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.status).toEqual(sampleStatus);
    expect(result.current.error).toBeNull();
    expect(mockService.getStatus).toHaveBeenCalledTimes(1);
  });
});
