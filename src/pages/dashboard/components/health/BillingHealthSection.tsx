/**
 * BillingHealthSection — curated health view for the `billing` subsystem tree,
 * surfacing Stripe readiness gaps (missing config / critical mismatches) loudly.
 */

import React from 'react';
import {
  AlertTriangle,
  CreditCard,
  Radio,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { HealthComponent } from '@/types/system.types';
import { statusTone } from '@/lib/status-tone';
import { asRecord, asString } from '@/lib/health-format';
import { SubsystemPanel } from './SubsystemPanel';
import { MetricTile } from './MetricTile';
import { FeatureFlagChips } from './FeatureFlagChips';
import { ChipList } from './ChipList';

export function BillingHealthSection({
  data,
}: {
  data?: HealthComponent;
}): React.JSX.Element | null {
  if (!data) return null;

  const readiness = asRecord(data.readiness);
  const stripe = asRecord(data.provider_stripe);
  const webhooks = asRecord(data.webhooks);
  const sync = asRecord(data.sync);

  const stripeMissing = stripe?.missing;
  const stripeCritical = stripe?.critical_mismatches;
  const degraded = readiness?.degraded;

  const hasStripeIssues =
    (Array.isArray(stripeMissing) && stripeMissing.length > 0) ||
    (Array.isArray(stripeCritical) && stripeCritical.length > 0);

  return (
    <SubsystemPanel
      title="Billing / Stripe"
      icon={<CreditCard className="h-4 w-4 text-primary" />}
      status={asString(data.status)}
      lastCheck={asString(data.last_check) ?? asString(readiness?.last_check)}
      raw={data}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile
          label="Readiness"
          value={asString(readiness?.status) ?? '—'}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
          tone={statusTone(asString(readiness?.status))}
        />
        <MetricTile
          label="Stripe provider"
          value={asString(stripe?.status) ?? '—'}
          icon={<CreditCard className="h-3.5 w-3.5" />}
          tone={statusTone(asString(stripe?.status))}
          hint={asString(stripe?.api_version)}
        />
        <MetricTile
          label="Webhooks"
          value={asString(webhooks?.status) ?? '—'}
          icon={<Radio className="h-3.5 w-3.5" />}
          tone={statusTone(asString(webhooks?.status))}
        />
        <MetricTile
          label="Sync"
          value={asString(sync?.status) ?? '—'}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          tone={statusTone(asString(sync?.status))}
        />
      </div>

      {hasStripeIssues && (
        <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            Stripe configuration needs attention
          </div>
          {Array.isArray(stripeMissing) && stripeMissing.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Missing env keys</span>
              <ChipList items={stripeMissing} tone="warning" />
            </div>
          )}
          {Array.isArray(stripeCritical) && stripeCritical.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Critical mismatches</span>
              <ChipList items={stripeCritical} tone="destructive" />
            </div>
          )}
        </div>
      )}

      {stripe?.capabilities ? (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Stripe capabilities</span>
          <FeatureFlagChips flags={asRecord(stripe.capabilities)} />
        </div>
      ) : null}

      {readiness?.feature_flags ? (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Feature flags</span>
          <FeatureFlagChips flags={asRecord(readiness.feature_flags)} />
        </div>
      ) : null}

      {Array.isArray(degraded) && degraded.length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Degraded reasons</span>
          <ChipList items={degraded} tone="warning" />
        </div>
      )}
    </SubsystemPanel>
  );
}

export default BillingHealthSection;
