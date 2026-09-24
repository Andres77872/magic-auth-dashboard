import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiKeyMutations, useApiKeys } from '../useApiKeys';
import type { ApiKey, ApiKeyPage, CreatedApiKey } from '@/types/api-key.types';

const mockService = vi.hoisted(() => ({
  listKeys: vi.fn(),
  getKey: vi.fn(),
  createKey: vi.fn(),
  updateKey: vi.fn(),
  revokeKey: vi.fn(),
}));

vi.mock('@/services/api-key.service', () => ({ apiKeyService: mockService }));

function makeKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'pub-abc123',
    public_id: 'pub-abc123',
    name: 'Billing worker',
    description: null,
    project_id: 'proj-internal-1',
    owner_user_id: 'usr-internal-1',
    is_active: true,
    expires_at: null,
    last_used_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    revoked_at: null,
    revoke_reason: null,
    fingerprint: 'ABC123DEF456',
    secret_last4: 'xyz0',
    hash_algorithm: 'hmac-sha256-v1',
    project_hash: 'proj-hash-1',
    project_name: 'Alpha',
    ...overrides,
  };
}

function makePage(keys: ApiKey[], total = keys.length): ApiKeyPage {
  return { keys, total, limit: 25, offset: 0 };
}

describe('useApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a page for the given filters and exposes the backend total', async () => {
    mockService.listKeys.mockResolvedValue(makePage([makeKey()], 42));

    const { result } = renderHook(() =>
      useApiKeys({
        projectHash: 'proj-hash-1',
        activeOnly: true,
        limit: 25,
        offset: 50,
      })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockService.listKeys).toHaveBeenCalledWith({
      userHash: undefined,
      projectHash: 'proj-hash-1',
      activeOnly: true,
      limit: 25,
      offset: 50,
    });
    expect(result.current.keys).toHaveLength(1);
    expect(result.current.total).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it('sends owner and project filters together', async () => {
    mockService.listKeys.mockResolvedValue(makePage([]));

    renderHook(() =>
      useApiKeys({ userHash: 'usr-hash-1', projectHash: 'proj-hash-1' })
    );

    await waitFor(() => expect(mockService.listKeys).toHaveBeenCalledTimes(1));
    expect(mockService.listKeys.mock.calls[0][0]).toMatchObject({
      userHash: 'usr-hash-1',
      projectHash: 'proj-hash-1',
    });
  });

  it('does not fetch while disabled (root without a filter)', async () => {
    const { result } = renderHook(() => useApiKeys({ enabled: false }));

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mockService.listKeys).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.keys).toEqual([]);
  });

  it('surfaces request failures as an error message', async () => {
    mockService.listKeys.mockRejectedValue(
      new Error(
        'Root users must provide at least user_hash or project_hash filter'
      )
    );

    const { result } = renderHook(() => useApiKeys());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.keys).toEqual([]);
    expect(result.current.error).toBe(
      'Root users must provide at least user_hash or project_hash filter'
    );
  });
});

describe('useApiKeyMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a key and returns the one-time token', async () => {
    const created: CreatedApiKey = {
      ...makeKey(),
      api_key: 'sk_pub-abc123.secret',
    };
    mockService.createKey.mockResolvedValue(created);
    const { result } = renderHook(() => useApiKeyMutations());

    let response: CreatedApiKey | undefined;
    await act(async () => {
      response = await result.current.createKey({
        user_hash: 'usr-hash-1',
        project_hash: 'proj-hash-1',
      });
    });

    expect(response?.api_key).toBe('sk_pub-abc123.secret');
    expect(mockService.createKey).toHaveBeenCalledWith({
      user_hash: 'usr-hash-1',
      project_hash: 'proj-hash-1',
    });
    expect(result.current.pending).toBeNull();
  });

  it('tracks the pending mutation while a revoke is in flight', async () => {
    let resolveRevoke: (value: {
      key_id: string;
      revoked_at: string;
    }) => void = () => undefined;
    mockService.revokeKey.mockReturnValue(
      new Promise((resolve) => {
        resolveRevoke = resolve;
      })
    );
    const { result } = renderHook(() => useApiKeyMutations());

    let pendingPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      pendingPromise = result.current.revokeKey('pub-abc123');
    });
    expect(result.current.pending).toBe('revoke');

    await act(async () => {
      resolveRevoke({
        key_id: 'pub-abc123',
        revoked_at: '2026-01-02T00:00:00Z',
      });
      await pendingPromise;
    });
    expect(result.current.pending).toBeNull();
    expect(mockService.revokeKey).toHaveBeenCalledWith('pub-abc123');
  });

  it('rethrows failures so the caller can explain them', async () => {
    mockService.updateKey.mockRejectedValue(
      new Error('Recent reauthentication required')
    );
    const { result } = renderHook(() => useApiKeyMutations());

    await act(async () => {
      await expect(
        result.current.updateKey('pub-abc123', { name: 'New name' })
      ).rejects.toThrow('Recent reauthentication required');
    });
    expect(result.current.pending).toBeNull();
  });
});
