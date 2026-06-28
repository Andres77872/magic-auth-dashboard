import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePatreonEntitlements } from '../usePatreonEntitlements';
import { patreonService } from '@/services/patreon.service';
import type { PatreonEntitlementList } from '@/types/patreon.types';

vi.mock('@/services/patreon.service', () => ({
  patreonService: {
    getEntitlements: vi.fn(),
  },
}));

const mockService = vi.mocked(patreonService);

const sample: PatreonEntitlementList = {
  items: [
    {
      userHash: 'usr-aaa',
      displayName: 'alice',
      status: 'active',
      linkStatus: 'linked',
      planCode: 'tier1',
      tierCode: 'gold',
      tierName: 'Gold',
      lastSyncedAt: '2026-06-20T00:00:00Z',
      updatedAt: '2026-06-20T01:00:00Z',
    },
  ],
  pagination: { limit: 20, offset: 0, total: 1, has_more: false },
};

describe('usePatreonEntitlements', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches entitlements on mount', async () => {
    mockService.getEntitlements.mockResolvedValue(sample);

    const { result } = renderHook(() => usePatreonEntitlements());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.entitlements).toEqual(sample.items);
    expect(result.current.pagination).toEqual(sample.pagination);
    expect(mockService.getEntitlements).toHaveBeenCalledTimes(1);
  });

  it('merges filter overrides into the fetch query', async () => {
    mockService.getEntitlements.mockResolvedValue(sample);

    const { result } = renderHook(() => usePatreonEntitlements());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.setFilters({ status: 'active', offset: 0 });
      await result.current.fetchEntitlements({ status: 'active', offset: 0 });
    });

    expect(mockService.getEntitlements).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'active', offset: 0 })
    );
  });

  it('sets an error when the request fails', async () => {
    mockService.getEntitlements.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => usePatreonEntitlements());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('boom');
  });
});
