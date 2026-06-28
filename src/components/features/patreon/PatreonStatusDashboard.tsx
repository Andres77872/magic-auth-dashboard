/**
 * PatreonStatusDashboard
 *
 * Read-only operational view for the Patreon entitlement/link integration.
 */

import React from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Database,
  HeartHandshake,
  KeyRound,
  Link2,
  MailCheck,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { Button, ErrorState, Skeleton } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatreonStatus } from '@/hooks/usePatreonStatus';
import { cn } from '@/lib/utils';
import {
  formatPatreonMetric,
  type PatreonAdminStatus,
  type PatreonStatusGroup,
} from '@/types/patreon.types';
import { StatusBadge } from './StatusBadge';
import { toneClasses } from './patreon-status-tone';

function formatTimestamp(value?: string): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatSeconds(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'None';
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.round(value / 60)}m`;
  if (value < 86400) return `${Math.round(value / 3600)}h`;
  return `${Math.round(value / 86400)}d`;
}

function FeatureFlagCard({
  label,
  enabled,
  icon,
}: {
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </span>
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
      </div>
      <Badge
        variant="outline"
        className={enabled ? toneClasses('success') : toneClasses('muted')}
      >
        {enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    </div>
  );
}

function HealthCard({
  title,
  group,
  icon,
  details,
}: {
  title: string;
  group: PatreonStatusGroup;
  icon: React.ReactNode;
  details: Array<[string, unknown]>;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
            <CardTitle className="truncate text-sm font-semibold">{title}</CardTitle>
          </div>
          <StatusBadge status={group.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {details.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[55%] truncate text-right font-medium text-foreground">
              {formatPatreonMetric(value, 'None')}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function PatreonStatusContent({ data }: { data: PatreonAdminStatus }): React.JSX.Element {
  const flags = data.readiness.featureFlags;
  const metrics = data.metrics;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartHandshake size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">Patreon operations</h2>
                <StatusBadge status={data.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {data.readiness.ready
                  ? 'Ready for enabled Patreon surfaces'
                  : data.readiness.disabled
                    ? 'All primary Patreon surfaces are disabled'
                    : 'Configuration needs attention before activation'}
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Generated {formatTimestamp(data.generatedAt)}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <FeatureFlagCard label="Linking" enabled={flags.linking} icon={<Link2 size={17} />} />
        <FeatureFlagCard label="Webhooks" enabled={flags.webhooks} icon={<Radio size={17} />} />
        <FeatureFlagCard label="Sync" enabled={flags.sync} icon={<RefreshCw size={17} />} />
        <FeatureFlagCard label="S2S entitlement" enabled={flags.s2sEntitlement} icon={<Server size={17} />} />
        <FeatureFlagCard label="Creator token refresh" enabled={flags.creatorTokenRefresh} icon={<KeyRound size={17} />} />
        <FeatureFlagCard label="Raw payload capture" enabled={flags.rawPayloadCapture} icon={<Database size={17} />} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Readiness</CardTitle>
            <StatusBadge status={data.readiness.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
          <div>
            <p className="text-xs text-muted-foreground">Campaigns</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {data.readiness.configuredCampaignCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tier-map entries</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {data.readiness.configuredTierMapEntries}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Missing env keys</p>
            {data.readiness.missing.length ? (
              <div className="flex flex-wrap gap-2">
                {data.readiness.missing.map((item) => (
                  <Badge key={item} variant="outline" className={toneClasses('warning')}>
                    {item}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None</p>
            )}
            {data.readiness.degraded.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">Degraded reasons</p>
                <ul className="mt-1 space-y-1 text-sm text-foreground">
                  {data.readiness.degraded.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HealthCard
          title="Creator token"
          group={data.creatorToken}
          icon={<KeyRound size={17} />}
          details={[
            ['Configured', data.creatorToken.configured],
            ['Degraded', data.creatorToken.degraded],
            ['Expires', data.creatorToken.details.expires_at],
          ]}
        />
        <HealthCard
          title="Webhooks"
          group={data.webhooks}
          icon={<Radio size={17} />}
          details={[
            ['Enabled', data.webhooks.enabled],
            ['Failures', data.webhooks.details.signature_failure_count],
            ['Retrying', data.webhooks.details.retrying_deliveries],
          ]}
        />
        <HealthCard
          title="S2S"
          group={data.s2s}
          icon={<Server size={17} />}
          details={[
            ['Enabled', data.s2s.enabled],
            ['Ready', data.s2s.ready],
            ['Rate events', data.s2s.details.rate_event_count],
          ]}
        />
        <HealthCard
          title="Sync worker"
          group={data.worker}
          icon={<Activity size={17} />}
          details={[
            ['Sync enabled', data.worker.details.sync_enabled],
            ['Heartbeats', data.worker.details.heartbeat_count],
            ['Latest mode', data.worker.details.latest_mode],
          ]}
        />
        <HealthCard
          title="Sync queue"
          group={data.syncQueue}
          icon={<RefreshCw size={17} />}
          details={[
            ['Pending', data.syncQueue.details.pending_jobs],
            ['Retry', data.syncQueue.details.retry_jobs],
            ['Failed', data.syncQueue.details.failed_jobs],
          ]}
        />
        <HealthCard
          title="Snapshots"
          group={data.snapshots}
          icon={<Database size={17} />}
          details={[
            ['Current', data.snapshots.details.current_snapshot_count],
            ['Stale', data.snapshots.details.stale_snapshot_count],
            ['Oldest age', formatSeconds(data.snapshots.details.oldest_snapshot_age_seconds)],
          ]}
        />
        <HealthCard
          title="Proof delivery"
          group={data.proofDelivery}
          icon={<MailCheck size={17} />}
          details={[
            ['In flight', data.proofDelivery.details.in_flight],
            ['Delivered 24h', data.proofDelivery.details.delivered_24h],
            ['Failed 24h', data.proofDelivery.details.failed_24h],
          ]}
        />
        <HealthCard
          title="Tier map"
          group={data.tierMap}
          icon={<ShieldCheck size={17} />}
          details={[
            ['Misses 24h', data.tierMap.details.misses_24h],
            ['Status', data.tierMap.status],
          ]}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Stale snapshots"
          value={formatPatreonMetric(metrics.patreon_stale_snapshot_count)}
          icon={<Database size={14} />}
        />
        <MetricCard
          label="Tier-map misses"
          value={formatPatreonMetric(metrics.patreon_tier_map_misses_24h)}
          icon={<ShieldCheck size={14} />}
        />
        <MetricCard
          label="Webhook failure rate"
          value={formatPatreonMetric(metrics.patreon_webhook_signature_failure_rate_per_minute)}
          icon={<Radio size={14} />}
        />
        <MetricCard
          label="Retrying deliveries"
          value={formatPatreonMetric(metrics.patreon_webhook_retrying_deliveries)}
          icon={<RefreshCw size={14} />}
        />
        <MetricCard
          label="Failed proofs"
          value={formatPatreonMetric(metrics.patreon_proof_delivery_failed_24h)}
          icon={<MailCheck size={14} />}
        />
        <MetricCard
          label="Worker heartbeat age"
          value={formatSeconds(metrics.patreon_sync_worker_heartbeat_age_seconds)}
          icon={<Clock size={14} />}
        />
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p className="text-sm text-foreground">
          Patreon is entitlement/link only. It must not issue local sessions, JWTs,
          refresh tokens, cookies, API keys, or mutate auth validation responses.
        </p>
      </div>
    </div>
  );
}

export function PatreonStatusDashboard(): React.JSX.Element {
  const { status, isLoading, error, refetch } = usePatreonStatus();

  if (isLoading && !status) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Could not load Patreon status" message={error} onRetry={() => void refetch()} />;
  }

  if (!status) {
    return <ErrorState title="No Patreon status" message="No Patreon status payload was returned." onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void refetch()} disabled={isLoading}>
          <RefreshCw size={14} className={cn('mr-1.5', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      <PatreonStatusContent data={status} />
    </div>
  );
}

export default PatreonStatusDashboard;
