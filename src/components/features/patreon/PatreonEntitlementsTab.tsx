/**
 * PatreonEntitlementsTab
 *
 * ROOT-only paginated entitlement management: filter by status, view a per-user
 * detail drawer, and trigger a per-user resync.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Button,
  ConfirmDialog,
  CopyButton,
  DataView,
  FilterBar,
  Pagination,
  type DataViewColumn,
  type Filter,
} from '@/components/common';
import { usePatreonEntitlements, useResyncPatreon, useToast } from '@/hooks';
import { truncateHash } from '@/utils/component-utils';
import { StatusBadge } from './StatusBadge';
import { PatreonEntitlementDetailDrawer } from './PatreonEntitlementDetailDrawer';
import type { PatreonEntitlement } from '@/types/patreon.types';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'free', label: 'Free' },
  { value: 'pending', label: 'Pending' },
  { value: 'former', label: 'Former' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'stale', label: 'Stale' },
];

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function PatreonEntitlementsTab(): React.JSX.Element {
  const { entitlements, pagination, isLoading, error, filters, fetchEntitlements, setFilters } =
    usePatreonEntitlements(PAGE_SIZE);
  const { resync, isResyncing } = useResyncPatreon();
  const { showToast } = useToast();

  const [detailUserHash, setDetailUserHash] = useState<string | null>(null);
  const [resyncTarget, setResyncTarget] = useState<PatreonEntitlement | null>(null);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === 'all' ? '' : value;
      setFilters({ status, offset: 0 });
      void fetchEntitlements({ status, offset: 0 });
    },
    [fetchEntitlements, setFilters]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const offset = (page - 1) * (filters.limit || PAGE_SIZE);
      setFilters({ offset });
      void fetchEntitlements({ offset });
    },
    [fetchEntitlements, setFilters, filters.limit]
  );

  const handleConfirmResync = useCallback(async () => {
    if (!resyncTarget) return;
    const target = resyncTarget;
    setResyncTarget(null);
    try {
      const result = await resync({
        scope: 'user',
        userHash: target.userHash,
        reason: 'Admin dashboard per-user resync',
      });
      showToast(
        result.correlationId ? `Resync queued (job ${result.correlationId}).` : 'Resync queued.',
        'success'
      );
      void fetchEntitlements();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to enqueue resync', 'error');
    }
  }, [resyncTarget, resync, showToast, fetchEntitlements]);

  const statusFilters: Filter[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        options: STATUS_OPTIONS,
        value: filters.status || 'all',
        onChange: handleStatusChange,
      },
    ],
    [filters.status, handleStatusChange]
  );

  const columns: DataViewColumn<PatreonEntitlement>[] = useMemo(
    () => [
      {
        key: 'userHash',
        header: 'User',
        render: (_value, row) => (
          <div className="flex flex-col">
            <button
              type="button"
              className="text-left text-sm font-medium text-primary hover:underline"
              onClick={() => setDetailUserHash(row.userHash)}
            >
              {row.displayName || 'View entitlement'}
            </button>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              {truncateHash(row.userHash)}
              <CopyButton value={row.userHash} />
            </span>
          </div>
        ),
      },
      {
        key: 'planCode',
        header: 'Plan / Tier',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{row.planCode}</span>
            {row.tierName && <span className="text-xs text-muted-foreground">{row.tierName}</span>}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (_value, row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'linkStatus',
        header: 'Link',
        render: (_value, row) => <StatusBadge status={row.linkStatus} />,
      },
      {
        key: 'lastSyncedAt',
        header: 'Last synced',
        render: (_value, row) => (
          <span className="text-sm text-muted-foreground">{formatTimestamp(row.lastSyncedAt)}</span>
        ),
      },
      {
        key: 'updatedAt',
        header: 'Actions',
        align: 'right',
        render: (_value, row) => (
          <Button
            variant="outline"
            size="sm"
            disabled={isResyncing}
            onClick={() => setResyncTarget(row)}
          >
            <RefreshCw size={13} className="mr-1.5" />
            Resync
          </Button>
        ),
      },
    ],
    [isResyncing]
  );

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || PAGE_SIZE)) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  return (
    <div className="space-y-4">
      <FilterBar filters={statusFilters} showClearButton={false} />

      <DataView<PatreonEntitlement>
        data={entitlements}
        columns={columns}
        keyExtractor={(item) => item.userHash}
        isLoading={isLoading}
        emptyMessage="No Patreon entitlements"
        emptyDescription={
          error || 'No users currently have a Patreon entitlement record.'
        }
      />

      {totalPages > 1 && pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
          itemLabelSingular="entitlement"
          itemLabelPlural="entitlements"
        />
      )}

      <PatreonEntitlementDetailDrawer
        userHash={detailUserHash}
        isOpen={detailUserHash !== null}
        onClose={() => setDetailUserHash(null)}
      />

      <ConfirmDialog
        isOpen={resyncTarget !== null}
        onClose={() => setResyncTarget(null)}
        onConfirm={() => void handleConfirmResync()}
        title="Resync Patreon entitlement"
        message={`Queue a Patreon resync for ${resyncTarget?.displayName || resyncTarget?.userHash || 'this user'}?`}
        confirmText="Queue resync"
        variant="info"
        isLoading={isResyncing}
      />
    </div>
  );
}

export default PatreonEntitlementsTab;
