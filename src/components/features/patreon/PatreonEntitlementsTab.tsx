/**
 * PatreonEntitlementsTab
 *
 * ROOT-only list of users' current Patreon entitlements: server-side search and
 * filters, a per-user detail drawer (with history), and per-user resync.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import {
  Button,
  CopyableId,
  DataView,
  ErrorState,
  FilterBar,
  Pagination,
  SearchBar,
  type DataViewColumn,
  type Filter,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { usePatreonEntitlements } from '@/hooks';
import {
  isPatreonTimestampPast,
  type PatreonEntitlement,
} from '@/types/patreon.types';
import { PatreonEntitlementDetailDrawer } from './PatreonEntitlementDetailDrawer';
import { PatreonResyncModal } from './PatreonResyncModal';
import { StatusBadge } from './StatusBadge';
import { Timestamp } from './patreon-format';
import { useRefreshSignal } from './useRefreshSignal';

const PAGE_SIZE = 20;
const ALL = 'all';

const STATUS_OPTIONS = [
  { value: ALL, label: 'Any entitlement' },
  { value: 'active', label: 'Active' },
  { value: 'stale', label: 'Stale' },
  { value: 'pending', label: 'Pending' },
  { value: 'former', label: 'Former' },
  { value: 'free', label: 'Free' },
  { value: 'revoked', label: 'Revoked' },
];

const LINK_OPTIONS = [
  { value: ALL, label: 'Any link state' },
  { value: 'linked', label: 'Linked' },
  { value: 'pending', label: 'Pending' },
  { value: 'unlinked', label: 'Unlinked' },
  { value: 'revoked', label: 'Revoked' },
];

interface ResyncTarget {
  userHash: string;
  label: string;
}

export interface PatreonEntitlementsTabProps {
  /** False when the sync worker is not reporting (shown in the resync dialog). */
  workerHealthy?: boolean;
  /** Incremented by the page's Refresh button. */
  refreshSignal?: number;
}

export function PatreonEntitlementsTab({
  workerHealthy = true,
  refreshSignal = 0,
}: PatreonEntitlementsTabProps): React.JSX.Element {
  const {
    entitlements,
    pagination,
    isLoading,
    error,
    filters,
    fetchEntitlements,
    setFilters,
  } = usePatreonEntitlements(PAGE_SIZE);
  useRefreshSignal(
    refreshSignal,
    useCallback(() => void fetchEntitlements(), [fetchEntitlements])
  );

  const [detail, setDetail] = useState<PatreonEntitlement | null>(null);
  const [resyncTarget, setResyncTarget] = useState<ResyncTarget | null>(null);

  const filtersActive = Boolean(
    filters.status || filters.linkStatus || filters.search
  );

  const handleSearch = useCallback(
    (value: string) => {
      const search = value.trim();
      if (search !== filters.search) setFilters({ search, offset: 0 });
    },
    [filters.search, setFilters]
  );

  const filterControls: Filter[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Entitlement',
        options: STATUS_OPTIONS,
        value: filters.status || ALL,
        onChange: (value: string) =>
          setFilters({ status: value === ALL ? '' : value, offset: 0 }),
      },
      {
        key: 'linkStatus',
        label: 'Link',
        options: LINK_OPTIONS,
        value: filters.linkStatus || ALL,
        onChange: (value: string) =>
          setFilters({ linkStatus: value === ALL ? '' : value, offset: 0 }),
      },
    ],
    [filters.status, filters.linkStatus, setFilters]
  );

  const columns: DataViewColumn<PatreonEntitlement>[] = useMemo(
    () => [
      {
        key: 'userHash',
        header: 'User',
        render: (_value, row) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {row.displayName || 'Unnamed user'}
            </span>
            <span onClick={(event) => event.stopPropagation()}>
              <CopyableId
                id={row.userHash}
                startChars={6}
                endChars={4}
                label="user hash"
              />
            </span>
          </div>
        ),
      },
      {
        key: 'planCode',
        header: 'Plan',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="font-mono text-sm text-foreground">
              {row.planCode}
            </span>
            {(row.tierName || row.tierCode) && (
              <span className="text-xs text-muted-foreground">
                {row.tierName || row.tierCode}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Entitlement',
        render: (_value, row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={row.status} />
            {row.status === 'active' &&
              isPatreonTimestampPast(row.staleAfter) && (
                <Badge
                  variant="warning"
                  size="sm"
                  title="Not refreshed from Patreon within the freshness window"
                >
                  Stale
                </Badge>
              )}
          </div>
        ),
      },
      {
        key: 'linkStatus',
        header: 'Link',
        render: (_value, row) => <StatusBadge status={row.linkStatus} />,
      },
      {
        key: 'nextRenewalAt',
        header: 'Renews',
        hideOnMobile: true,
        render: (_value, row) => <Timestamp value={row.nextRenewalAt} />,
      },
      {
        key: 'lastSyncedAt',
        header: 'Last synced',
        hideOnMobile: true,
        render: (_value, row) => <Timestamp value={row.lastSyncedAt} />,
      },
      {
        key: 'updatedAt',
        header: 'Actions',
        align: 'right',
        render: (_value, row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              setResyncTarget({
                userHash: row.userHash,
                label: row.displayName || row.userHash,
              });
            }}
            aria-label={`Resync ${row.displayName || row.userHash}`}
          >
            <RefreshCw size={13} className="mr-1.5" aria-hidden="true" />
            Resync
          </Button>
        ),
      },
    ],
    []
  );

  const pageSize = filters.limit || PAGE_SIZE;
  const currentPage = Math.floor((filters.offset || 0) / pageSize) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search users…"
            className="w-full sm:w-72"
          />
          <FilterBar filters={filterControls} showClearButton={false} />
        </div>
        {pagination && !error && (
          <span className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString()}{' '}
            {pagination.total === 1 ? 'user' : 'users'}
          </span>
        )}
      </div>

      {error ? (
        <ErrorState
          title="Couldn’t load entitlements"
          message={error}
          onRetry={() => void fetchEntitlements()}
        />
      ) : (
        <DataView<PatreonEntitlement>
          data={entitlements}
          columns={columns}
          keyExtractor={(item) => item.userHash}
          isLoading={isLoading}
          onRowClick={(row) => setDetail(row)}
          emptyIcon={<Users size={32} aria-hidden="true" />}
          emptyMessage={
            filtersActive ? 'No matching users' : 'No Patreon entitlements yet'
          }
          emptyDescription={
            filtersActive
              ? 'Try a different search or clear the filters.'
              : 'Users appear here once they link their Patreon membership.'
          }
        />
      )}

      {!error && totalPages > 1 && pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pagination.total}
          itemsPerPage={pageSize}
          onPageChange={(page) => setFilters({ offset: (page - 1) * pageSize })}
          itemLabelSingular="user"
          itemLabelPlural="users"
        />
      )}

      <PatreonEntitlementDetailDrawer
        userHash={detail?.userHash ?? null}
        displayName={detail?.displayName ?? null}
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        onResync={(userHash, label) => setResyncTarget({ userHash, label })}
      />

      <PatreonResyncModal
        isOpen={resyncTarget !== null}
        onClose={() => setResyncTarget(null)}
        onSubmitted={() => void fetchEntitlements()}
        defaultScope="user"
        defaultUserHash={resyncTarget?.userHash ?? ''}
        userLabel={resyncTarget?.label}
        lockScope
        workerHealthy={workerHealthy}
      />
    </div>
  );
}

export default PatreonEntitlementsTab;
