/**
 * Billing at a glance (`GET /admin/billing/metrics`) with a link into the
 * billing area. Rendered on the System page. Counts only — api.auth stays
 * agnostic of what a plan means.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBillingMetrics } from '@/hooks/dashboard/useBillingMetrics';
import { useUserType } from '@/hooks/useUserType';
import { formatNumber } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { BillingMetrics } from '@/types/billing.types';

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}): React.JSX.Element {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
        {label}
      </dt>
      <dd className="m-0 mt-1 text-[22px] font-semibold leading-none tabular-nums text-foreground">
        {value}
      </dd>
      {detail && (
        <dd className="m-0 mt-1.5 text-xs text-muted-foreground">{detail}</dd>
      )}
    </div>
  );
}

function attentionItems(metrics: BillingMetrics): string[] {
  const items: string[] = [];
  if (metrics.catalog_failed > 0) {
    items.push(
      `${formatNumber(metrics.catalog_failed)} catalog item${metrics.catalog_failed === 1 ? '' : 's'} failed to provision`
    );
  }
  if (metrics.credentials_absent > 0) {
    items.push(
      `${formatNumber(metrics.credentials_absent)} group${metrics.credentials_absent === 1 ? '' : 's'} without Stripe credentials`
    );
  }
  const missingWebhook = metrics.webhook_secret_missing_active_groups ?? 0;
  if (missingWebhook > 0) {
    items.push(
      `${formatNumber(missingWebhook)} active group${missingWebhook === 1 ? '' : 's'} missing a webhook secret`
    );
  }
  return items;
}

export function BillingSummaryPanel(): React.JSX.Element | null {
  const { isAdminOrHigher } = useUserType();
  const { metrics, isLoading, error, refetch } = useBillingMetrics();

  if (!isAdminOrHigher) return null;

  const attention = metrics ? attentionItems(metrics) : [];

  return (
    <Panel
      title="Billing"
      description="Billing groups, their catalogs and Stripe accounts"
      actions={
        <Link
          to={ROUTES.BILLING}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary no-underline hover:underline"
        >
          Manage billing{' '}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
    >
      {isLoading ? (
        <div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-hidden="true"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : error && !metrics ? (
        <div className="flex flex-col items-start gap-2">
          <p className="m-0 text-[13px] text-muted-foreground">
            Billing metrics could not be loaded. {error}
          </p>
          <Button variant="secondary" size="sm" onClick={refetch}>
            Try again
          </Button>
        </div>
      ) : metrics ? (
        <>
          <dl className="m-0 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric
              label="Groups"
              value={formatNumber(metrics.groups_total)}
              detail={`${formatNumber(metrics.groups_active)} active`}
            />
            <Metric
              label="Projects billed"
              value={formatNumber(metrics.projects_mapped)}
            />
            <Metric
              label="Plans"
              value={formatNumber(metrics.subscription_plans)}
              detail={`${formatNumber(metrics.credit_packages)} credit packages`}
            />
            <Metric
              label="Live in Stripe"
              value={formatNumber(metrics.catalog_active)}
              detail={
                metrics.catalog_pending > 0
                  ? `${formatNumber(metrics.catalog_pending)} pending`
                  : undefined
              }
            />
          </dl>
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
                    key={item}
                    className="flex items-start gap-2 text-[13px] text-foreground"
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </Panel>
  );
}

export default BillingSummaryPanel;
