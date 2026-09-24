import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { rollupStatus, statusTone, type StatusTone } from '@/lib/status-tone';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/utils/routes';
import type { SystemHealthData } from '@/types/dashboard.types';
import type { BillingMetrics } from '@/types/billing.types';

interface ServiceHealthPanelProps {
  health: SystemHealthData | null;
  healthError: string | null;
  isLoading: boolean;
  billing: BillingMetrics | null;
  canViewDetails: boolean;
  onRetry: () => void;
}

/** Components shown in the compact list, in display order. */
const COMPONENTS: { key: string; label: string }[] = [
  { key: 'database', label: 'Database' },
  { key: 'redis', label: 'Redis cache' },
  { key: 'group_system', label: 'Access graph' },
  { key: 'email_provider', label: 'Email provider' },
  { key: 'email_outbox', label: 'Email outbox' },
  { key: 'email_worker', label: 'Email worker' },
  { key: 'billing', label: 'Billing' },
  { key: 'patreon', label: 'Patreon' },
];

const DOT: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  muted: 'bg-muted-foreground/50',
};

function statusText(status: string | undefined): string {
  if (!status) return 'Unknown';
  const text = status.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface AttentionItem {
  id: string;
  text: string;
  href?: string;
}

function collectAttention(
  health: SystemHealthData | null,
  billing: BillingMetrics | null
): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (health) {
    for (const { key, label } of COMPONENTS) {
      const status = health.components[key]?.status;
      const tone = statusTone(status);
      if (tone === 'warning' || tone === 'destructive') {
        items.push({
          id: `health-${key}`,
          text: `${label} is ${statusText(status).toLowerCase()}`,
        });
      }
    }
    const outbox = health.components.email_outbox;
    const dlq = typeof outbox?.dlq_depth === 'number' ? outbox.dlq_depth : 0;
    if (dlq > 0) {
      items.push({
        id: 'email-dlq',
        text: `${dlq} email${dlq === 1 ? '' : 's'} in the dead-letter queue`,
      });
    }
  }
  if (billing) {
    if (billing.catalog_failed > 0) {
      items.push({
        id: 'billing-catalog',
        text: `${billing.catalog_failed} catalog item${billing.catalog_failed === 1 ? '' : 's'} failed to provision in Stripe`,
        href: ROUTES.BILLING,
      });
    }
    const missingSecrets = billing.webhook_secret_missing_active_groups ?? 0;
    if (missingSecrets > 0) {
      items.push({
        id: 'billing-webhooks',
        text: `${missingSecrets} active billing group${missingSecrets === 1 ? '' : 's'} missing a webhook secret`,
        href: ROUTES.BILLING,
      });
    }
  }
  return items;
}

/** Service status at a glance plus anything that needs an operator's attention. */
export function ServiceHealthPanel({
  health,
  healthError,
  isLoading,
  billing,
  canViewDetails,
  onRetry,
}: ServiceHealthPanelProps): React.JSX.Element {
  const visible = health
    ? COMPONENTS.filter(({ key }) => health.components[key])
    : [];
  const overall = health
    ? rollupStatus([
        health.status,
        ...visible.map(({ key }) => health.components[key]?.status),
      ])
    : undefined;
  const attention = collectAttention(health, billing);

  return (
    <Panel
      title="Service health"
      description={
        health ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                DOT[statusTone(overall)]
              )}
              aria-hidden="true"
            />
            {statusTone(overall) === 'success'
              ? 'All systems operational'
              : `Overall: ${statusText(overall)}`}
          </span>
        ) : (
          'Live status of platform dependencies'
        )
      }
      actions={
        canViewDetails ? (
          <Link
            to={ROUTES.SYSTEM}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary no-underline hover:underline"
          >
            Details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : undefined
      }
    >
      {isLoading ? (
        <div
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-5" />
          ))}
        </div>
      ) : healthError && !health ? (
        <div className="flex flex-col items-start gap-2">
          <p className="m-0 text-[13px] text-muted-foreground">
            Health checks could not be loaded. {healthError}
          </p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-2 p-0 sm:grid-cols-2">
            {visible.map(({ key, label }) => {
              const status = health?.components[key]?.status;
              return (
                <li key={key} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      DOT[statusTone(status)]
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {statusText(status)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 border-t border-border pt-3.5">
            {attention.length === 0 ? (
              <p className="m-0 flex items-center gap-2 text-[13px] text-muted-foreground">
                <CheckCircle2
                  className="h-4 w-4 text-success"
                  aria-hidden="true"
                />
                Nothing needs your attention.
              </p>
            ) : (
              <ul className="m-0 list-none space-y-1.5 p-0">
                {attention.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 text-[13px] text-foreground"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    {item.href ? (
                      <Link
                        to={item.href}
                        className="text-foreground no-underline hover:underline"
                      >
                        {item.text}
                      </Link>
                    ) : (
                      <span>{item.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}

export default ServiceHealthPanel;
