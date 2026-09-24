/**
 * PatreonSyncWebhooksTab
 *
 * ROOT-only operational view: the sync-job queue and recent webhook deliveries,
 * each with a status filter. Resyncs are queued from the page header.
 */

import React, { useCallback, useMemo } from 'react';
import { Info, Webhook, Workflow } from 'lucide-react';
import {
  CopyableId,
  DataView,
  ErrorState,
  FilterBar,
  Pagination,
  type DataViewColumn,
  type Filter,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { usePatreonSyncJobs, usePatreonWebhooks } from '@/hooks';
import {
  patreonStatusLabel,
  type PatreonSyncJob,
  type PatreonWebhookDelivery,
} from '@/types/patreon.types';
import { StatusBadge } from './StatusBadge';
import { Timestamp } from './patreon-format';
import { useRefreshSignal } from './useRefreshSignal';

const PAGE_SIZE = 20;
const ALL = 'all';

const JOB_STATUS_OPTIONS = [
  { value: ALL, label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'running', label: 'Running' },
  { value: 'retry', label: 'Retrying' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const DELIVERY_STATUS_OPTIONS = [
  { value: ALL, label: 'Any status' },
  { value: 'processed', label: 'Processed' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'failed', label: 'Failed' },
  { value: 'received', label: 'Received' },
  { value: 'replay', label: 'Replay' },
];

function SectionHeader({
  icon,
  title,
  description,
  filter,
  total,
  noun,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  filter: Filter;
  total: number | null;
  noun: [string, string];
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {total !== null && (
          <span className="text-sm text-muted-foreground">
            {total.toLocaleString()} {total === 1 ? noun[0] : noun[1]}
          </span>
        )}
        <FilterBar filters={[filter]} showClearButton={false} />
      </div>
    </div>
  );
}

export interface PatreonSyncWebhooksTabProps {
  /** Incremented by the page after a resync is queued or on page refresh. */
  refreshSignal?: number;
}

export function PatreonSyncWebhooksTab({
  refreshSignal = 0,
}: PatreonSyncWebhooksTabProps): React.JSX.Element {
  const jobs = usePatreonSyncJobs(PAGE_SIZE);
  const webhooks = usePatreonWebhooks(PAGE_SIZE);
  const { fetchSyncJobs } = jobs;
  const { fetchWebhooks } = webhooks;

  useRefreshSignal(
    refreshSignal,
    useCallback(() => {
      void fetchSyncJobs();
      void fetchWebhooks();
    }, [fetchSyncJobs, fetchWebhooks])
  );

  const jobColumns: DataViewColumn<PatreonSyncJob>[] = useMemo(
    () => [
      {
        key: 'jobType',
        header: 'Job',
        render: (_v, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {patreonStatusLabel(row.jobType)}
            </span>
            <CopyableId
              id={row.jobId}
              startChars={8}
              endChars={4}
              label="job id"
            />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (_v, row) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={row.status} />
            {row.hasError && row.status !== 'failed' && (
              <Badge
                variant="warning"
                size="sm"
                title="The last attempt reported an error"
              >
                Error
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: 'source',
        header: 'Source',
        hideOnMobile: true,
        render: (_v, row) => (
          <span className="text-sm text-muted-foreground">
            {row.source ? patreonStatusLabel(row.source) : '—'}
          </span>
        ),
      },
      {
        key: 'attempts',
        header: 'Attempts',
        align: 'center',
        render: (_v, row) => (
          <span className="text-sm tabular-nums">
            {row.attempts}/{row.maxAttempts}
          </span>
        ),
      },
      {
        key: 'notBefore',
        header: 'Next run',
        hideOnMobile: true,
        render: (_v, row) =>
          row.status === 'pending' || row.status === 'retry' ? (
            <Timestamp value={row.notBefore} />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Queued',
        render: (_v, row) => <Timestamp value={row.createdAt} />,
      },
      {
        key: 'completedAt',
        header: 'Finished',
        hideOnMobile: true,
        render: (_v, row) => <Timestamp value={row.completedAt} />,
      },
    ],
    []
  );

  const webhookColumns: DataViewColumn<PatreonWebhookDelivery>[] = useMemo(
    () => [
      {
        key: 'eventType',
        header: 'Event',
        render: (_v, row) => (
          <div className="flex flex-col">
            <span className="font-mono text-sm text-foreground">
              {row.eventType}
            </span>
            <CopyableId
              id={row.deliveryId}
              startChars={8}
              endChars={4}
              label="delivery id"
            />
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Outcome',
        render: (_v, row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'receivedAt',
        header: 'Received',
        render: (_v, row) => <Timestamp value={row.receivedAt} />,
      },
      {
        key: 'processedAt',
        header: 'Processed',
        hideOnMobile: true,
        render: (_v, row) => <Timestamp value={row.processedAt} />,
      },
    ],
    []
  );

  const jobsPageSize = jobs.filters.limit || PAGE_SIZE;
  const jobsPage = Math.floor((jobs.filters.offset || 0) / jobsPageSize) + 1;
  const jobsTotalPages = jobs.pagination
    ? Math.ceil(jobs.pagination.total / jobsPageSize)
    : 0;
  const hooksPageSize = webhooks.filters.limit || PAGE_SIZE;
  const hooksPage =
    Math.floor((webhooks.filters.offset || 0) / hooksPageSize) + 1;
  const hooksTotalPages = webhooks.pagination
    ? Math.ceil(webhooks.pagination.total / hooksPageSize)
    : 0;

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-label="Sync jobs">
        <SectionHeader
          icon={<Workflow />}
          title="Sync jobs"
          description="Resyncs and sweeps queued for the sync worker. Finished jobs are kept for 30 days."
          filter={{
            key: 'jobStatus',
            label: 'Job status',
            options: JOB_STATUS_OPTIONS,
            value: jobs.filters.status || ALL,
            onChange: (value) =>
              jobs.setFilters({
                status: value === ALL ? '' : value,
                offset: 0,
              }),
          }}
          total={jobs.error ? null : (jobs.pagination?.total ?? null)}
          noun={['job', 'jobs']}
        />
        {jobs.error ? (
          <ErrorState
            title="Couldn’t load sync jobs"
            message={jobs.error}
            onRetry={() => void fetchSyncJobs()}
          />
        ) : (
          <DataView<PatreonSyncJob>
            data={jobs.jobs}
            columns={jobColumns}
            keyExtractor={(item) => item.jobId}
            isLoading={jobs.isLoading}
            emptyIcon={<Workflow size={32} aria-hidden="true" />}
            emptyMessage={
              jobs.filters.status ? 'No jobs with this status' : 'No sync jobs'
            }
            emptyDescription="Jobs appear when a resync is queued, a webhook needs a source-of-truth read, or a sweep runs."
          />
        )}
        {!jobs.error && jobsTotalPages > 1 && jobs.pagination && (
          <Pagination
            currentPage={jobsPage}
            totalPages={jobsTotalPages}
            totalItems={jobs.pagination.total}
            itemsPerPage={jobsPageSize}
            onPageChange={(page) =>
              jobs.setFilters({ offset: (page - 1) * jobsPageSize })
            }
            itemLabelSingular="job"
            itemLabelPlural="jobs"
          />
        )}
      </section>

      <section className="space-y-3" aria-label="Webhook deliveries">
        <SectionHeader
          icon={<Webhook />}
          title="Webhook deliveries"
          description="Signed deliveries from Patreon and what happened to each. Kept for 90 days."
          filter={{
            key: 'deliveryStatus',
            label: 'Delivery outcome',
            options: DELIVERY_STATUS_OPTIONS,
            value: webhooks.filters.status || ALL,
            onChange: (value) =>
              webhooks.setFilters({
                status: value === ALL ? '' : value,
                offset: 0,
              }),
          }}
          total={webhooks.error ? null : (webhooks.pagination?.total ?? null)}
          noun={['delivery', 'deliveries']}
        />
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Only deliveries with a valid signature are recorded. Rejected
          signatures are counted on the Overview.
        </p>
        {webhooks.error ? (
          <ErrorState
            title="Couldn’t load webhook deliveries"
            message={webhooks.error}
            onRetry={() => void fetchWebhooks()}
          />
        ) : (
          <DataView<PatreonWebhookDelivery>
            data={webhooks.deliveries}
            columns={webhookColumns}
            keyExtractor={(item) => item.deliveryId}
            isLoading={webhooks.isLoading}
            emptyIcon={<Webhook size={32} aria-hidden="true" />}
            emptyMessage={
              webhooks.filters.status
                ? 'No deliveries with this outcome'
                : 'No webhook deliveries'
            }
            emptyDescription="Register the /webhooks/patreon endpoint in Patreon; deliveries appear here once they arrive."
          />
        )}
        {!webhooks.error && hooksTotalPages > 1 && webhooks.pagination && (
          <Pagination
            currentPage={hooksPage}
            totalPages={hooksTotalPages}
            totalItems={webhooks.pagination.total}
            itemsPerPage={hooksPageSize}
            onPageChange={(page) =>
              webhooks.setFilters({ offset: (page - 1) * hooksPageSize })
            }
            itemLabelSingular="delivery"
            itemLabelPlural="deliveries"
          />
        )}
      </section>
    </div>
  );
}

export default PatreonSyncWebhooksTab;
