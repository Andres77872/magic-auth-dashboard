/**
 * Billing (`/billing`): billing groups — each owns one Stripe account and one
 * catalog shared by its projects. Root sees every group; admins see the
 * groups they fully own. Search and page live in the URL.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Plus, RefreshCw } from 'lucide-react';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { TablePager } from '@/components/common/TablePager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BillingGroupFormDialog,
  catalogSyncStatus,
  credentialStatus,
  groupStatus,
  useBillingGroups,
} from '@/components/features/billing';
import { useBillingMetrics } from '@/hooks/dashboard/useBillingMetrics';
import { cn } from '@/lib/utils';
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { BillingGroup } from '@/types/billing.types';

const PAGE_SIZES = [25, 50, 100];

function capabilityCount(group: BillingGroup): number {
  return [
    group.checkout_enabled,
    group.portal_enabled,
    group.provisioning_enabled,
    group.webhooks_enabled,
  ].filter(Boolean).length;
}

const COLUMNS: DataViewColumn<BillingGroup>[] = [
  {
    key: 'name',
    header: 'Group',
    render: (_value, group) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{group.name}</div>
        {group.description && (
          <div className="max-w-[360px] truncate text-xs text-muted-foreground">
            {group.description}
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (_value, group) => {
      const display = groupStatus(group.status);
      return (
        <Badge variant={display.variant} size="sm">
          {display.label}
        </Badge>
      );
    },
  },
  {
    key: 'credential_status',
    header: 'Stripe',
    render: (_value, group) => {
      const display = credentialStatus(group.credential_status);
      return (
        <Badge variant={display.variant} size="sm">
          {display.label}
        </Badge>
      );
    },
  },
  {
    key: 'checkout_enabled',
    header: 'Capabilities',
    hideOnMobile: true,
    render: (_value, group) => (
      <span
        className="tabular-nums text-muted-foreground"
        title="Checkout, portal, provisioning and webhooks"
      >
        {capabilityCount(group)} of 4 on
      </span>
    ),
  },
  {
    key: 'project_count',
    header: 'Projects',
    align: 'right',
    render: (_value, group) => (
      <span className="tabular-nums">{formatNumber(group.project_count)}</span>
    ),
  },
  {
    key: 'catalog_item_count',
    header: 'Catalog',
    align: 'right',
    hideOnMobile: true,
    render: (_value, group) => (
      <span className="tabular-nums">
        {formatNumber(group.catalog_item_count)}
      </span>
    ),
  },
  {
    key: 'catalog_sync_status',
    header: 'Sync',
    hideOnMobile: true,
    render: (_value, group) => {
      const display = catalogSyncStatus(group.catalog_sync_status);
      return (
        <Badge variant={display.variant} size="sm">
          {display.label}
        </Badge>
      );
    },
  },
  {
    key: 'updated_at',
    header: 'Updated',
    align: 'right',
    hideOnMobile: true,
    render: (_value, group) => (
      <time
        dateTime={group.updated_at ?? undefined}
        title={formatDateTime(group.updated_at)}
        className="whitespace-nowrap text-muted-foreground"
      >
        {formatRelativeTime(group.updated_at)}
      </time>
    ),
  },
];

export function BillingGroupsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const limit = PAGE_SIZES.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 25;
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '1', 10) || 1
  );
  const offset = (page - 1) * limit;

  const [searchInput, setSearchInput] = useState(query);
  const [createOpen, setCreateOpen] = useState(false);
  const {
    page: result,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useBillingGroups({ search: query, limit, offset });
  const metrics = useBillingMetrics();

  const updateParams = (
    changes: Record<string, string | null>,
    resetPage = true
  ): void => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) next.delete('page');
      return next;
    });
  };

  // Debounce the search box into the URL.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === query) return undefined;
    const handle = window.setTimeout(() => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous);
        if (next) params.set('q', next);
        else params.delete('q');
        params.delete('page');
        return params;
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, query, setSearchParams]);

  const groups = result?.groups ?? [];
  const refresh = (): void => {
    void refetch();
    metrics.refetch();
  };
  const m = metrics.metrics;
  const attention = m
    ? m.catalog_failed + (m.webhook_secret_missing_active_groups ?? 0)
    : undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Billing"
        subtitle={
          result
            ? `${formatNumber(result.total)} billing ${result.total === 1 ? 'group' : 'groups'}${query ? ` matching “${query}”` : ''} · each owns a Stripe account and a catalog`
            : 'Billing groups own a Stripe account and a catalog shared by their projects'
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh billing groups"
            >
              <RefreshCw
                className={cn(isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Create billing group
            </Button>
          </>
        }
      />

      {!metrics.error && (
        <section
          aria-label="Billing totals"
          className="mb-6 grid grid-cols-2 gap-3.5 xl:grid-cols-4"
        >
          <StatCard
            title="Groups"
            value={formatNumber(m?.groups_total)}
            loading={metrics.isLoading}
            subValue={
              m
                ? `${formatNumber(m.groups_active)} active · ${formatNumber(m.credentials_active)} connected to Stripe`
                : undefined
            }
          />
          <StatCard
            title="Projects billed"
            value={formatNumber(m?.projects_mapped)}
            loading={metrics.isLoading}
          />
          <StatCard
            title="Catalog"
            value={formatNumber(
              m ? m.subscription_plans + m.credit_packages : undefined
            )}
            loading={metrics.isLoading}
            subValue={
              m
                ? `${formatNumber(m.subscription_plans)} plans · ${formatNumber(m.credit_packages)} credit packages`
                : undefined
            }
          />
          <StatCard
            title="Needs attention"
            value={formatNumber(attention)}
            loading={metrics.isLoading}
            variant={attention ? 'warning' : 'success'}
            subValue={
              m
                ? `${formatNumber(m.catalog_failed)} failed items · ${formatNumber(m.webhook_secret_missing_active_groups ?? 0)} missing webhook secrets`
                : undefined
            }
          />
        </section>
      )}

      {error && !result ? (
        <ErrorState
          title="Billing groups could not be loaded"
          message={error}
          onRetry={refresh}
          isRetrying={isRefreshing}
        />
      ) : (
        <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
          <DataView<BillingGroup>
            data={groups}
            columns={COLUMNS}
            keyExtractor={(group) => group.group_hash}
            showSearch
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by name or group hash"
            onRowClick={(group) =>
              void navigate(
                `${ROUTES.BILLING_GROUP}/${encodeURIComponent(group.group_hash)}`
              )
            }
            rowClassName={(group) =>
              group.status === 'active' ? '' : 'opacity-70'
            }
            isLoading={isLoading}
            skeletonRows={5}
            emptyIcon={<CreditCard className="h-8 w-8" />}
            emptyMessage={
              query
                ? 'No billing groups match this search'
                : 'No billing groups yet'
            }
            emptyDescription={
              query
                ? 'Try another name or clear the search.'
                : 'Create a group to connect a Stripe account and sell plans in your projects.'
            }
            emptyAction={
              query ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchInput('')}
                >
                  Clear search
                </Button>
              ) : (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus aria-hidden="true" />
                  Create billing group
                </Button>
              )
            }
            caption="Billing groups"
          />
          <TablePager
            offset={offset}
            limit={limit}
            pageCount={groups.length}
            total={result?.total}
            hasMore={result?.hasMore}
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
            itemLabel="groups"
          />
        </div>
      )}

      <BillingGroupFormDialog
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(group) => {
          setCreateOpen(false);
          void navigate(
            `${ROUTES.BILLING_GROUP}/${encodeURIComponent(group.group_hash)}`
          );
        }}
      />
    </PageContainer>
  );
}

export default BillingGroupsPage;
