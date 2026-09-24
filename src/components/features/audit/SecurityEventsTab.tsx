/**
 * Security events (`GET /admin/audit/security-events`): denied and failed
 * API requests plus security-relevant activity, newest first.
 *
 * The endpoint has no offset: it returns at most `limit` events and its
 * summary counts only those. The UI says so rather than faking pages.
 */

import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { ErrorState } from '@/components/common/ErrorState';
import { StatCard } from '@/components/common/StatCard';
import { TabNavigation } from '@/components/common/TabNavigation';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSecurityEvents } from '@/hooks/audit/useAuditData';
import { getActivityLabel } from '@/utils/activity';
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type {
  SecurityEvent,
  SecurityEventSource,
  SecuritySeverity,
} from '@/types/audit.types';
import {
  DaysSelect,
  OptionalSelect,
  RefreshButton,
  ValueSelect,
  type SelectOption,
} from './AuditFilterControls';
import {
  SEVERITY_BADGE,
  formatDuration,
  formatStructured,
  humanizeCode,
  statusCodeVariant,
} from './audit-format';

export interface SecurityEventsTabProps {
  className?: string;
}

const LIMIT_OPTIONS: SelectOption<'100' | '250' | '500'>[] = [
  { value: '100', label: 'Latest 100' },
  { value: '250', label: 'Latest 250' },
  { value: '500', label: 'Latest 500' },
];

const SOURCE_OPTIONS: SelectOption<SecurityEventSource>[] = [
  { value: 'api_audit', label: 'API requests' },
  { value: 'activity_log', label: 'Activity log' },
];

type SeverityFilter = 'all' | SecuritySeverity;

function eventTitle(event: SecurityEvent): string {
  if (event.source === 'activity_log')
    return event.activityName || getActivityLabel(event.eventType);
  return humanizeCode(event.eventType);
}

const COLUMNS: DataViewColumn<SecurityEvent>[] = [
  {
    key: 'severity',
    header: 'Severity',
    render: (_value, event) => (
      <Badge variant={SEVERITY_BADGE[event.severity].variant} size="sm">
        {SEVERITY_BADGE[event.severity].label}
      </Badge>
    ),
  },
  {
    key: 'eventType',
    header: 'Event',
    render: (_value, event) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">
          {eventTitle(event)}
        </div>
        {event.endpointPath ? (
          <div className="max-w-[340px] truncate font-mono text-[11px] text-muted-foreground">
            {event.httpMethod} {event.endpointPath}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Activity log</div>
        )}
      </div>
    ),
  },
  {
    key: 'responseStatus',
    header: 'Status',
    hideOnMobile: true,
    render: (_value, event) =>
      event.responseStatus ? (
        <Badge variant={statusCodeVariant(event.responseStatus)} size="sm">
          {event.responseStatus}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'username',
    header: 'User',
    render: (_value, event) =>
      event.username ? (
        <span className="text-foreground">{event.username}</span>
      ) : (
        <span className="text-muted-foreground">Anonymous</span>
      ),
  },
  {
    key: 'clientIp',
    header: 'IP address',
    hideOnMobile: true,
    render: (_value, event) =>
      event.clientIp ? (
        <span className="font-mono text-xs text-muted-foreground">
          {event.clientIp}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'timestamp',
    header: 'When',
    align: 'right',
    render: (_value, event) => (
      <time
        dateTime={event.timestamp ?? undefined}
        title={formatDateTime(event.timestamp)}
        className="whitespace-nowrap font-mono text-[11px] text-muted-foreground"
      >
        {formatRelativeTime(event.timestamp)}
      </time>
    ),
  },
];

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function SecurityEventSheet({
  event,
  onClose,
}: {
  event: SecurityEvent | null;
  onClose: () => void;
}): React.JSX.Element {
  const details = event ? formatStructured(event.details) : null;
  return (
    <Sheet open={event !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {event && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2 pr-6">
                <SheetTitle className="truncate text-[17px]">
                  {eventTitle(event)}
                </SheetTitle>
                <Badge
                  variant={SEVERITY_BADGE[event.severity].variant}
                  size="sm"
                >
                  {SEVERITY_BADGE[event.severity].label}
                </Badge>
              </div>
              <SheetDescription className="text-xs">
                {event.timestamp
                  ? formatDateTime(event.timestamp)
                  : 'Time unknown'}{' '}
                ·{' '}
                {event.source === 'api_audit' ? 'API request' : 'Activity log'}
              </SheetDescription>
            </SheetHeader>
            <dl className="mt-5 divide-y divide-border border-y border-border">
              <Row label="Event code">
                <span className="font-mono text-xs">{event.eventType}</span>
              </Row>
              {event.endpointPath && (
                <Row label="Request">
                  <span className="font-mono text-xs">
                    {event.httpMethod} {event.endpointPath}
                  </span>
                </Row>
              )}
              {event.responseStatus !== null && (
                <Row label="Status">
                  <Badge
                    variant={statusCodeVariant(event.responseStatus)}
                    size="sm"
                  >
                    {event.responseStatus}
                  </Badge>
                </Row>
              )}
              {event.errorCode && (
                <Row label="Error">{humanizeCode(event.errorCode)}</Row>
              )}
              {event.errorMessage && (
                <Row label="Message">{event.errorMessage}</Row>
              )}
              {event.durationMs !== null && (
                <Row label="Duration">{formatDuration(event.durationMs)}</Row>
              )}
              <Row label="User">
                {event.username ?? (
                  <span className="text-muted-foreground">Anonymous</span>
                )}
              </Row>
              <Row label="IP address">
                {event.clientIp ? (
                  <span className="font-mono text-xs">{event.clientIp}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Row>
            </dl>
            {details && (
              <section className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Details
                </h3>
                <pre className="m-0 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                  {details}
                </pre>
              </section>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function SecurityEventsTab({
  className,
}: SecurityEventsTabProps): React.JSX.Element {
  const [days, setDays] = useState(7);
  const [limit, setLimit] = useState<'100' | '250' | '500'>('100');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [source, setSource] = useState<SecurityEventSource | undefined>(
    undefined
  );
  const [selected, setSelected] = useState<SecurityEvent | null>(null);

  const params = useMemo(
    () => ({
      days,
      limit: Number(limit),
      severity: severity === 'all' ? undefined : severity,
      source,
    }),
    [days, limit, severity, source]
  );
  const { result, isLoading, isRefreshing, error, refetch } =
    useSecurityEvents(params);
  const events = result?.events ?? [];
  const summary = result?.summary;
  const capped = Boolean(summary && summary.total >= Number(limit));

  if (error && !result && !isLoading) {
    return (
      <ErrorState
        title="Security events could not be loaded"
        message={error}
        onRetry={() => void refetch()}
        isRetrying={isRefreshing}
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <section
        aria-label="Security event summary"
        className="grid grid-cols-2 gap-3.5 xl:grid-cols-4"
      >
        <StatCard
          title="Events"
          value={formatNumber(summary?.total)}
          loading={isLoading}
          subValue={
            capped
              ? `Latest ${limit} shown — narrow the range for older events`
              : 'In the selected range'
          }
        />
        <StatCard
          title="Critical"
          value={formatNumber(summary?.bySeverity.critical)}
          loading={isLoading}
          subValue="Access denied (403)"
        />
        <StatCard
          title="Warning"
          value={formatNumber(summary?.bySeverity.warning)}
          loading={isLoading}
          subValue="Unauthenticated (401) and server errors"
        />
        <StatCard
          title="Sources"
          value={`${formatNumber(summary?.bySource.api_audit)} / ${formatNumber(summary?.bySource.activity_log)}`}
          loading={isLoading}
          subValue="API requests / activity log"
        />
      </section>

      <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
        <DataView<SecurityEvent>
          data={events}
          columns={COLUMNS}
          keyExtractor={(event) => `${event.source}:${event.id}`}
          toolbarFilters={
            <>
              <TabNavigation
                variant="segmented"
                size="sm"
                ariaLabel="Severity"
                activeTab={severity}
                onChange={(next) => setSeverity(next as SeverityFilter)}
                tabs={[
                  { id: 'all', label: 'All' },
                  { id: 'critical', label: 'Critical' },
                  { id: 'warning', label: 'Warning' },
                  { id: 'info', label: 'Info' },
                ]}
              />
              <OptionalSelect
                value={source}
                onChange={setSource}
                options={SOURCE_OPTIONS}
                allLabel="All sources"
                ariaLabel="Source"
              />
              <DaysSelect value={days} onChange={setDays} />
              <ValueSelect
                value={limit}
                onChange={setLimit}
                options={LIMIT_OPTIONS}
                ariaLabel="Number of events"
                className="w-[130px]"
              />
            </>
          }
          toolbarActions={
            <RefreshButton
              onClick={() => void refetch()}
              refreshing={isRefreshing}
              label="Refresh security events"
            />
          }
          onRowClick={setSelected}
          isLoading={isLoading}
          skeletonRows={8}
          emptyIcon={<ShieldCheck className="h-8 w-8" />}
          emptyMessage="No security events"
          emptyDescription="Nothing was denied or flagged in this range."
          caption="Security events"
        />
      </div>

      <SecurityEventSheet event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default SecurityEventsTab;
