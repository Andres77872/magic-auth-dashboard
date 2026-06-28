/**
 * PatreonSyncWebhooksTab
 *
 * ROOT-only operational view: the sync-job queue and recent webhook deliveries,
 * plus a top-level manual resync action.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Badge,
  Button,
  DataView,
  Pagination,
  type DataViewColumn,
} from '@/components/common';
import { usePatreonSyncJobs, usePatreonWebhooks } from '@/hooks';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { toneClasses } from './patreon-status-tone';
import { PatreonResyncModal } from './PatreonResyncModal';
import type { PatreonSyncJob, PatreonWebhookDelivery } from '@/types/patreon.types';

const PAGE_SIZE = 20;

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function PatreonSyncWebhooksTab(): React.JSX.Element {
  const jobs = usePatreonSyncJobs(PAGE_SIZE);
  const webhooks = usePatreonWebhooks(PAGE_SIZE);
  const [resyncOpen, setResyncOpen] = useState(false);

  const jobsPage = Math.floor((jobs.filters.offset || 0) / (jobs.filters.limit || PAGE_SIZE)) + 1;
  const jobsTotalPages = jobs.pagination ? Math.ceil(jobs.pagination.total / jobs.pagination.limit) : 0;
  const webhooksPage =
    Math.floor((webhooks.filters.offset || 0) / (webhooks.filters.limit || PAGE_SIZE)) + 1;
  const webhooksTotalPages = webhooks.pagination
    ? Math.ceil(webhooks.pagination.total / webhooks.pagination.limit)
    : 0;

  const handleJobsPageChange = useCallback(
    (page: number) => {
      const offset = (page - 1) * (jobs.filters.limit || PAGE_SIZE);
      jobs.setFilters({ offset });
      void jobs.fetchSyncJobs({ offset });
    },
    [jobs]
  );

  const handleWebhooksPageChange = useCallback(
    (page: number) => {
      const offset = (page - 1) * (webhooks.filters.limit || PAGE_SIZE);
      webhooks.setFilters({ offset });
      void webhooks.fetchWebhooks({ offset });
    },
    [webhooks]
  );

  const jobColumns: DataViewColumn<PatreonSyncJob>[] = useMemo(
    () => [
      {
        key: 'jobType',
        header: 'Job',
        render: (_v, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{row.jobType}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.jobId}</span>
          </div>
        ),
      },
      { key: 'status', header: 'Status', render: (_v, row) => <StatusBadge status={row.status} /> },
      {
        key: 'source',
        header: 'Source',
        render: (_v, row) => <span className="text-sm text-muted-foreground">{row.source || '—'}</span>,
      },
      {
        key: 'attempts',
        header: 'Attempts',
        align: 'center',
        render: (_v, row) => (
          <span className="text-sm">
            {row.attempts}/{row.maxAttempts}
          </span>
        ),
      },
      {
        key: 'hasError',
        header: 'Error',
        align: 'center',
        render: (_v, row) =>
          row.hasError ? (
            <Badge variant="outline" className={cn(toneClasses('destructive'))}>
              Error
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (_v, row) => (
          <span className="text-sm text-muted-foreground">{formatTimestamp(row.createdAt)}</span>
        ),
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
            <span className="text-sm font-medium text-foreground">{row.eventType}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.deliveryId}</span>
          </div>
        ),
      },
      { key: 'status', header: 'Status', render: (_v, row) => <StatusBadge status={row.status} /> },
      {
        key: 'signatureValid',
        header: 'Signature',
        align: 'center',
        render: (_v, row) => (
          <Badge
            variant="outline"
            className={cn(toneClasses(row.signatureValid ? 'success' : 'destructive'))}
          >
            {row.signatureValid ? 'Valid' : 'Invalid'}
          </Badge>
        ),
      },
      {
        key: 'receivedAt',
        header: 'Received',
        render: (_v, row) => (
          <span className="text-sm text-muted-foreground">{formatTimestamp(row.receivedAt)}</span>
        ),
      },
      {
        key: 'processedAt',
        header: 'Processed',
        render: (_v, row) => (
          <span className="text-sm text-muted-foreground">{formatTimestamp(row.processedAt)}</span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <p className="text-sm text-foreground">
            Resyncs are enqueued as jobs and processed only while the Patreon sync worker
            is running. Watch the worker heartbeat on the Overview tab.
          </p>
        </div>
        <Button variant="primary" onClick={() => setResyncOpen(true)}>
          <RefreshCw size={14} className="mr-1.5" />
          Resync…
        </Button>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Sync jobs</h3>
        <DataView<PatreonSyncJob>
          data={jobs.jobs}
          columns={jobColumns}
          keyExtractor={(item) => item.jobId}
          isLoading={jobs.isLoading}
          emptyMessage="No sync jobs"
          emptyDescription={jobs.error || 'No Patreon sync jobs have been recorded.'}
        />
        {jobsTotalPages > 1 && jobs.pagination && (
          <Pagination
            currentPage={jobsPage}
            totalPages={jobsTotalPages}
            totalItems={jobs.pagination.total}
            itemsPerPage={jobs.pagination.limit}
            onPageChange={handleJobsPageChange}
            itemLabelSingular="job"
            itemLabelPlural="jobs"
          />
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Webhook deliveries</h3>
        <DataView<PatreonWebhookDelivery>
          data={webhooks.deliveries}
          columns={webhookColumns}
          keyExtractor={(item) => item.deliveryId}
          isLoading={webhooks.isLoading}
          emptyMessage="No webhook deliveries"
          emptyDescription={webhooks.error || 'No Patreon webhook deliveries have been recorded.'}
        />
        {webhooksTotalPages > 1 && webhooks.pagination && (
          <Pagination
            currentPage={webhooksPage}
            totalPages={webhooksTotalPages}
            totalItems={webhooks.pagination.total}
            itemsPerPage={webhooks.pagination.limit}
            onPageChange={handleWebhooksPageChange}
            itemLabelSingular="delivery"
            itemLabelPlural="deliveries"
          />
        )}
      </section>

      <PatreonResyncModal
        isOpen={resyncOpen}
        onClose={() => setResyncOpen(false)}
        onSubmitted={() => void jobs.fetchSyncJobs()}
      />
    </div>
  );
}

export default PatreonSyncWebhooksTab;
