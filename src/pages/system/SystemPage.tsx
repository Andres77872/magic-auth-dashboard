/**
 * System (root only): the detailed service-health monitor, integration
 * summaries and entry points to the other root-level tools.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CreditCard,
  HeartHandshake,
  KeyRound,
  Mail,
} from 'lucide-react';
import { PageContainer, PageHeader, Panel } from '@/components/common';
import { BillingSummaryPanel } from '@/components/features/billing';
import { OAuthProviderCatalogPanel } from '@/components/features/oauth';
import { SystemHealthPanel } from '@/pages/dashboard/components';
import { useSystemHealth } from '@/hooks';
import { ROUTES } from '@/utils/routes';

interface SystemTool {
  to: string;
  icon: typeof Mail;
  title: string;
  description: string;
}

const SYSTEM_TOOLS: SystemTool[] = [
  {
    to: ROUTES.EMAIL_TEMPLATES,
    icon: Mail,
    title: 'Email templates',
    description: 'Edit, preview and roll back transactional emails.',
  },
  {
    to: ROUTES.PATREON,
    icon: HeartHandshake,
    title: 'Patreon',
    description: 'Entitlements, tier mappings, sync jobs and webhooks.',
  },
  {
    to: ROUTES.BILLING,
    icon: CreditCard,
    title: 'Billing',
    description: 'Billing groups, catalog and Stripe credentials.',
  },
  {
    to: ROUTES.OAUTH,
    icon: KeyRound,
    title: 'OAuth',
    description: 'Provider connections and project bindings.',
  },
];

export function SystemPage(): React.JSX.Element {
  const { health, isLoading, error, refetch } = useSystemHealth({
    pollIntervalMs: 15_000,
  });

  return (
    <PageContainer>
      <PageHeader
        title="System"
        subtitle="Service health, integrations and root-level tools"
      />

      <div className="space-y-6">
        <SystemHealthPanel
          health={health}
          isLoading={isLoading}
          error={error}
          onRefresh={() => void refetch()}
        />

        <BillingSummaryPanel />

        <OAuthProviderCatalogPanel />

        <Panel title="Root tools" padding="none">
          <ul className="m-0 grid list-none grid-cols-1 divide-y divide-border p-0 md:grid-cols-2 md:divide-y-0">
            {SYSTEM_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <li
                  key={tool.title}
                  className="md:border-b md:border-border md:odd:border-r"
                >
                  <Link
                    to={tool.to}
                    className="group flex items-center gap-3 px-5 py-4 no-underline transition-colors hover:bg-accent/40"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-foreground">
                        {tool.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </PageContainer>
  );
}

export default SystemPage;
