import { useCallback, useState } from 'react';
import { apiKeyService } from '@/services/api-key.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type {
  ApiKey,
  ApiKeyListParams,
  CreateApiKeyRequest,
  CreatedApiKey,
  RevokedApiKey,
  UpdateApiKeyRequest,
} from '@/types/api-key.types';

export interface UseApiKeysOptions extends ApiKeyListParams {
  /**
   * Gate fetching. Root must name an owner or a project (the backend answers
   * 400 otherwise), so the page disables the hook until one is chosen.
   */
  enabled?: boolean;
}

export interface UseApiKeysReturn {
  keys: ApiKey[];
  /** Total matching keys reported by the backend (0 before the first load). */
  total: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** A page of API keys from `GET /api-keys` for the given filters. */
export function useApiKeys({
  userHash,
  projectHash,
  activeOnly,
  limit,
  offset,
  enabled = true,
}: UseApiKeysOptions = {}): UseApiKeysReturn {
  const fetcher = useCallback(
    () =>
      apiKeyService.listKeys({
        userHash,
        projectHash,
        activeOnly,
        limit,
        offset,
      }),
    [userHash, projectHash, activeOnly, limit, offset]
  );
  const { data, isLoading, isRefreshing, error, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return {
    keys: data?.keys ?? [],
    total: data?.total ?? 0,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

export interface UseApiKeyDetailsReturn {
  apiKey: ApiKey | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * `GET /api-keys/{key_id}` — adds owner and project details that some
 * listings omit (user listings carry no owner fields).
 */
export function useApiKeyDetails(keyId: string | null): UseApiKeyDetailsReturn {
  const fetcher = useCallback(async (): Promise<ApiKey> => {
    if (!keyId) throw new Error('No API key selected.');
    return apiKeyService.getKey(keyId);
  }, [keyId]);
  const { data, isLoading, error, refetch } = useAsyncData(fetcher, {
    enabled: Boolean(keyId),
  });
  return {
    apiKey: data && data.public_id === keyId ? data : null,
    isLoading,
    error,
    refetch,
  };
}

export type ApiKeyMutation = 'create' | 'update' | 'revoke';

export interface UseApiKeyMutationsReturn {
  pending: ApiKeyMutation | null;
  /** Resolves with the one-time token; callers must not store or log it. */
  createKey: (request: CreateApiKeyRequest) => Promise<CreatedApiKey>;
  updateKey: (keyId: string, request: UpdateApiKeyRequest) => Promise<ApiKey>;
  revokeKey: (keyId: string, reason?: string) => Promise<RevokedApiKey>;
}

/**
 * Create / update / revoke. Each call resolves only after the API confirms and
 * rethrows failures (including `401 AUTH_1008`, "recent sign-in required") so
 * the caller can explain them.
 */
export function useApiKeyMutations(): UseApiKeyMutationsReturn {
  const [pending, setPending] = useState<ApiKeyMutation | null>(null);

  const track = useCallback(
    async <T>(kind: ApiKeyMutation, run: () => Promise<T>): Promise<T> => {
      setPending(kind);
      try {
        return await run();
      } finally {
        setPending(null);
      }
    },
    []
  );

  const createKey = useCallback(
    (request: CreateApiKeyRequest) =>
      track('create', () => apiKeyService.createKey(request)),
    [track]
  );
  const updateKey = useCallback(
    (keyId: string, request: UpdateApiKeyRequest) =>
      track('update', () => apiKeyService.updateKey(keyId, request)),
    [track]
  );
  const revokeKey = useCallback(
    (keyId: string, reason?: string) =>
      track('revoke', () =>
        reason?.trim()
          ? apiKeyService.revokeKey(keyId, reason)
          : apiKeyService.revokeKey(keyId)
      ),
    [track]
  );

  return { pending, createKey, updateKey, revokeKey };
}

export default useApiKeys;
