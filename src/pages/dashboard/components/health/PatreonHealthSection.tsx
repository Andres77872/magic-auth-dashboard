/**
 * PatreonHealthSection — curated health view for the `patreon` subsystem tree.
 */

import React from 'react';
import {
  Activity,
  Database,
  HeartHandshake,
  MailCheck,
  Radio,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { HealthComponent } from '@/types/system.types';
import { statusTone } from '@/lib/status-tone';
import { asNumber, asRecord, asString, formatDuration } from '@/lib/health-format';
import { SubsystemPanel } from './SubsystemPanel';
import { MetricTile } from './MetricTile';
import { FeatureFlagChips } from './FeatureFlagChips';
import { ChipList } from './ChipList';

function countTone(value?: number): 'success' | 'warning' {
  return value && value > 0 ? 'warning' : 'success';
}

export function PatreonHealthSection({
  data,
}: {
  data?: HealthComponent;
}): React.JSX.Element | null {
  if (!data) return null;

  const readiness = asRecord(data.readiness);
  const webhooks = asRecord(data.webhooks);
  const snapshots = asRecord(data.snapshots);
  const proofDelivery = asRecord(data.proof_delivery);
  const worker = asRecord(data.worker);
  const syncQueue = asRecord(data.sync_queue);

  const signatureFailures = asNumber(webhooks?.signature_failure_count);
  const staleSnapshots = asNumber(snapshots?.stale_snapshot_count);
  const proofFailed = asNumber(proofDelivery?.failed_24h);
  const heartbeatAge = asNumber(worker?.latest_heartbeat_age_seconds);

  const missing = readiness?.missing;
  const degraded = readiness?.degraded;

  return (
    <SubsystemPanel
      title="Patreon Integration"
      icon={<HeartHandshake className="h-4 w-4 text-primary" />}
      status={asString(data.status)}
      lastCheck={asString(data.last_check) ?? asString(readiness?.last_check)}
      raw={data}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile
          label="Readiness"
          value={asString(readiness?.status) ?? '—'}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          tone={statusTone(asString(readiness?.status))}
        />
        <MetricTile
          label="Webhook failures"
          value={signatureFailures ?? '—'}
          icon={<Radio className="h-3.5 w-3.5" />}
          tone={countTone(signatureFailures)}
        />
        <MetricTile
          label="Sync queue"
          value={asString(syncQueue?.status) ?? '—'}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          tone={statusTone(asString(syncQueue?.status))}
          hint={
            asNumber(syncQueue?.retry_jobs)
              ? `${asNumber(syncQueue?.retry_jobs)} retrying`
              : undefined
          }
        />
        <MetricTile
          label="Worker heartbeat"
          value={heartbeatAge === undefined ? '—' : formatDuration(heartbeatAge)}
          icon={<Activity className="h-3.5 w-3.5" />}
          tone={statusTone(asString(worker?.status))}
          hint={asString(worker?.latest_mode)}
        />
        <MetricTile
          label="Stale snapshots"
          value={staleSnapshots ?? '—'}
          icon={<Database className="h-3.5 w-3.5" />}
          tone={countTone(staleSnapshots)}
        />
        <MetricTile
          label="Failed proofs 24h"
          value={proofFailed ?? '—'}
          icon={<MailCheck className="h-3.5 w-3.5" />}
          tone={countTone(proofFailed)}
        />
      </div>

      {readiness?.feature_flags ? (
        <FeatureFlagChips flags={asRecord(readiness.feature_flags)} />
      ) : null}

      {Array.isArray(missing) && missing.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Missing config</span>
          <ChipList items={missing} tone="warning" />
        </div>
      )}

      {Array.isArray(degraded) && degraded.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Degraded reasons</span>
          <ChipList items={degraded} tone="warning" />
        </div>
      )}
    </SubsystemPanel>
  );
}

export default PatreonHealthSection;
