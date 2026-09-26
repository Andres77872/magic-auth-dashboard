/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { systemService } from '../system.service';
import { apiClient } from '../api.client';

vi.mock('../api.client', () => ({
  apiClient: { get: vi.fn() },
}));

const mockApi = vi.mocked(apiClient);

describe('systemService.ping', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the public liveness probe and returns its payload', async () => {
    const payload = {
      success: true,
      message: 'Group-based authentication API is running',
      timestamp: '2026-09-26T12:00:00Z',
    };
    mockApi.get.mockResolvedValue(payload);

    await expect(systemService.ping()).resolves.toEqual(payload);
    expect(mockApi.get).toHaveBeenCalledWith('/system/ping');
  });

  it('rejects a payload that is not a ping response', async () => {
    mockApi.get.mockResolvedValue({ success: true, message: 'ok' });
    await expect(systemService.ping()).rejects.toThrow(
      'The API ping response was not in the expected format.'
    );
  });
});
