/**
 * OAuth connections list (admin reads, root writes).
 *
 * A CONNECTION is one provider app registration — a client ID, an encrypted secret and
 * the endpoints for one provider. Projects use a connection through a BINDING, managed
 * from the connection's Projects tab or the project's Sign-in tab.
 *
 * Filters live in the URL (`q`, `provider`, `status`, `page`, `limit`) and are applied
 * server-side; `pagination.total` honours them, so the pager shows real totals.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, KeyRound, Plus, RefreshCw } from 'lucide-react';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { TabNavigation } from '@/components/common/TabNavigation';
import { TablePager } from '@/components/common/TablePager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CONNECTION_STATUS_OPTIONS,
  OAuthConnectionFormModal,
  connectionStatusPresentation,
  credentialStatusPresentation,
  providerTypeLabel,
} from '@/components/features/oauth';
import {
  useOAuthConnections,
  useOAuthProviders,
} from '@/hooks/useOAuthConnections';
import { useUserType } from '@/hooks/useUserType';
import { cn } from '@/lib/utils';
import {
  formatCount,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  OAuthConnectionListItem,
  OAuthConnectionStatus,
} from '@/types/oauth.types';

const PAGE_SIZES = [25, 50, 100];
const ALL = 'all';

function readStatus(value: string | null): OAuthConnectionStatus | undefined {
  return CONNECTION_STATUS_OPTIONS.find((option) => option.value === value)
    ?.value;
}

function connectionHref(connectionHash: string): string {
  return `${ROUTES.OAUTH_CONNECTION}/${encodeURIComponent(connectionHash)}`;
}

export function OAuthConnectionsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isRoot } = useUserType();

  const query = searchParams.get('q') ?? '';
  const providerType = searchParams.get('provider') ?? '';
  const status = readStatus(searchParams.get('status'));
  const limit = PAGE_SIZES.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 25;
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '1', 10) || 1
  );
  const offset = (page - 1) * limit;

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Debounce typing into the URL-backed search.
  const [searchInput, setSearchInput] = useState(query);
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setSearchInput(query);
  }
  useEffect(() => {
    if (searchInput.trim() === query) return;
    const id = window.setTimeout(
      () => updateParams({ q: searchInput.trim().slice(0, 120) || null }),
      300
    );
    return () => window.clearTimeout(id);
  }, [searchInput, query, updateParams]);

  const list = useOAuthConnections({
    limit,
    offset,
    providerType,
    status,
    search: query,
  });
  const catalog = useOAuthProviders();
  const [showCreate, setShowCreate] = useState(false);

  const hasFilters = Boolean(query || providerType || status);
  const total = list.pagination?.total;

  const refresh = (): void => {
    void list.refetch();
    void catalog.refetch();
  };

  const clearFilters = (): void => {
    setSearchInput('');
    updateParams({ q: null, provider: null, status: null });
  };

  const providerOptions = useMemo(
    () =>
      catalog.providers
        .filter((entry) => entry.provider_type !== 'patreon')
        .map((entry) => ({
          value: entry.provider_type,
          label: entry.display_name || providerTypeLabel(entry.provider_type),
        })),
    [catalog.providers]
  );

  const columns = useMemo<DataViewColumn<OAuthConnectionListItem>[]>(
    () => [
      {
        key: 'display_name',
        header: 'Connection',
        render: (_value, row) => (
          <div className="min-w-0">
            <Link
              to={connectionHref(row.connection_hash)}
              onClick={(event) => event.stopPropagation()}
              className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
            >
              {row.display_name}
            </Link>
            {row.identity_namespace && (
              <span className="block truncate font-mono text-xs text-muted-foreground">
                {row.identity_namespace}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'provider_type',
        header: 'Provider',
        width: '130px',
        render: (_value, row) => (
          <span className="text-[13px]">
            {providerTypeLabel(row.provider_type)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: '110px',
        render: (_value, row) => {
          const presentation = connectionStatusPresentation(row.status);
          return (
            <Badge variant={presentation.variant} size="sm" dot>
              {presentation.label}
            </Badge>
          );
        },
      },
      {
        key: 'credential_status',
        header: 'Credentials',
        width: '120px',
        render: (_value, row) => {
          const presentation = credentialStatusPresentation(
            row.credential_status
          );
          return (
            <Badge variant={presentation.variant} size="sm">
              {presentation.label}
            </Badge>
          );
        },
      },
      {
        key: 'binding_count',
        header: 'Projects',
        width: '90px',
        align: 'right',
        render: (_value, row) => (
          <span className="tabular-nums">
            {formatNumber(row.binding_count)}
          </span>
        ),
      },
      {
        key: 'owner_project_name',
        header: 'Owner',
        hideOnMobile: true,
        render: (_value, row) =>
          row.owner_project_hash ? (
            <span className="block max-w-[180px] truncate text-[13px]">
              {row.owner_project_name || row.owner_project_hash}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Shared</span>
          ),
      },
      {
        key: 'updated_at',
        header: 'Updated',
        width: '110px',
        hideOnMobile: true,
        render: (_value, row) => {
          const when = row.updated_at ?? row.created_at;
          return (
            <span
              className="whitespace-nowrap font-mono text-xs text-muted-foreground"
              title={when ? formatDateTime(when) : undefined}
            >
              {formatRelativeTime(when)}
            </span>
          );
        },
      },
    ],
    []
  );

  const subtitle =
    total !== undefined && !hasFilters
      ? `${formatCount(total, 'connection')} · provider app registrations that projects use for sign-in`
      : 'Provider app registrations that projects use for sign-in';

  return (
    <PageContainer>
      <PageHeader
        title="OAuth"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={list.isRefreshing}
              aria-label="Refresh connections"
            >
              <RefreshCw
                className={cn(list.isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {isRoot && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus aria-hidden="true" />
                Create connection
              </Button>
            )}
          </>
        }
      />

      {catalog.oauthEnabled === false && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-warning"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            OAuth is switched off for this deployment (OAUTH_ENABLED).
            Connections can be configured, but no provider serves sign-in until
            it is turned on.
          </span>
        </div>
      )}

      {list.error && list.connections.length === 0 ? (
        <ErrorState
          title="OAuth connections could not be loaded"
          message={list.error}
          onRetry={() => void list.refetch()}
          isRetrying={list.isRefreshing}
        />
      ) : (
        <div
          className={cn(
            'transition-opacity',
            list.isRefreshing && 'opacity-70'
          )}
        >
          <DataView<OAuthConnectionListItem>
            data={list.connections}
            columns={columns}
            keyExtractor={(row) => row.connection_hash}
            showSearch
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by name"
            toolbarFilters={
              <>
                <Select
                  value={providerType || ALL}
                  onValueChange={(next) =>
                    updateParams({ provider: next === ALL ? null : next })
                  }
                >
                  <SelectTrigger
                    className="h-8 w-[160px] text-[13px]"
                    aria-label="Filter by provider"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All providers</SelectItem>
                    {providerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <TabNavigation
                  variant="segmented"
                  size="sm"
                  ariaLabel="Filter by status"
                  activeTab={status ?? ALL}
                  onChange={(tab) =>
                    updateParams({ status: tab === ALL ? null : tab })
                  }
                  tabs={[
                    { id: ALL, label: 'All' },
                    ...CONNECTION_STATUS_OPTIONS.map((option) => ({
                      id: option.value,
                      label: option.label,
                    })),
                  ]}
                />
              </>
            }
            onRowClick={(row) =>
              void navigate(connectionHref(row.connection_hash))
            }
            rowClassName={(row) =>
              cn('cursor-pointer', row.status === 'archived' && 'opacity-60')
            }
            isLoading={list.isLoading}
            skeletonRows={6}
            emptyIcon={<KeyRound className="h-8 w-8" />}
            emptyMessage={
              hasFilters
                ? 'No connections match these filters'
                : 'No OAuth connections yet'
            }
            emptyDescription={
              hasFilters
                ? 'Try a different search or clear the filters.'
                : isRoot
                  ? 'Create a connection for a provider app, store its credentials, then assign it to projects.'
                  : 'A root administrator creates connections; they appear here once they exist.'
            }
            emptyAction={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : isRoot ? (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <Plus aria-hidden="true" />
                  Create connection
                </Button>
              ) : undefined
            }
            caption="OAuth connections"
          />
          <TablePager
            offset={offset}
            limit={limit}
            pageCount={list.connections.length}
            total={total}
            onOffsetChange={(nextOffset) =>
              updateParams(
                { page: String(Math.floor(nextOffset / limit) + 1) },
                false
              )
            }
            pageSizeOptions={PAGE_SIZES}
            onLimitChange={(nextLimit) =>
              updateParams({ limit: String(nextLimit) })
            }
            itemLabel="connections"
          />
        </div>
      )}

      {isRoot && (
        <OAuthConnectionFormModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          providers={catalog.providers}
          onCreate={list.createConnection}
          onSaved={(created) =>
            void navigate(
              `${connectionHref(created.connection_hash)}?tab=credentials`
            )
          }
        />
      )}
    </PageContainer>
  );
}

export default OAuthConnectionsPage;
