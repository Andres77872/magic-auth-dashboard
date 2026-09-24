/**
 * OAuth admin hooks (api.auth ``/admin/oauth``).
 *
 * - `useOAuthConnections`  — one page of connections (list page, enable-provider picker).
 * - `useOAuthProviders`    — the provider catalog and deployment switch (+ root kill switch).
 * - `useOAuthConnection`   — one connection with its bindings, and its root mutations.
 * - `useProjectOAuthBindings` — a project's bindings for the sign-in tab.
 * - `useOAuthDefaultGroupOptions` — user groups that reach a project (default-group picker).
 *
 * Fetching goes through `useAsyncData`. Mutations resolve only after the API confirms
 * the change and after the affected data has been refetched; they reject with the
 * backend's message otherwise. Callers own the toasts.
 *
 * Reading is admin-level; creating, editing, activating, disabling, deleting
 * connections, writing credentials and flipping the catalog are root-only
 * server-side. The UI hides those controls from admins, but the server decides.
 */

import { useCallback, useState } from 'react';
import { oauthService } from '@/services/oauth.service';
import { projectService } from '@/services/project.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import { ApiError } from '@/utils/error-handler';
import type { PaginationResponse } from '@/types/api.types';
import type { UserGroup } from '@/types/group.types';
import type {
  OAuthBindingInfo,
  OAuthBindingUpsertRequest,
  OAuthBindingUrlCreateRequest,
  OAuthConnectionCreateRequest,
  OAuthConnectionDeleteOutcome,
  OAuthConnectionInfo,
  OAuthConnectionListItem,
  OAuthConnectionStatus,
  OAuthConnectionUpdateRequest,
  OAuthCredentialProbeRequest,
  OAuthCredentialProbeResult,
  OAuthCredentialsRequest,
  OAuthProviderCatalogEntry,
  OAuthProviderCatalogUpdateRequest,
} from '@/types/oauth.types';

const MISSING_CONNECTION = 'Missing OAuth connection id.';
const MISSING_PROJECT = 'Missing project id.';

/**
 * `PUT .../bindings/{key}` UPDATES whatever binding is already stored under that key —
 * re-pointing it at another connection — so a new binding is only written after
 * checking the project's current bindings. A clash is reported the way api.auth reports
 * the other binding conflict (the connection already bound under another key): as a 409.
 */
async function assertBindingSlotFree(
  projectHash: string,
  connectionKey: string,
  connectionHash: string
): Promise<void> {
  const bindings = await oauthService.listProjectBindings(projectHash);
  const sameConnection = bindings.find(
    (binding) => binding.connection_hash === connectionHash
  );
  if (sameConnection) {
    throw new ApiError(
      `This project already uses the connection under the key "${sameConnection.connection_key}".`,
      409
    );
  }
  if (bindings.some((binding) => binding.connection_key === connectionKey)) {
    throw new ApiError(
      `This project already has a sign-in provider under the key "${connectionKey}".`,
      409
    );
  }
}

// ─────────────────────────────────────────────────────────────── connections list

export interface UseOAuthConnectionsOptions {
  /** 1–200 (backend maximum). */
  limit?: number;
  offset?: number;
  /** Provider catalog type (``google``, ``oidc``, …). */
  providerType?: string;
  status?: OAuthConnectionStatus;
  /** Case-insensitive substring match on the display name. */
  search?: string;
  enabled?: boolean;
}

export interface UseOAuthConnectionsReturn {
  connections: OAuthConnectionListItem[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Root only. Resolves with the new ``draft`` connection. */
  createConnection: (
    request: OAuthConnectionCreateRequest
  ) => Promise<OAuthConnectionInfo>;
}

/** One page of `GET /admin/oauth/connections` for the given server-side filters. */
export function useOAuthConnections({
  limit = 50,
  offset = 0,
  providerType,
  status,
  search,
  enabled = true,
}: UseOAuthConnectionsOptions = {}): UseOAuthConnectionsReturn {
  const fetcher = useCallback(
    () =>
      oauthService.listConnections({
        limit,
        offset,
        provider_type: providerType || undefined,
        status,
        search: search?.trim() || undefined,
      }),
    [limit, offset, providerType, status, search]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );

  const createConnection = useCallback(
    async (
      request: OAuthConnectionCreateRequest
    ): Promise<OAuthConnectionInfo> => {
      const created = await oauthService.createConnection(request);
      // Callers usually navigate to the new connection; the list refreshes in the background.
      void refetch();
      return created;
    },
    [refetch]
  );

  return {
    connections: data?.connections ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isRefreshing,
    error,
    refetch,
    createConnection,
  };
}

// ─────────────────────────────────────────────────────────────── provider catalog

export interface UseOAuthProvidersReturn {
  providers: OAuthProviderCatalogEntry[];
  /** Deployment-wide ``OAUTH_ENABLED``; ``null`` until the catalog has loaded. */
  oauthEnabled: boolean | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Provider type whose catalog update is in flight. */
  pendingProvider: string | null;
  /** Root only: the run-time kill switch and catalog-level login/link gates. */
  updateProvider: (
    providerType: string,
    changes: OAuthProviderCatalogUpdateRequest
  ) => Promise<void>;
}

/** `GET /admin/oauth/providers`. */
export function useOAuthProviders({
  enabled = true,
}: { enabled?: boolean } = {}): UseOAuthProvidersReturn {
  const fetcher = useCallback(() => oauthService.listProviders(), []);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const updateProvider = useCallback(
    async (
      providerType: string,
      changes: OAuthProviderCatalogUpdateRequest
    ): Promise<void> => {
      setPendingProvider(providerType);
      try {
        await oauthService.updateProvider(providerType, changes);
        await refetch();
      } finally {
        setPendingProvider(null);
      }
    },
    [refetch]
  );

  return {
    providers: data?.providers ?? [],
    oauthEnabled: data ? data.oauth_enabled : null,
    isLoading,
    isRefreshing,
    error,
    refetch,
    pendingProvider,
    updateProvider,
  };
}

// ───────────────────────────────────────────────────────────── one connection

export type OAuthConnectionAction =
  | 'update'
  | 'activate'
  | 'disable'
  | 'delete'
  | 'credentials'
  | 'test';

export interface UseOAuthConnectionReturn {
  connection: OAuthConnectionInfo | null;
  /** Bindings of this connection that the caller may see (admins: their projects only). */
  bindings: OAuthBindingInfo[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** The root mutation currently in flight, if any. */
  pending: OAuthConnectionAction | null;
  updateConnection: (
    request: OAuthConnectionUpdateRequest
  ) => Promise<OAuthConnectionInfo>;
  activateConnection: () => Promise<void>;
  disableConnection: () => Promise<void>;
  /** Refetches only when the connection was archived (a deleted one no longer exists). */
  deleteConnection: () => Promise<OAuthConnectionDeleteOutcome>;
  setCredentials: (request: OAuthCredentialsRequest) => Promise<void>;
  /** Non-persisting probe; nothing is refetched. */
  testCredentials: (
    request: OAuthCredentialProbeRequest
  ) => Promise<OAuthCredentialProbeResult>;
  /**
   * Binds this connection to one project under `connectionKey` with api.auth's safe
   * defaults (disabled, no provisioning, deny). Rejects with a 409 `ApiError` when the
   * project already uses the key or the connection. Does not refetch — batch callers
   * refetch once when the batch completes.
   */
  assignProject: (projectHash: string, connectionKey: string) => Promise<void>;
}

/** `GET /admin/oauth/connections/{hash}` plus the connection's bindings. */
export function useOAuthConnection(
  connectionHash: string | undefined
): UseOAuthConnectionReturn {
  const fetcher = useCallback(async () => {
    if (!connectionHash) throw new Error(MISSING_CONNECTION);
    const [connection, bindings] = await Promise.all([
      oauthService.getConnection(connectionHash),
      oauthService.listConnectionBindings(connectionHash),
    ]);
    return { hash: connectionHash, connection, bindings };
  }, [connectionHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    {
      enabled: Boolean(connectionHash),
    }
  );
  // useAsyncData keeps the previous result while a new one loads; never show (or act
  // on) another connection's data after the route parameter changed.
  const current = data && data.hash === connectionHash ? data : null;
  const [pending, setPending] = useState<OAuthConnectionAction | null>(null);

  const run = useCallback(
    async <T>(
      action: OAuthConnectionAction,
      work: (hash: string) => Promise<T>
    ): Promise<T> => {
      if (!connectionHash) throw new Error(MISSING_CONNECTION);
      setPending(action);
      try {
        return await work(connectionHash);
      } finally {
        setPending(null);
      }
    },
    [connectionHash]
  );

  const updateConnection = useCallback(
    (request: OAuthConnectionUpdateRequest) =>
      run('update', async (hash) => {
        const updated = await oauthService.updateConnection(hash, request);
        await refetch();
        return updated;
      }),
    [run, refetch]
  );

  const activateConnection = useCallback(
    () =>
      run('activate', async (hash) => {
        await oauthService.activateConnection(hash);
        await refetch();
      }),
    [run, refetch]
  );

  const disableConnection = useCallback(
    () =>
      run('disable', async (hash) => {
        await oauthService.disableConnection(hash);
        await refetch();
      }),
    [run, refetch]
  );

  const deleteConnection = useCallback(
    () =>
      run('delete', async (hash) => {
        const outcome = await oauthService.deleteConnection(hash);
        if (outcome === 'archived') await refetch();
        return outcome;
      }),
    [run, refetch]
  );

  const setCredentials = useCallback(
    (request: OAuthCredentialsRequest) =>
      run('credentials', async (hash) => {
        await oauthService.setCredentials(hash, request);
        await refetch();
      }),
    [run, refetch]
  );

  const testCredentials = useCallback(
    (request: OAuthCredentialProbeRequest) =>
      run('test', (hash) => oauthService.testCredentials(hash, request)),
    [run]
  );

  const assignProject = useCallback(
    async (projectHash: string, connectionKey: string): Promise<void> => {
      if (!connectionHash) throw new Error(MISSING_CONNECTION);
      const key = connectionKey.trim().toLowerCase();
      await assertBindingSlotFree(projectHash, key, connectionHash);
      // Only the connection: api.auth creates new bindings disabled, with login and link
      // allowed, provisioning off and existing users denied.
      await oauthService.upsertBinding(projectHash, key, {
        connection_hash: connectionHash,
      });
    },
    [connectionHash]
  );

  return {
    connection: current?.connection ?? null,
    bindings: current?.bindings ?? [],
    isLoading: isLoading || (!current && isRefreshing),
    isRefreshing,
    error,
    refetch,
    pending,
    updateConnection,
    activateConnection,
    disableConnection,
    deleteConnection,
    setCredentials,
    testCredentials,
    assignProject,
  };
}

// ──────────────────────────────────────────────────────────── project bindings

export interface UseProjectOAuthBindingsReturn {
  bindings: OAuthBindingInfo[];
  /** Deployment-wide ``OAUTH_ENABLED``; ``null`` until loaded. */
  oauthEnabled: boolean | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Adds a new binding with api.auth's safe defaults; 409 `ApiError` when the key or connection is taken. */
  enableConnection: (
    connectionHash: string,
    connectionKey: string
  ) => Promise<void>;
  saveBinding: (
    connectionKey: string,
    request: OAuthBindingUpsertRequest
  ) => Promise<void>;
  removeBinding: (connectionKey: string) => Promise<void>;
  addUrl: (
    connectionKey: string,
    request: OAuthBindingUrlCreateRequest
  ) => Promise<void>;
  removeUrl: (connectionKey: string, urlId: string) => Promise<void>;
}

/** A project's OAuth bindings (with URLs and readiness) and the deployment switch. */
export function useProjectOAuthBindings(
  projectHash: string | undefined
): UseProjectOAuthBindingsReturn {
  const fetcher = useCallback(async () => {
    if (!projectHash) throw new Error(MISSING_PROJECT);
    const [bindings, readiness] = await Promise.all([
      oauthService.listProjectBindings(projectHash),
      oauthService.getProjectReadiness(projectHash),
    ]);
    return {
      hash: projectHash,
      bindings,
      oauthEnabled: readiness.oauth_enabled,
    };
  }, [projectHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    {
      enabled: Boolean(projectHash),
    }
  );
  const current = data && data.hash === projectHash ? data : null;

  const mutate = useCallback(
    async (work: (hash: string) => Promise<unknown>): Promise<void> => {
      if (!projectHash) throw new Error(MISSING_PROJECT);
      await work(projectHash);
      await refetch();
    },
    [projectHash, refetch]
  );

  const enableConnection = useCallback(
    (connectionHash: string, connectionKey: string) =>
      mutate(async (hash) => {
        const key = connectionKey.trim().toLowerCase();
        await assertBindingSlotFree(hash, key, connectionHash);
        await oauthService.upsertBinding(hash, key, {
          connection_hash: connectionHash,
        });
      }),
    [mutate]
  );

  const saveBinding = useCallback(
    (connectionKey: string, request: OAuthBindingUpsertRequest) =>
      mutate((hash) =>
        oauthService.upsertBinding(hash, connectionKey, request)
      ),
    [mutate]
  );

  const removeBinding = useCallback(
    (connectionKey: string) =>
      mutate((hash) => oauthService.deleteBinding(hash, connectionKey)),
    [mutate]
  );

  const addUrl = useCallback(
    (connectionKey: string, request: OAuthBindingUrlCreateRequest) =>
      mutate((hash) =>
        oauthService.addBindingUrl(hash, connectionKey, request)
      ),
    [mutate]
  );

  const removeUrl = useCallback(
    (connectionKey: string, urlId: string) =>
      mutate((hash) =>
        oauthService.removeBindingUrl(hash, connectionKey, urlId)
      ),
    [mutate]
  );

  return {
    bindings: current?.bindings ?? [],
    oauthEnabled: current ? current.oauthEnabled : null,
    isLoading: isLoading || (!current && isRefreshing),
    isRefreshing,
    error,
    refetch,
    enableConnection,
    saveBinding,
    removeBinding,
    addUrl,
    removeUrl,
  };
}

// ─────────────────────────────────────────────────────── default-group options

export interface UseOAuthDefaultGroupOptionsReturn {
  groups: UserGroup[];
  isLoading: boolean;
  error: string | null;
}

/**
 * User groups that already reach the project (`GET /projects/{hash}/groups`, backend
 * maximum page), i.e. the only groups api.auth accepts as a binding's default group.
 */
export function useOAuthDefaultGroupOptions(
  projectHash: string | undefined
): UseOAuthDefaultGroupOptionsReturn {
  const fetcher = useCallback(async () => {
    if (!projectHash) throw new Error(MISSING_PROJECT);
    const page = await projectService.getProjectGroups(projectHash, {
      limit: 500,
    });
    return page.user_groups;
  }, [projectHash]);
  const { data, error, isLoading } = useAsyncData(fetcher, {
    enabled: Boolean(projectHash),
  });
  return { groups: data ?? [], isLoading, error };
}

export default useOAuthConnections;
