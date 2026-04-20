/**
 * useApiKeys Hook
 *
 * Hook for admin-managed API key operations with loading/error/refetch states.
 * Supports listing all keys, filtering by user or project, and CRUD operations.
 * Admins manage tokens FOR consumer users — this is NOT self-service.
 */

import { useState, useCallback, useEffect } from 'react';
import { apiKeyService } from '@/services';
import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  UpdateApiKeyRequest,
} from '@/types/api-key.types';

interface UseApiKeysOptions {
  autoFetch?: boolean;
  limit?: number;
  offset?: number;
  /** Filter by consumer user hash */
  userHash?: string;
  /** Filter by project hash */
  projectHash?: string;
}

interface UseApiKeysReturn {
  keys: ApiKey[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  createKey: (request: CreateApiKeyRequest) => Promise<CreateApiKeyResponse>;
  revokeKey: (publicId: string) => Promise<boolean>;
  updateKey: (publicId: string, request: UpdateApiKeyRequest) => Promise<boolean>;
  refetch: (params?: { limit?: number; offset?: number }) => Promise<void>;
}

export function useApiKeys(options?: UseApiKeysOptions): UseApiKeysReturn {
  const { autoFetch = true, limit = 10, offset = 0, userHash, projectHash } = options || {};

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  // Fetch keys — routes to correct admin endpoint based on filter
  const fetchKeys = useCallback(async (fetchParams?: { limit?: number; offset?: number }) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        limit: fetchParams?.limit ?? limit,
        offset: fetchParams?.offset ?? offset,
      };

      let response;
      if (userHash) {
        response = await apiKeyService.listKeysByUser(userHash, params);
      } else if (projectHash) {
        response = await apiKeyService.listKeysByProject(projectHash, params);
      } else {
        response = await apiKeyService.listKeys(params);
      }

      if (response.success && response.data) {
        setKeys(response.data.keys);
        setTotalCount(response.data.total);
      } else {
        setError(response.message || 'Failed to load API keys');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to load API keys';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, userHash, projectHash]);

  // Auto-fetch on mount — but ONLY when a filter is provided.
  // The backend requires user_hash or project_hash for root users.
  const hasFilter = Boolean(userHash || projectHash);

  useEffect(() => {
    if (autoFetch && hasFilter) {
      void fetchKeys();
    }
  }, [autoFetch, hasFilter, fetchKeys]);

  // Create key
  const createKey = useCallback(async (request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiKeyService.createKey(request);
      if (response.success) {
        // Don't add to keys list yet - user needs to see reveal modal first
        // Will refetch after reveal modal confirmation
        return response;
      } else {
        setError(response.message || 'Failed to create API key');
        throw new Error(response.message || 'Failed to create API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to create API key';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Revoke key
  const revokeKey = useCallback(async (publicId: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await apiKeyService.revokeKey(publicId);
      if (response.success) {
        // Optimistically update the key status to revoked
        setKeys(prevKeys => 
          prevKeys.map(key => 
            key.public_id === publicId 
              ? { ...key, is_active: false, revoked_at: new Date().toISOString() }
              : key
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to revoke API key');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to revoke API key';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Update key
  const updateKey = useCallback(async (publicId: string, request: UpdateApiKeyRequest): Promise<boolean> => {
    setError(null);

    try {
      const response = await apiKeyService.updateKey(publicId, request);
      if (response.success && response.data) {
        // Update the key in the list
        setKeys(prevKeys => 
          prevKeys.map(key => 
            key.public_id === publicId ? response.data : key
          )
        );
        return true;
      } else {
        setError(response.message || 'Failed to update API key');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to update API key';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Refetch
  const refetch = useCallback(async (params?: { limit?: number; offset?: number }) => {
    await fetchKeys(params);
  }, [fetchKeys]);

  return {
    keys,
    isLoading,
    error,
    totalCount,
    createKey,
    revokeKey,
    updateKey,
    refetch,
  };
}

export default useApiKeys;
