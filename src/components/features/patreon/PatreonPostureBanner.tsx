/**
 * PatreonPostureBanner — one-line integration posture shown above every Patreon
 * tab: off, misconfigured, partially enabled, or sync worker not reporting.
 * Renders nothing when everything that is enabled is ready.
 */

import React from 'react';
import { AlertTriangle, Info, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { humanizeKey } from '@/lib/health-format';
import type { PatreonAdminStatus } from '@/types/patreon.types';

type Tone = 'info' | 'warning' | 'destructive';

const toneClasses: Record<Tone, string> = {
  info: 'border-info/30 bg-info/5 [&_svg]:text-info',
  warning: 'border-warning/30 bg-warning/5 [&_svg]:text-warning',
  destructive:
    'border-destructive/30 bg-destructive/5 [&_svg]:text-destructive',
};

function Banner({
  tone,
  icon,
  title,
  children,
}: {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        toneClasses[tone]
      )}
    >
      <span className="mt-0.5 shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium text-foreground">{title}</p>
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}

export function PatreonPostureBanner({
  status,
}: {
  status: PatreonAdminStatus | null;
}): React.JSX.Element | null {
  if (!status) return null;
  const { readiness, worker } = status;
  const flags = readiness.featureFlags;

  if (readiness.checkFailed) {
    return (
      <Banner
        tone="destructive"
        icon={<AlertTriangle />}
        title="Patreon configuration could not be read"
      >
        The server rejected its Patreon settings (often malformed tier-map
        JSON). Every Patreon feature is unavailable until the configuration is
        fixed; check the API logs.
      </Banner>
    );
  }

  if (readiness.disabled) {
    return (
      <Banner
        tone="info"
        icon={<PowerOff />}
        title="The Patreon integration is off"
      >
        No Patreon feature is enabled: nothing is linked, synced or served to
        other services. Enable features with the PATREON_*_ENABLED settings once
        the configuration is ready.
      </Banner>
    );
  }

  if (readiness.status === 'not_ready') {
    return (
      <Banner
        tone="warning"
        icon={<AlertTriangle />}
        title="Patreon configuration is incomplete"
      >
        Enabled features stay unavailable until these settings are provided:{' '}
        <span className="font-mono text-xs text-foreground">
          {readiness.missing.join(', ') || 'see Overview'}
        </span>
      </Banner>
    );
  }

  if (flags.sync && worker.status !== 'healthy') {
    return (
      <Banner
        tone="warning"
        icon={<AlertTriangle />}
        title="The Patreon sync worker is not reporting"
      >
        Sync is enabled but no recent worker heartbeat was found, so queued
        resyncs and scheduled sweeps are not running. Start{' '}
        <span className="font-mono text-xs">
          src/workers/patreon_sync_worker.py
        </span>
        .
      </Banner>
    );
  }

  const off = (
    [
      ['linking', flags.linking],
      ['webhooks', flags.webhooks],
      ['sync', flags.sync],
      ['s2s_entitlement', flags.s2sEntitlement],
    ] as const
  )
    .filter(([, enabled]) => !enabled)
    .map(([name]) => humanizeKey(name));
  if (off.length > 0) {
    return (
      <Banner tone="info" icon={<Info />} title="Some Patreon features are off">
        Turned off: {off.join(', ')}.
      </Banner>
    );
  }
  return null;
}

export default PatreonPostureBanner;
