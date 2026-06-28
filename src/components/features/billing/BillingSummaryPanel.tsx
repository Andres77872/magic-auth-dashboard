/**
 * Billing & Plans summary — aggregate metrics + quick access to the billing area.
 *
 * Self-gates to admin+ users (the metrics endpoint is admin-gated). Rendered on the
 * dashboard Overview and the System page. Counts come from `/admin/billing/metrics`;
 * api.auth stays agnostic, so these are plan/package tallies, not product semantics.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Repeat, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatsGrid, ErrorState, type StatCardProps } from '@/components/common';
import { useUserType, useBillingMetrics } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { BillingMetrics } from '@/types/billing.types';

const ZERO: BillingMetrics = {
  groups_total: 0,
  groups_active: 0,
  groups_suspended: 0,
  groups_archived: 0,
  credentials_active: 0,
  credentials_absent: 0,
  credentials_rotating: 0,
  credentials_revoked: 0,
  subscription_plans: 0,
  credit_packages: 0,
  catalog_active: 0,
  catalog_pending: 0,
  catalog_failed: 0,
  catalog_archived: 0,
  projects_mapped: 0,
};

export function BillingSummaryPanel(): React.JSX.Element | null {
  const { isAdminOrHigher } = useUserType();
  const navigate = useNavigate();
  const { metrics, isLoading, error, refetch } = useBillingMetrics();

  if (!isAdminOrHigher) return null;

  const m = metrics ?? ZERO;
  const goBilling = (): void => {
    void navigate(ROUTES.BILLING);
  };

  const stats: StatCardProps[] = [
    {
      title: 'Billing groups',
      value: m.groups_total,
      icon: <CreditCard className="h-4 w-4" aria-hidden="true" />,
      variant: 'primary',
      subValue: `${m.groups_active} active · ${m.projects_mapped} projects`,
      onClick: goBilling,
    },
    {
      title: 'Subscription plans',
      value: m.subscription_plans,
      icon: <Repeat className="h-4 w-4" aria-hidden="true" />,
      variant: 'info',
      subValue: `${m.catalog_active} live in Stripe`,
    },
    {
      title: 'Credit packages',
      value: m.credit_packages,
      icon: <Package className="h-4 w-4" aria-hidden="true" />,
      variant: 'info',
    },
    {
      title: 'Provisioning failures',
      value: m.catalog_failed,
      icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />,
      variant: m.catalog_failed > 0 ? 'warning' : 'default',
      subValue: m.catalog_pending > 0 ? `${m.catalog_pending} pending` : undefined,
    },
  ];

  return (
    <Card className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <CardTitle>Billing &amp; Plans</CardTitle>
              <CardDescription>Groups, catalog plans &amp; Stripe account health</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {m.credentials_absent > 0 && (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {m.credentials_absent} need credentials
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={goBilling}>
              Manage billing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState title="Couldn’t load billing metrics" message={error} onRetry={refetch} />
        ) : (
          <StatsGrid stats={stats} columns={4} loading={isLoading} />
        )}
      </CardContent>
    </Card>
  );
}

export default BillingSummaryPanel;
