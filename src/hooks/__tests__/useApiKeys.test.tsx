import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiKeys } from '../useApiKeys';
import { apiKeyService } from '@/services';
import type { ApiKey, ApiKeyListResponse, CreateApiKeyResponse } from '@/types/api-key.types';

vi.mock('@/services', () => ({
  apiKeyService: {
    listKeys: vi.fn(),
    listKeysByUser: vi.fn(),
    listKeysByProject: vi.fn(),
    createKey: vi.fn(),
    updateKey: vi.fn(),
    revokeKey: vi.fn(),
  },
}));

const mockService = vi.mocked(apiKeyService);

const createMockKey = (overrides: Partial<ApiKey> = {}): ApiKey => ({
  id: 'key-1',
  public_id: 'pub-abc123',
  name: 'Test Key',
  fingerprint: 'ABC123DEF456',
  secret_last4: 'xyz0',
  project_id: 'proj-1',
  owner_user_id: 'user-1',
  expires_at: '2026-12-31',
  is_active: true,
  created_at: '2025-01-01',
  ...overrides,
});

const createMockListResponse = (keys: ApiKey[] = []): ApiKeyListResponse => ({
  success: true,
  message: 'OK',
  data: {
    keys,
    total: keys.length,
    limit: 10,
    offset: 0,
  },
});

describe('useApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listKeys (admin scope)', () => {
    it('fetches all API keys via admin endpoint', async () => {
      const mockKeys = [createMockKey()];
      mockService.listKeys.mockResolvedValue(createMockListResponse(mockKeys));

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.keys).toHaveLength(1);
      expect(result.current.keys[0].fingerprint).toBe('ABC123DEF456');
      expect(result.current.totalCount).toBe(1);
      expect(result.current.error).toBeNull();
      expect(mockService.listKeys).toHaveBeenCalled();
    });

    it('sets error state on API failure', async () => {
      mockService.listKeys.mockResolvedValue({
        success: false,
        message: 'Unauthorized',
        data: undefined as any,
      });

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.keys).toEqual([]);
      expect(result.current.error).toBe('Unauthorized');
    });

    it('handles network errors', async () => {
      mockService.listKeys.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.keys).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });

    it('does not auto-fetch when autoFetch is false', async () => {
      mockService.listKeys.mockResolvedValue(createMockListResponse());

      const { result } = renderHook(() => useApiKeys({ autoFetch: false }));

      expect(result.current.isLoading).toBe(false);
      expect(mockService.listKeys).not.toHaveBeenCalled();
    });
  });

  describe('listKeysByUser', () => {
    it('fetches keys filtered by user hash', async () => {
      const mockKeys = [createMockKey({ owner_user_id: 'usr_target' })];
      mockService.listKeysByUser.mockResolvedValue(createMockListResponse(mockKeys));

      const { result } = renderHook(() => useApiKeys({ userHash: 'usr_target' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockService.listKeysByUser).toHaveBeenCalledWith('usr_target', { limit: 10, offset: 0 });
      expect(result.current.keys).toHaveLength(1);
      expect(result.current.keys[0].owner_user_id).toBe('usr_target');
    });
  });

  describe('listKeysByProject', () => {
    it('fetches keys filtered by project hash', async () => {
      const mockKeys = [createMockKey({ project_name: 'Filtered Project' })];
      mockService.listKeysByProject.mockResolvedValue(createMockListResponse(mockKeys));

      const { result } = renderHook(() => useApiKeys({ projectHash: 'prj_xyz' }));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockService.listKeysByProject).toHaveBeenCalledWith('prj_xyz', { limit: 10, offset: 0 });
      expect(result.current.keys).toHaveLength(1);
    });
  });

  describe('refetch', () => {
    it('refetches keys with custom pagination params', async () => {
      mockService.listKeys.mockResolvedValue(createMockListResponse());

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refetch({ limit: 20, offset: 10 });
      });

      expect(mockService.listKeys).toHaveBeenCalledWith({ limit: 20, offset: 10 });
    });
  });

  describe('createKey (admin creates FOR consumer)', () => {
    it('creates key with user_hash and returns response', async () => {
      const mockResponse: CreateApiKeyResponse = {
        success: true,
        message: 'Created',
        data: {
          ...createMockKey(),
          api_key: 'sk_pub-abc123.secret123',
        },
      };
      mockService.createKey.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApiKeys({ autoFetch: false }));

      await act(async () => {
        const response = await result.current.createKey({
          user_hash: 'usr_consumer1',
          project_hash: 'proj-1',
          name: 'New Key',
        });
        expect(response.success).toBe(true);
        expect(response.data.api_key).toBe('sk_pub-abc123.secret123');
      });
    });

    it('throws on creation failure', async () => {
      mockService.createKey.mockResolvedValue({
        success: false,
        message: 'Invalid project',
        data: undefined as any,
      });

      const { result } = renderHook(() => useApiKeys({ autoFetch: false }));

      await act(async () => {
        try {
          await result.current.createKey({ user_hash: 'usr_x', project_hash: 'invalid' });
        } catch (e) {
          expect(e).toBeInstanceOf(Error);
          expect((e as Error).message).toBe('Invalid project');
        }
      });
    });
  });

  describe('revokeKey', () => {
    it('optimistically updates key status on revoke', async () => {
      const mockKeys = [createMockKey()];
      mockService.listKeys.mockResolvedValue(createMockListResponse(mockKeys));
      mockService.revokeKey.mockResolvedValue({ success: true, message: 'Revoked' });

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.keys).toHaveLength(1);
      });

      await act(async () => {
        const success = await result.current.revokeKey('pub-abc123');
        expect(success).toBe(true);
      });

      expect(result.current.keys[0].is_active).toBe(false);
      expect(result.current.keys[0].revoked_at).toBeDefined();
    });

    it('sets error on revoke failure', async () => {
      const mockKeys = [createMockKey()];
      mockService.listKeys.mockResolvedValue(createMockListResponse(mockKeys));
      mockService.revokeKey.mockResolvedValue({ success: false, message: 'Cannot revoke' });

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.keys).toHaveLength(1);
      });

      await act(async () => {
        const success = await result.current.revokeKey('pub-abc123');
        expect(success).toBe(false);
      });

      expect(result.current.error).toBe('Cannot revoke');
      expect(result.current.keys[0].is_active).toBe(true);
    });
  });

  describe('updateKey', () => {
    it('updates key in list after successful update', async () => {
      const mockKeys = [createMockKey()];
      mockService.listKeys.mockResolvedValue(createMockListResponse(mockKeys));
      
      const updatedKey = createMockKey({ name: 'Updated Name' });
      mockService.updateKey.mockResolvedValue({
        success: true,
        message: 'Updated',
        data: updatedKey,
      });

      const { result } = renderHook(() => useApiKeys());

      await waitFor(() => {
        expect(result.current.keys).toHaveLength(1);
      });

      await act(async () => {
        const success = await result.current.updateKey('pub-abc123', { name: 'Updated Name' });
        expect(success).toBe(true);
      });

      expect(result.current.keys[0].name).toBe('Updated Name');
    });
  });
});
