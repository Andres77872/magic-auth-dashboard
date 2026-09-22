/**
 * useOAuthConnections Hook
 *
 * List + mutation state for the OAuth connections admin area, modelled on
 * ``useApiKeys``. The hook owns loading, error, pagination and mutations;
 * components own toasts via ``useToast()``.
 *
 * Reading connections is admin-level; creating, editing, activating, disabling and
 * deleting them is root-only server-side. The mutations are exposed here regardless
 * — the UI hides them from non-root users, and the server rejects them anyway.
 */

import { useState, useCallback, useEffect } from 'react';
import { oauthService } from '@/services/oauth.service';
import type {
  OAuthConnectionCreateRequest,
  OAuthConnectionInfo,
  OAuthConnectionListItem,
  OAuthConnectionUpdateRequest,
} from '@/types/oauth.types';

interface UseOAuthConnectionsOptions {
  autoFetch?: boolean;
  limit?: number;
  offset?: number;
  /** Server-side filter on the provider catalog type (``google``, ``oidc``, …). */
  providerType?: string;
  /** Server-side filter on ``draft`` / ``active`` / ``disabled`` / ``archived``. */
  status?: string;
  /** Server-side search over display name and client id. */
  search?: string;
  /** Gate auto-fetching (e.g. while a required filter is still unset). */
  enabled?: boolean;
}

interface UseOAuthConnectionsReturn {
  connections: OAuthConnectionListItem[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  createConnection: (request: OAuthConnectionCreateRequest) => Promise<OAuthConnectionInfo>;
  updateConnection: (
    connectionHash: string,
    request: OAuthConnectionUpdateRequest,
  ) => Promise<OAuthConnectionInfo>;
  activateConnection: (connectionHash: string) => Promise<boolean>;
  disableConnection: (connectionHash: string) => Promise<boolean>;
  deleteConnection: (connectionHash: string) => Promise<boolean>;
  refetch: (params?: { limit?: number; offset?: number }) => Promise<void>;
}

export function useOAuthConnections(
  options?: UseOAuthConnectionsOptions,
): UseOAuthConnectionsReturn {
  const {
    autoFetch = true,
    limit = 50,
    offset = 0,
    providerType,
    status,
    search,
    enabled = true,
  } = options || {};

  const [connections, setConnections] = useState<OAuthConnectionListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(autoFetch && enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(
    async (fetchParams?: { limit?: number; offset?: number }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await oauthService.listConnections({
          limit: fetchParams?.limit ?? limit,
          offset: fetchParams?.offset ?? offset,
          provider_type: providerType || undefined,
          status: status || undefined,
          search: search || undefined,
        });

        if (response.success) {
          setConnections(response.connections || []);
          setTotalCount(response.pagination?.total ?? (response.connections || []).length);
          setHasMore(Boolean(response.pagination?.has_more));
        } else {
          setError(response.message || 'Failed to load OAuth connections');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load OAuth connections';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, offset, providerType, status, search],
  );

  useEffect(() => {
    if (autoFetch && enabled) {
      void fetchConnections();
    }
  }, [autoFetch, enabled, fetchConnections]);

  const createConnection = useCallback(
    async (request: OAuthConnectionCreateRequest): Promise<OAuthConnectionInfo> => {
      setError(null);
      try {
        const response = await oauthService.createConnection(request);
        if (!response.success || !response.connection) {
          throw new Error(response.message || 'Failed to create OAuth connection');
        }
        return response.connection;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to create OAuth connection';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const updateConnection = useCallback(
    async (
      connectionHash: string,
      request: OAuthConnectionUpdateRequest,
    ): Promise<OAuthConnectionInfo> => {
      setError(null);
      try {
        const response = await oauthService.updateConnection(connectionHash, request);
        if (!response.success || !response.connection) {
          throw new Error(response.message || 'Failed to update OAuth connection');
        }
        return response.connection;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to update OAuth connection';
        setError(message);
        throw err;
      }
    },
    [],
  );

  // Status transitions and deletion change server-side state that other rows depend on
  // (binding readiness), so they refetch rather than patching the row locally.
  const setStatus = useCallback(
    async (connectionHash: string, next: 'active' | 'disabled'): Promise<boolean> => {
      setError(null);
      try {
        const response =
          next === 'active'
            ? await oauthService.activateConnection(connectionHash)
            : await oauthService.disableConnection(connectionHash);
        if (!response.success) {
          setError(response.message || 'Failed to change connection status');
          return false;
        }
        await fetchConnections();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to change connection status';
        setError(message);
        return false;
      }
    },
    [fetchConnections],
  );

  const activateConnection = useCallback(
    (connectionHash: string) => setStatus(connectionHash, 'active'),
    [setStatus],
  );

  const disableConnection = useCallback(
    (connectionHash: string) => setStatus(connectionHash, 'disabled'),
    [setStatus],
  );

  const deleteConnection = useCallback(
    async (connectionHash: string): Promise<boolean> => {
      setError(null);
      try {
        const response = await oauthService.deleteConnection(connectionHash);
        if (!response.success) {
          setError(response.message || 'Failed to remove OAuth connection');
          return false;
        }
        setConnections((previous) =>
          previous.filter((item) => item.connection_hash !== connectionHash),
        );
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to remove OAuth connection';
        setError(message);
        return false;
      }
    },
    [],
  );

  const refetch = useCallback(
    async (params?: { limit?: number; offset?: number }) => {
      await fetchConnections(params);
    },
    [fetchConnections],
  );

  return {
    connections,
    isLoading,
    error,
    totalCount,
    hasMore,
    createConnection,
    updateConnection,
    activateConnection,
    disableConnection,
    deleteConnection,
    refetch,
  };
}

export default useOAuthConnections;
