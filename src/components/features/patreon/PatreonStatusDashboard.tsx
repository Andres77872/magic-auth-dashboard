/**
 * PatreonStatusDashboard
 *
 * Read-only Overview for the Patreon entitlement/link integration: what needs
 * attention, headline numbers, configuration posture and per-component health.
 * The status payload is loaded once by the page and passed in.
 */

import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  KeyRound,
  ListChecks,
  MailCheck,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Timer,
  Users,
  Wallet,
} from 'lucide-react';
import { ErrorState, Skeleton } from '@/components/common';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FeatureFlagChips,
  MetricTile,
} from '@/pages/dashboard/components/health';
import { formatDuration } from '@/lib/health-format';
import type {
  PatreonAdminStatus,
  PatreonStatusGroup,
} from '@/types/patreon.types';
import {
  normalizePatreonTimestamp,
  patreonStatusLabel,
} from '@/types/patreon.types';
import { StatusBadge } from './StatusBadge';
import { Timestamp } from './patreon-format';

// ---------------------------------------------------------------------------
// Value helpers (the payload is loosely typed per component)
// ---------------------------------------------------------------------------

function num(group: PatreonStatusGroup, key: string): number | undefined {
  const value = group.details[key];
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function text(group: PatreonStatusGroup, key: string): string | undefined {
  const value = group.details[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function count(value: number | undefined): string {
  return value === undefined ? '—' : value.toLocaleString();
}

// ---------------------------------------------------------------------------
// "Needs attention": each unhealthy signal as one sentence with its remedy
// ---------------------------------------------------------------------------

const TOKEN_PROBLEMS: Record<string, string> = {
  not_ready:
    'No creator access token is configured, so Patreon cannot be read.',
  refresh_failed:
    'Refreshing the creator token failed; fix the refresh settings or rotate PATREON_CREATOR_ACCESS_TOKEN.',
  revoked:
    'Patreon rejected the creator token; rotate PATREON_CREATOR_ACCESS_TOKEN.',
  expired:
    'The creator token has expired; rotate PATREON_CREATOR_ACCESS_TOKEN.',
};

interface AttentionItem {
  key: string;
  severity: 'warning' | 'destructive';
  message: string;
}

function attentionItems(data: PatreonAdminStatus): AttentionItem[] {
  const items: AttentionItem[] = [];
  const {
    readiness,
    creatorToken,
    webhooks,
    snapshots,
    tierMap,
    proofDelivery,
    worker,
    syncQueue,
    databaseClock,
  } = data;
  if (readiness.disabled) return items;

  if (readiness.missing.length) {
    items.push({
      key: 'missing',
      severity: 'destructive',
      message: `Missing configuration: ${readiness.missing.join(', ')}. Enabled features stay unavailable until it is set.`,
    });
  }
  if (creatorToken.degraded) {
    items.push({
      key: 'token',
      severity: 'destructive',
      message: `${TOKEN_PROBLEMS[creatorToken.status] ?? 'The creator token is not usable.'} Entitlements stop updating until Patreon can be read again.`,
    });
  }
  if (readiness.featureFlags.sync && worker.status !== 'healthy') {
    items.push({
      key: 'worker',
      severity: 'destructive',
      message:
        'The sync worker has no recent heartbeat: queued resyncs and scheduled sweeps are not running.',
    });
  }
  const failedJobs = num(syncQueue, 'failed_jobs');
  if (failedJobs) {
    items.push({
      key: 'failed-jobs',
      severity: 'warning',
      message: `${count(failedJobs)} sync ${failedJobs === 1 ? 'job' : 'jobs'} failed in the last ${num(syncQueue, 'failed_jobs_window_hours') ?? 24}h. See Sync & webhooks.`,
    });
  }
  const stale = num(snapshots, 'stale_snapshot_count');
  if (stale) {
    items.push({
      key: 'stale',
      severity: 'warning',
      message: `${count(stale)} linked ${stale === 1 ? 'entitlement is' : 'entitlements are'} stale (not refreshed from Patreon in time). Paid access is served as stale until a sync succeeds.`,
    });
  }
  const misses = num(tierMap, 'misses_24h');
  if (misses) {
    items.push({
      key: 'tier-map',
      severity: 'warning',
      message: `${count(misses)} tier-map ${misses === 1 ? 'miss' : 'misses'} in 24h: a patron is on a tier the tier map does not cover, so no paid plan was granted.`,
    });
  }
  if (webhooks.status === 'degraded') {
    items.push({
      key: 'webhooks',
      severity: 'warning',
      message: `Webhook signature failures crossed the alert threshold (${count(num(webhooks, 'signature_failure_count'))} in the window). Check PATREON_WEBHOOK_SECRET against Patreon.`,
    });
  }
  const failedProofs = num(proofDelivery, 'failed_24h');
  if (failedProofs) {
    items.push({
      key: 'proofs',
      severity: 'warning',
      message: `${count(failedProofs)} link-proof ${failedProofs === 1 ? 'email' : 'emails'} failed to deliver in 24h.`,
    });
  }
  if (databaseClock.status === 'degraded') {
    items.push({
      key: 'clock',
      severity: 'warning',
      message: `The database session clock is ${count(num(databaseClock, 'utc_offset_seconds'))}s off UTC; proof expiry and freshness windows are skewed. Run MySQL in UTC.`,
    });
  }
  return items;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function SummaryCard({
  data,
}: {
  data: PatreonAdminStatus;
}): React.JSX.Element {
  const items = attentionItems(data);
  const sentence = data.readiness.checkFailed
    ? 'The Patreon configuration could not be read.'
    : data.readiness.disabled
      ? 'The integration is off. Nothing is linked, synced or served.'
      : items.length
        ? `${items.length} ${items.length === 1 ? 'thing needs' : 'things need'} attention.`
        : 'Everything that is enabled is working.';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Patreon integration</CardTitle>
              <StatusBadge status={data.status} />
            </div>
            <CardDescription className="mt-1">{sentence}</CardDescription>
          </div>
          <span className="text-xs text-muted-foreground">
            Checked{' '}
            <Timestamp
              value={normalizePatreonTimestamp(data.generatedAt)}
              className="text-xs"
            />
          </span>
        </div>
      </CardHeader>
      {items.length > 0 && (
        <CardContent>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <AlertTriangle
                  className={
                    item.severity === 'destructive'
                      ? 'mt-0.5 h-4 w-4 shrink-0 text-destructive'
                      : 'mt-0.5 h-4 w-4 shrink-0 text-warning'
                  }
                  aria-hidden="true"
                />
                <span>{item.message}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      {items.length === 0 &&
        !data.readiness.disabled &&
        !data.readiness.checkFailed && (
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
            No open issues.
          </CardContent>
        )}
    </Card>
  );
}

function KeyNumbers({ data }: { data: PatreonAdminStatus }): React.JSX.Element {
  const { snapshots, syncQueue, worker, readiness } = data;
  const stale = num(snapshots, 'stale_snapshot_count');
  const queued =
    (num(syncQueue, 'pending_jobs') ?? 0) + (num(syncQueue, 'retry_jobs') ?? 0);
  const failed = num(syncQueue, 'failed_jobs');
  const heartbeatAge = num(worker, 'latest_heartbeat_age_seconds');

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricTile
        label="Linked users"
        value={count(num(snapshots, 'linked_count'))}
        icon={<Users className="h-3.5 w-3.5" />}
      />
      <MetricTile
        label="Paid entitlements"
        value={count(num(snapshots, 'active_paid_count'))}
        icon={<Wallet className="h-3.5 w-3.5" />}
      />
      <MetricTile
        label="Stale"
        value={count(stale)}
        icon={<Timer className="h-3.5 w-3.5" />}
        tone={stale ? 'warning' : 'muted'}
      />
      <MetricTile
        label="Queued jobs"
        value={queued.toLocaleString()}
        icon={<ListChecks className="h-3.5 w-3.5" />}
        hint={
          num(syncQueue, 'running_jobs')
            ? `${num(syncQueue, 'running_jobs')} running`
            : undefined
        }
      />
      <MetricTile
        label="Failed jobs (24h)"
        value={count(failed)}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        tone={failed ? 'destructive' : 'muted'}
      />
      <MetricTile
        label="Worker heartbeat"
        value={
          heartbeatAge === undefined
            ? 'None'
            : `${formatDuration(heartbeatAge)} ago`
        }
        icon={<Activity className="h-3.5 w-3.5" />}
        tone={
          readiness.featureFlags.sync && worker.status !== 'healthy'
            ? 'warning'
            : 'muted'
        }
        hint={
          text(worker, 'latest_mode')
            ? `Last pass: ${patreonStatusLabel(text(worker, 'latest_mode'))}`
            : undefined
        }
      />
    </div>
  );
}

const RETENTION_LABELS: Array<[string, string, string]> = [
  ['proof_retention_after_expiry_hours', 'Link proofs', 'h after expiry'],
  ['webhook_delivery_retention_days', 'Webhook ledger', ' days'],
  ['raw_payload_retention_days', 'Raw payload quarantine', ' days'],
];

function ConfigurationCard({
  data,
}: {
  data: PatreonAdminStatus;
}): React.JSX.Element {
  const { readiness } = data;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Configuration</CardTitle>
          <StatusBadge status={readiness.status} />
        </div>
        <CardDescription>
          Server-side settings; secrets are never shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeatureFlagChips
          flags={{
            linking: readiness.featureFlags.linking,
            webhooks: readiness.featureFlags.webhooks,
            sync: readiness.featureFlags.sync,
            s2s_entitlement: readiness.featureFlags.s2sEntitlement,
            creator_token_refresh: readiness.featureFlags.creatorTokenRefresh,
            raw_payload_capture: readiness.featureFlags.rawPayloadCapture,
          }}
        />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Campaigns</dt>
            <dd className="text-lg font-semibold text-foreground">
              {readiness.configuredCampaignCount}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Tier-map entries</dt>
            <dd className="text-lg font-semibold text-foreground">
              {readiness.configuredTierMapEntries}
            </dd>
          </div>
        </dl>
        {readiness.missing.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Missing settings</p>
            <p className="mt-1 break-words font-mono text-xs text-foreground">
              {readiness.missing.join(', ')}
            </p>
          </div>
        )}
        {readiness.degraded.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">Degraded</p>
            <p className="mt-1 text-sm text-foreground">
              {readiness.degraded
                .map((item) => patreonStatusLabel(item))
                .join(', ')}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Retention</p>
          <ul className="mt-1 space-y-0.5 text-sm text-foreground">
            {RETENTION_LABELS.map(([key, label, unit]) => {
              const value = readiness.retention[key];
              return typeof value === 'number' ? (
                <li key={key} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span>
                    {value}
                    {unit}
                  </span>
                </li>
              ) : null;
            })}
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">
                Link and entitlement history
              </span>
              <span>Kept</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

interface ComponentRow {
  key: string;
  label: string;
  icon: React.ReactNode;
  group: PatreonStatusGroup;
  detail: React.ReactNode;
}

function componentRows(data: PatreonAdminStatus): ComponentRow[] {
  const {
    creatorToken,
    webhooks,
    snapshots,
    tierMap,
    proofDelivery,
    s2s,
    worker,
    syncQueue,
    databaseClock,
  } = data;
  const tokenExpiry = normalizePatreonTimestamp(
    text(creatorToken, 'expires_at')
  );
  return [
    {
      key: 'creator-token',
      label: 'Creator token',
      icon: <KeyRound />,
      group: creatorToken,
      detail:
        text(creatorToken, 'source') === 'environment' ? (
          'Static token from server settings'
        ) : tokenExpiry ? (
          <>
            Expires <Timestamp value={tokenExpiry} className="text-xs" />
          </>
        ) : creatorToken.configured ? (
          'Configured'
        ) : (
          'Not configured'
        ),
    },
    {
      key: 'webhooks',
      label: 'Webhooks',
      icon: <Radio />,
      group: webhooks,
      detail: webhooks.enabled
        ? `${count(num(webhooks, 'signature_failure_count'))} signature failures · ${count(num(webhooks, 'retrying_deliveries'))} failed deliveries`
        : 'Off',
    },
    {
      key: 'snapshots',
      label: 'Entitlement freshness',
      icon: <Database />,
      group: snapshots,
      detail: `${count(num(snapshots, 'stale_snapshot_count'))} stale of ${count(num(snapshots, 'linked_count'))} linked`,
    },
    {
      key: 'tier-map',
      label: 'Tier map',
      icon: <ShieldCheck />,
      group: tierMap,
      detail: `${count(num(tierMap, 'configured_entries'))} entries · ${count(num(tierMap, 'misses_24h'))} misses (24h)`,
    },
    {
      key: 'proof-delivery',
      label: 'Link-proof emails',
      icon: <MailCheck />,
      group: proofDelivery,
      detail: `${count(num(proofDelivery, 'delivered_24h'))} sent · ${count(num(proofDelivery, 'failed_24h'))} failed · ${count(num(proofDelivery, 'in_flight'))} queued (24h)`,
    },
    {
      key: 's2s',
      label: 'S2S entitlement API',
      icon: <Server />,
      group: s2s,
      detail: s2s.enabled
        ? s2s.ready
          ? 'Serving'
          : 'Enabled, not ready'
        : 'Off',
    },
    {
      key: 'worker',
      label: 'Sync worker',
      icon: <Activity />,
      group: worker,
      detail:
        num(worker, 'latest_heartbeat_age_seconds') !== undefined
          ? `Heartbeat ${formatDuration(num(worker, 'latest_heartbeat_age_seconds'))} ago`
          : 'No heartbeat',
    },
    {
      key: 'sync-queue',
      label: 'Sync queue',
      icon: <RefreshCw />,
      group: syncQueue,
      detail: `${count(num(syncQueue, 'pending_jobs'))} pending · ${count(num(syncQueue, 'running_jobs'))} running · ${count(num(syncQueue, 'retry_jobs'))} retrying`,
    },
    {
      key: 'database-clock',
      label: 'Database clock',
      icon: <Clock />,
      group: databaseClock,
      detail:
        num(databaseClock, 'utc_offset_seconds') !== undefined
          ? num(databaseClock, 'utc_offset_seconds') === 0
            ? 'UTC'
            : `${count(num(databaseClock, 'utc_offset_seconds'))}s from UTC`
          : '—',
    },
  ];
}

function ComponentHealthCard({
  data,
}: {
  data: PatreonAdminStatus;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Components</CardTitle>
        <CardDescription>
          Each part of the integration and its latest signal.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {componentRows(data).map((row) => (
            <li key={row.key} className="flex items-center gap-3 px-6 py-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4"
                aria-hidden="true"
              >
                {row.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {row.label}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.detail}
                </p>
              </div>
              <StatusBadge status={row.group.status} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

export interface PatreonStatusDashboardProps {
  status: PatreonAdminStatus | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function PatreonStatusDashboard({
  status,
  isLoading,
  error,
  onRetry,
}: PatreonStatusDashboardProps): React.JSX.Element {
  if (isLoading && !status) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-28 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <ErrorState
        title="Couldn’t load Patreon status"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!status) {
    return (
      <ErrorState
        title="No Patreon status"
        message="The server returned no status."
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SummaryCard data={status} />
      <KeyNumbers data={status} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <ConfigurationCard data={status} />
        <ComponentHealthCard data={status} />
      </div>
      <p className="text-xs text-muted-foreground">
        Patreon only grants entitlements. It never signs anyone in, issues
        sessions or tokens, or changes auth validation.
      </p>
    </div>
  );
}

export default PatreonStatusDashboard;
