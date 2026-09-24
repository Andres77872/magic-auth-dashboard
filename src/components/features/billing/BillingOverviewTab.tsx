/**
 * Billing group overview: operational readiness, capability switches and the
 * group's facts. Capabilities can always be turned off; turning one on is
 * checked by the server, and the switch is disabled while readiness reports a
 * missing prerequisite for it.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { CopyableId } from '@/components/common/CopyableId';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import type {
  BillingCapability,
  BillingGroupDetails,
} from '@/types/billing.types';
import {
  catalogSyncStatus,
  credentialStatus,
  groupStatus,
  missingFor,
  readinessLabel,
} from './billing-status';
import { useBillingGroupMutations } from './useBilling';

interface CapabilityInfo {
  id: BillingCapability;
  label: string;
  description: string;
  field:
    | 'checkout_enabled'
    | 'portal_enabled'
    | 'provisioning_enabled'
    | 'webhooks_enabled';
}

const CAPABILITIES: CapabilityInfo[] = [
  {
    id: 'checkout',
    label: 'Checkout',
    description: 'Projects can start Stripe Checkout for this catalog.',
    field: 'checkout_enabled',
  },
  {
    id: 'portal',
    label: 'Customer portal',
    description: 'Subscribers can manage billing in the Stripe portal.',
    field: 'portal_enabled',
  },
  {
    id: 'provisioning',
    label: 'Provisioning',
    description: 'Catalog changes create and reprice products in Stripe.',
    field: 'provisioning_enabled',
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    description: 'Stripe events for this account are accepted and applied.',
    field: 'webhooks_enabled',
  },
];

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

export interface BillingOverviewTabProps {
  details: BillingGroupDetails;
  onChanged: () => void;
}

export function BillingOverviewTab({
  details,
  onChanged,
}: BillingOverviewTabProps): React.JSX.Element {
  const { group, readiness, credentials } = details;
  const { showToast } = useToast();
  const { updateCapabilities, pending } = useBillingGroupMutations();
  const [busy, setBusy] = React.useState<BillingCapability | null>(null);
  const missing = readiness?.missing ?? [];
  const status = groupStatus(group.status);
  const credential = credentialStatus(credentials.credential_status);
  const sync = catalogSyncStatus(group.catalog_sync_status);

  const toggle = async (
    capability: CapabilityInfo,
    enabled: boolean
  ): Promise<void> => {
    setBusy(capability.id);
    try {
      await updateCapabilities(group.group_hash, {
        [capability.field]: enabled,
      });
      showToast(
        `${capability.label} turned ${enabled ? 'on' : 'off'}`,
        'success'
      );
      onChanged();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : `${capability.label} could not be changed.`,
        'error'
      );
      onChanged();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <Panel
          title="Readiness"
          description="Checkout, portal and webhooks need all of these"
          actions={
            <Badge variant={readiness?.ready ? 'success' : 'warning'} size="sm">
              {readiness?.ready ? 'Ready' : 'Not ready'}
            </Badge>
          }
        >
          {missing.length === 0 ? (
            <p className="m-0 flex items-center gap-2 text-[13px] text-muted-foreground">
              <CheckCircle2
                className="h-4 w-4 text-success"
                aria-hidden="true"
              />
              Everything needed to take payments is in place.
            </p>
          ) : (
            <ul className="m-0 list-none space-y-1.5 p-0">
              {missing.map((code) => (
                <li
                  key={code}
                  className="flex items-start gap-2 text-[13px] text-foreground"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  {readinessLabel(code)}
                </li>
              ))}
            </ul>
          )}
          {readiness?.webhook_endpoint_path && (
            <div className="mt-4 border-t border-border pt-3.5">
              <p className="m-0 mb-1.5 text-xs text-muted-foreground">
                Register this webhook endpoint path in the group&apos;s Stripe
                account:
              </p>
              <CopyableId
                id={readiness.webhook_endpoint_path}
                showFull
                label="Stripe webhook endpoint path"
              />
            </div>
          )}
        </Panel>

        <Panel title="Capabilities" padding="none">
          <ul className="m-0 list-none divide-y divide-border p-0">
            {CAPABILITIES.map((capability) => {
              const enabled = group[capability.field];
              const blockers = enabled
                ? []
                : missingFor(capability.id, missing);
              const switchId = `capability-${capability.id}`;
              return (
                <li
                  key={capability.id}
                  className="flex items-start justify-between gap-4 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <label
                      htmlFor={switchId}
                      className="block text-[13px] font-medium text-foreground"
                    >
                      {capability.label}
                    </label>
                    <p className="m-0 text-xs text-muted-foreground">
                      {blockers.length > 0
                        ? `Blocked: ${readinessLabel(blockers[0])}`
                        : capability.description}
                    </p>
                  </div>
                  <Switch
                    id={switchId}
                    checked={enabled}
                    disabled={
                      pending === 'capabilities' ||
                      busy !== null ||
                      blockers.length > 0
                    }
                    onCheckedChange={(checked) =>
                      void toggle(capability, checked === true)
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel title="Details">
        <dl className="m-0 divide-y divide-border">
          <Fact label="Status">
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          </Fact>
          <Fact label="Stripe account">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={credential.variant} size="sm">
                {credential.label}
              </Badge>
              {credentials.stripe_account_label && (
                <span>{credentials.stripe_account_label}</span>
              )}
            </span>
          </Fact>
          <Fact label="Catalog sync">
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant={sync.variant} size="sm">
                {sync.label}
              </Badge>
              {group.last_catalog_synced_at && (
                <time
                  dateTime={group.last_catalog_synced_at}
                  title={formatDateTime(group.last_catalog_synced_at)}
                  className="text-xs text-muted-foreground"
                >
                  {formatRelativeTime(group.last_catalog_synced_at)}
                </time>
              )}
            </span>
          </Fact>
          <Fact label="Provider">
            <span className="capitalize">{group.provider}</span>
          </Fact>
          {group.description && (
            <Fact label="Description">{group.description}</Fact>
          )}
          <Fact label="Created">{formatDateTime(group.created_at)}</Fact>
          <Fact label="Updated">{formatDateTime(group.updated_at)}</Fact>
          <Fact label="Group hash">
            <CopyableId id={group.group_hash} label="Group hash" />
          </Fact>
        </dl>
      </Panel>
    </div>
  );
}

export default BillingOverviewTab;
