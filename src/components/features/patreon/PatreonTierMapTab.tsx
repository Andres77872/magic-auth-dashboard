/**
 * PatreonTierMapTab
 *
 * ROOT-only read-only view of the configured tier map (campaign/tier
 * fingerprints + internal plan/tier codes). Tier maps are static server config;
 * editing is intentionally out of scope.
 */

import React, { useMemo } from 'react';
import { Badge, DataView, ErrorState, type DataViewColumn } from '@/components/common';
import { usePatreonTierMap } from '@/hooks';
import { cn } from '@/lib/utils';
import { toneClasses } from './patreon-status-tone';
import type { PatreonTierMapEntry } from '@/types/patreon.types';

export function PatreonTierMapTab(): React.JSX.Element {
  const { entries, isLoading, error, refetch } = usePatreonTierMap();

  const columns: DataViewColumn<PatreonTierMapEntry>[] = useMemo(
    () => [
      {
        key: 'campaignFingerprint',
        header: 'Campaign',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{row.campaignName || '—'}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.campaignFingerprint || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'planCode',
        header: 'Plan code',
        render: (_value, row) => <span className="text-sm font-medium">{row.planCode}</span>,
      },
      {
        key: 'tierCode',
        header: 'Tier',
        render: (_value, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{row.tierCode}</span>
            {row.tierName && <span className="text-xs text-muted-foreground">{row.tierName}</span>}
          </div>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        align: 'center',
        render: (_value, row) => <span className="text-sm">{row.priority}</span>,
      },
      {
        key: 'active',
        header: 'Active',
        align: 'center',
        render: (_value, row) => (
          <Badge
            variant="outline"
            className={cn('capitalize', toneClasses(row.active ? 'success' : 'muted'))}
          >
            {row.active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
    ],
    []
  );

  if (error) {
    return (
      <ErrorState
        title="Could not load tier map"
        message={error}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <DataView<PatreonTierMapEntry>
      data={entries}
      columns={columns}
      keyExtractor={(item) =>
        `${item.campaignFingerprint ?? 'c'}:${item.tierFingerprint ?? 't'}:${item.planCode}:${item.priority}`
      }
      isLoading={isLoading}
      enableLocalSearch
      searchKeys={['planCode', 'tierCode', 'tierName', 'campaignName']}
      searchPlaceholder="Search tier map…"
      emptyMessage="No tier map entries"
      emptyDescription="No Patreon tier map has been seeded yet."
    />
  );
}

export default PatreonTierMapTab;
