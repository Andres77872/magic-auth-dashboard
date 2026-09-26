/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { systemService } from '@/services';
import { useApiStatus } from '../useApiStatus';

vi.mock('@/services', () => ({
  systemService: { ping: vi.fn() },
}));

const mockService = vi.mocked(systemService);

describe('useApiStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports online with the measured round trip', async () => {
    mockService.ping.mockResolvedValue({
      success: true,
      message: 'Group-based authentication API is running',
      timestamp: '2026-09-26T12:00:00Z',
    });
    const { result } = renderHook(() => useApiStatus());
    expect(result.current).toEqual({ status: 'checking', latencyMs: null });

    await waitFor(() => expect(result.current.status).toBe('online'));
    expect(result.current.latencyMs).toEqual(expect.any(Number));
    expect(result.current.latencyMs).toBeGreaterThanOrEqual(0);
    expect(mockService.ping).toHaveBeenCalledTimes(1);
  });

  it('reports offline when the ping fails', async () => {
    mockService.ping.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useApiStatus());
    await waitFor(() => expect(result.current.status).toBe('offline'));
    expect(result.current.latencyMs).toBeNull();
  });
});
