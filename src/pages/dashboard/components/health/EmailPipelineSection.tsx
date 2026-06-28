/**
 * EmailPipelineSection — curated health view for the email subsystem
 * (`email_provider`, `email_outbox`, `email_worker`).
 */

import React from 'react';
import { AlertTriangle, Gauge, Inbox, Mail, Send } from 'lucide-react';
import type { HealthComponent } from '@/types/system.types';
import { rollupStatus, statusTone } from '@/lib/status-tone';
import {
  asNumber,
  asString,
  formatHealthValue,
} from '@/lib/health-format';
import { SubsystemPanel } from './SubsystemPanel';
import { MetricTile } from './MetricTile';

interface EmailPipelineSectionProps {
  components: Record<string, HealthComponent>;
}

export function EmailPipelineSection({
  components,
}: EmailPipelineSectionProps): React.JSX.Element | null {
  const provider = components.email_provider;
  const outbox = components.email_outbox;
  const worker = components.email_worker;

  if (!provider && !outbox && !worker) return null;

  const dlqDepth = asNumber(outbox?.dlq_depth);
  const queueDepth = asNumber(outbox?.queue_depth);
  const successRatio = asNumber(outbox?.success_ratio);

  const rolled = rollupStatus([provider?.status, outbox?.status, worker?.status]);

  const successTone =
    successRatio === undefined
      ? 'muted'
      : successRatio >= 0.9
        ? 'success'
        : successRatio >= 0.5
          ? 'warning'
          : 'destructive';

  return (
    <SubsystemPanel
      title="Email Pipeline"
      icon={<Mail className="h-4 w-4 text-info" />}
      status={rolled}
      lastCheck={asString(outbox?.last_check) ?? asString(worker?.last_check)}
      raw={{
        ...(provider ? { email_provider: provider } : {}),
        ...(outbox ? { email_outbox: outbox } : {}),
        ...(worker ? { email_worker: worker } : {}),
      }}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {provider && (
          <MetricTile
            label="Provider"
            value={asString(provider.provider) ?? '—'}
            icon={<Mail className="h-3.5 w-3.5" />}
            tone={statusTone(provider.status)}
            hint={asString(provider.status)}
          />
        )}
        {outbox && (
          <MetricTile
            label="DLQ depth"
            value={dlqDepth ?? '—'}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            tone={dlqDepth && dlqDepth > 0 ? 'warning' : 'success'}
          />
        )}
        {outbox && (
          <MetricTile
            label="Success ratio"
            value={
              successRatio === undefined
                ? '—'
                : formatHealthValue('success_ratio', successRatio)
            }
            icon={<Gauge className="h-3.5 w-3.5" />}
            tone={successTone}
          />
        )}
        {outbox && (
          <MetricTile
            label="Queue depth"
            value={queueDepth ?? '—'}
            icon={<Inbox className="h-3.5 w-3.5" />}
            tone={queueDepth && queueDepth > 0 ? 'warning' : 'muted'}
          />
        )}
        {worker && (
          <MetricTile
            label="Worker heartbeat"
            value={formatHealthValue('latest_heartbeat', worker.latest_heartbeat)}
            icon={<Send className="h-3.5 w-3.5" />}
            tone={statusTone(worker.status)}
            hint={asString(worker.status)}
          />
        )}
      </div>
    </SubsystemPanel>
  );
}

export default EmailPipelineSection;
