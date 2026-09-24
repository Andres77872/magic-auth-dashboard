/**
 * PatreonTierMapTab
 *
 * ROOT-only view of the tier map: which Patreon campaign tier grants which
 * internal plan. The map is server configuration (PATREON_CAMPAIGN_TIER_MAP);
 * the server mirrors it into the table listed here, so it is read-only in the UI.
 * Campaigns and tiers appear only as non-reversible fingerprints.
 */

import React, { useCallback, useMemo } from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import {
  DataView,
  ErrorState,
  FilterBar,
  Pagination,
  type DataViewColumn,
  type Filter,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { usePatreonTierMap } from '@/hooks';
import type { PatreonTierMapEntry } from '@/types/patreon.types';
import { Timestamp } from './patreon-format';
import { useRefreshSignal } from './useRefreshSignal';

const PAGE_SIZE = 100;

const ACTIVE_OPTIONS = [
  { value: 'all', label: 'Active and inactive' },
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

function Fingerprint({ value }: { value: string | null }): React.JSX.Element {
  return value ? (
    <span
      className="font-mono text-xs text-muted-foreground"
      title="Fingerprint (not the Patreon id)"
    >
      {value}
    </span>
  ) : (
    <span className="text-xs text-muted-foreground">—</span>
  );
}

export function PatreonTierMapTab({
  refreshSignal = 0,
}: {
  refreshSignal?: number;
}): React.JSX.Element {
  const {
    entries,
    pagination,
    isLoading,
    error,
    filters,
    refetch,
    setFilters,
  } = usePatreonTierMap(PAGE_SIZE);
  useRefreshSignal(
    refreshSignal,
    useCallback(() => void refetch(), [refetch])
  );

  const filterControls: Filter[] = useMemo(
    () => [
      {
        key: 'active',
        label: 'Active',
        options: ACTIVE_OPTIONS,
        value: filters.active || 'all',
        onChange: (value: string) =>
          setFilters({
            active: value === 'all' ? '' : (value as 'true' | 'false'),
            offset: 0,
          }),
      },
    ],
    [filters.active, setFilters]
  );

  const columns: DataViewColumn<PatreonTierMapEntry>[] = useMemo(
    () => [
      {
        key: 'campaignFingerprint',
        header: 'Campaign',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {row.campaignName || 'Unnamed campaign'}
            </span>
            <Fingerprint value={row.campaignFingerprint} />
          </div>
        ),
      },
      {
        key: 'tierCode',
        header: 'Patreon tier',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {row.tierName || row.tierCode}
            </span>
            <Fingerprint value={row.tierFingerprint} />
          </div>
        ),
      },
      {
        key: 'planCode',
        header: 'Grants',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="font-mono text-sm text-foreground">
              {row.planCode}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.tierCode}
            </span>
          </div>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        align: 'center',
        render: (_value, row) => (
          <span className="text-sm tabular-nums">{row.priority}</span>
        ),
      },
      {
        key: 'active',
        header: 'State',
        align: 'center',
        render: (_value, row) => (
          <Badge variant={row.active ? 'success' : 'secondary'}>
            {row.active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'effectiveFrom',
        header: 'Since',
        hideOnMobile: true,
        render: (_value, row) => <Timestamp value={row.effectiveFrom} />,
      },
    ],
    []
  );

  const pageSize = filters.limit || PAGE_SIZE;
  const currentPage = Math.floor((filters.offset || 0) / pageSize) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 p-4">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-info"
          aria-hidden="true"
        />
        <p className="text-sm text-foreground">
          The tier map is server configuration (
          <span className="font-mono text-xs">PATREON_CAMPAIGN_TIER_MAP</span>).
          This table mirrors it. To change it, edit the configuration and
          restart the API and sync worker. When a patron has several mapped
          tiers, the highest priority wins; unmapped tiers grant nothing.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <FilterBar filters={filterControls} showClearButton={false} />
        {pagination && !error && (
          <span className="text-sm text-muted-foreground">
            {pagination.total.toLocaleString()}{' '}
            {pagination.total === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {error ? (
        <ErrorState
          title="Couldn’t load the tier map"
          message={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <DataView<PatreonTierMapEntry>
          data={entries}
          columns={columns}
          keyExtractor={(item) =>
            `${item.campaignFingerprint ?? 'c'}:${item.tierFingerprint ?? 't'}:${item.planCode}:${item.priority}`
          }
          isLoading={isLoading}
          enableLocalSearch
          searchKeys={['planCode', 'tierCode', 'tierName', 'campaignName']}
          searchPlaceholder="Filter this page by plan, tier or campaign…"
          emptyIcon={<ShieldCheck size={32} aria-hidden="true" />}
          emptyMessage="No tier-map entries"
          emptyDescription="Configure PATREON_CAMPAIGN_TIER_MAP on the server; entries appear here once the API or worker starts with it."
        />
      )}

      {!error && totalPages > 1 && pagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pagination.total}
          itemsPerPage={pageSize}
          onPageChange={(page) => setFilters({ offset: (page - 1) * pageSize })}
          itemLabelSingular="entry"
          itemLabelPlural="entries"
        />
      )}
    </div>
  );
}

export default PatreonTierMapTab;
