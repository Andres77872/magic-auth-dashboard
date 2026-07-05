/**
 * System landing page (ROOT only).
 *
 * Acts as a launcher for the root-level tools that exist today. Each tile links
 * to a real, working page — no placeholders — and is built from design-system
 * primitives rather than hand-rolled markup.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Mail, HeartHandshake, Settings, ShieldCheck } from 'lucide-react';
import {
  Card,
  IconContainer,
  PageContainer,
  PageHeader,
  type IconContainerVariant,
} from '@/components/common';
import { BillingSummaryPanel } from '@/components/features/billing';
import { ROUTES } from '@/utils/routes';

interface SystemTile {
  to: string;
  icon: React.ReactNode;
  iconVariant: IconContainerVariant;
  title: string;
  description: string;
}

const SYSTEM_TILES: SystemTile[] = [
  {
    to: ROUTES.BILLING,
    icon: <CreditCard className="h-5 w-5" />,
    iconVariant: 'primary',
    title: 'Billing & plans',
    description:
      'Manage billing groups, the catalog of plans & packages, and per-account Stripe credentials.',
  },
  {
    to: ROUTES.EMAIL_TEMPLATES,
    icon: <Mail className="h-5 w-5" />,
    iconVariant: 'info',
    title: 'Email templates',
    description: 'Edit and preview the transactional emails the platform sends.',
  },
  {
    to: ROUTES.PATREON,
    icon: <HeartHandshake className="h-5 w-5" />,
    iconVariant: 'warning',
    title: 'Patreon',
    description: 'Review entitlements, tier mappings, sync jobs, and webhooks.',
  },
];

export function SystemPage(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="System"
          subtitle="Root-level system configuration and administration"
          icon={<Settings size={24} />}
        />

        <Card padding="lg" className="border-success/30 bg-success/5">
          <div className="flex items-center gap-3">
            <IconContainer
              variant="success"
              size="md"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <div>
              <h3 className="font-semibold text-foreground">Root access verified</h3>
              <p className="text-sm text-muted-foreground">
                You have full system administrator privileges.
              </p>
            </div>
          </div>
        </Card>

        <BillingSummaryPanel />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SYSTEM_TILES.map((tile) => (
            <Link key={tile.title} to={tile.to} className="no-underline">
              <Card
                padding="lg"
                className="h-full space-y-3 transition-colors hover:border-input"
              >
                <IconContainer variant={tile.iconVariant} size="lg" icon={tile.icon} />
                <h3 className="font-semibold text-foreground">{tile.title}</h3>
                <p className="text-sm text-muted-foreground">{tile.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

export default SystemPage;
