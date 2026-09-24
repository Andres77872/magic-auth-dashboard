/**
 * API requests: the per-request audit log written by the API middleware
 * (`GET /admin/audit/logs`), filterable by path, method, outcome and time.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { ErrorState } from '@/components/common/ErrorState';
import { TabNavigation } from '@/components/common/TabNavigation';
import { TablePager } from '@/components/common/TablePager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiAuditLogs } from '@/hooks/audit/useAuditData';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type { ApiAuditLog } from '@/types/audit.types';
import { ActivityExport } from './ActivityExport';
import { ApiRequestDetailSheet } from './ApiRequestDetailSheet';
import {
  DaysSelect,
  OptionalSelect,
  RefreshButton,
  type SelectOption,
} from './AuditFilterControls';
import { formatDuration, statusCodeVariant } from './audit-format';

const PAGE_SIZES = [25, 50, 100];
const DEFAULT_DAYS = 7;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const METHOD_OPTIONS: SelectOption<HttpMethod>[] = (
  ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const
).map((method) => ({ value: method, label: method }));

type Outcome = 'all' | 'failed' | 'succeeded';

function NoRowClick({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span data-no-row-click onClick={(event) => event.stopPropagation()}>
      {children}
    </span>
  );
}

const COLUMNS: DataViewColumn<ApiAuditLog>[] = [
  {
    key: 'endpointPath',
    header: 'Request',
    render: (_value, log) => (
      <div
        className="flex min-w-0 items-center gap-2"
        title={log.routePattern ?? undefined}
      >
        <span className="w-12 shrink-0 font-mono text-[11px] font-semibold text-muted-foreground">
          {log.httpMethod}
        </span>
        <span className="max-w-[340px] truncate font-mono text-xs text-foreground">
          {log.endpointPath}
        </span>
        {log.securityEvent && (
          <Badge variant="warning" size="sm">
            Security
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: 'responseStatus',
    header: 'Status',
    render: (_value, log) => (
      <Badge variant={statusCodeVariant(log.responseStatus)} size="sm">
        {log.responseStatus ?? '—'}
      </Badge>
    ),
  },
  {
    key: 'username',
    header: 'User',
    render: (_value, log) =>
      log.userHash ? (
        <NoRowClick>
          <Link
            to={`${ROUTES.USERS}/${encodeURIComponent(log.userHash)}`}
            className="text-foreground no-underline hover:underline"
          >
            {log.username || log.userHash}
          </Link>
        </NoRowClick>
      ) : (
        <span className="text-muted-foreground">Anonymous</span>
      ),
  },
  {
    key: 'projectName',
    header: 'Project',
    hideOnMobile: true,
    render: (_value, log) =>
      log.projectHash ? (
        <NoRowClick>
          <Link
            to={`${ROUTES.PROJECTS}/${encodeURIComponent(log.projectHash)}`}
            className="text-foreground no-underline hover:underline"
          >
            {log.projectName || log.projectHash}
          </Link>
        </NoRowClick>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'durationMs',
    header: 'Duration',
    align: 'right',
    hideOnMobile: true,
    render: (_value, log) => (
      <span className="tabular-nums text-muted-foreground">
        {formatDuration(log.durationMs)}
      </span>
    ),
  },
  {
    key: 'requestTimestamp',
    header: 'When',
    align: 'right',
    render: (_value, log) => (
      <time
        dateTime={log.requestTimestamp ?? undefined}
        title={formatDateTime(log.requestTimestamp)}
        className="whitespace-nowrap font-mono text-[11px] text-muted-foreground"
      >
        {formatRelativeTime(log.requestTimestamp)}
      </time>
    ),
  },
];

export function ApiRequestsTab(): React.JSX.Element {
  const [pathInput, setPathInput] = useState('');
  const [path, setPath] = useState('');
  const [method, setMethod] = useState<HttpMethod | undefined>(undefined);
  const [outcome, setOutcome] = useState<Outcome>('all');
  const [securityOnly, setSecurityOnly] = useState(false);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ApiAuditLog | null>(null);

  useEffect(() => {
    const next = pathInput.trim();
    if (next === path) return undefined;
    const handle = window.setTimeout(() => {
      setPath(next);
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [pathInput, path]);

  const isSuccess = outcome === 'all' ? undefined : outcome === 'succeeded';
  const params = useMemo(
    () => ({
      limit,
      offset,
      endpoint_path: path || undefined,
      http_method: method,
      is_success: isSuccess,
      security_event: securityOnly ? true : undefined,
      days,
    }),
    [limit, offset, path, method, isSuccess, securityOnly, days]
  );
  const { logs, total, isLoading, isRefreshing, error, refetch } =
    useApiAuditLogs(params);

  const setFilter = (apply: () => void): void => {
    apply();
    setOffset(0);
  };
  const hasFilters = Boolean(
    path || method || outcome !== 'all' || securityOnly || days !== DEFAULT_DAYS
  );
  const clearFilters = (): void =>
    setFilter(() => {
      setPathInput('');
      setPath('');
      setMethod(undefined);
      setOutcome('all');
      setSecurityOnly(false);
      setDays(DEFAULT_DAYS);
    });

  if (error && logs.length === 0 && !isLoading) {
    return (
      <ErrorState
        title="API requests could not be loaded"
        message={error}
        onRetry={() => void refetch()}
        isRetrying={isRefreshing}
      />
    );
  }

  return (
    <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
      <DataView<ApiAuditLog>
        data={logs}
        columns={COLUMNS}
        keyExtractor={(log) => log.id}
        showSearch
        searchValue={pathInput}
        onSearchChange={setPathInput}
        searchPlaceholder="Filter by endpoint path"
        toolbarFilters={
          <>
            <OptionalSelect
              value={method}
              onChange={(next) => setFilter(() => setMethod(next))}
              options={METHOD_OPTIONS}
              allLabel="All methods"
              ariaLabel="HTTP method"
              className="w-[130px]"
            />
            <TabNavigation
              variant="segmented"
              size="sm"
              ariaLabel="Outcome"
              activeTab={outcome}
              onChange={(next) => setFilter(() => setOutcome(next as Outcome))}
              tabs={[
                { id: 'all', label: 'All' },
                { id: 'failed', label: 'Failed' },
                { id: 'succeeded', label: 'Succeeded' },
              ]}
            />
            <DaysSelect
              value={days}
              onChange={(next) => setFilter(() => setDays(next))}
            />
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={securityOnly}
                onCheckedChange={(checked) =>
                  setFilter(() => setSecurityOnly(checked === true))
                }
              />
              Security events only
            </label>
          </>
        }
        toolbarActions={
          <>
            <RefreshButton
              onClick={() => void refetch()}
              refreshing={isRefreshing}
              label="Refresh API requests"
            />
            <ActivityExport
              source="api_audit"
              matchCount={total}
              filters={{
                endpoint_path: path || undefined,
                http_method: method,
                is_success: isSuccess,
                security_event: securityOnly ? true : undefined,
                days,
              }}
            />
          </>
        }
        onRowClick={setSelected}
        isLoading={isLoading}
        skeletonRows={8}
        emptyIcon={<Network className="h-8 w-8" />}
        emptyMessage={
          hasFilters
            ? 'No requests match these filters'
            : 'No API requests in this period'
        }
        emptyDescription={
          hasFilters
            ? 'Try a longer time range or clear the filters.'
            : 'Requests appear once clients call the API.'
        }
        emptyAction={
          hasFilters ? (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
        caption="API requests"
      />
      <TablePager
        offset={offset}
        limit={limit}
        pageCount={logs.length}
        total={total}
        onOffsetChange={setOffset}
        pageSizeOptions={PAGE_SIZES}
        onLimitChange={(next) => {
          setLimit(next);
          setOffset(0);
        }}
        itemLabel="requests"
      />

      <ApiRequestDetailSheet
        request={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export default ApiRequestsTab;
