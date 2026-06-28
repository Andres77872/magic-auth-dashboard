/**
 * System management landing page (ROOT only).
 *
 * Surfaces ROOT-level administration entry points. The individual tools are
 * not built yet, so each tile is marked "Coming Soon" — built from
 * design-system primitives rather than hand-rolled markup.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Layers, Settings, ShieldCheck, SlidersHorizontal, Users } from 'lucide-react';
import {
  Badge,
  Card,
  IconContainer,
  PageContainer,
  PageHeader,
  type IconContainerVariant,
} from '@/components/common';
import { BillingSummaryPanel } from '@/components/features/billing';
import { ROUTES } from '@/utils/routes';

interface SystemTile {
  icon: React.ReactNode;
  iconVariant: IconContainerVariant;
  title: string;
  description: string;
}

const SYSTEM_TILES: SystemTile[] = [
  {
    icon: <Users className="h-5 w-5" />,
    iconVariant: 'primary',
    title: 'Admin Management',
    description: 'Create and manage admin users and their project assignments.',
  },
  {
    icon: <SlidersHorizontal className="h-5 w-5" />,
    iconVariant: 'warning',
    title: 'System Settings',
    description: 'Configure system-wide settings and preferences.',
  },
  {
    icon: <Layers className="h-5 w-5" />,
    iconVariant: 'info',
    title: 'Cache Management',
    description: 'View cache statistics and clear system caches.',
  },
];

export function SystemPage(): React.JSX.Element {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="System Management"
          subtitle="ROOT-level system configuration and administration"
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
              <h3 className="font-semibold text-foreground">ROOT Access Verified</h3>
              <p className="text-sm text-muted-foreground">
                You have full system administrator privileges.
              </p>
            </div>
          </div>
        </Card>

        <BillingSummaryPanel />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link to={ROUTES.BILLING} className="no-underline">
            <Card padding="lg" className="h-full space-y-3 transition-colors hover:border-input">
              <IconContainer variant="primary" size="lg" icon={<CreditCard className="h-5 w-5" />} />
              <h3 className="font-semibold text-foreground">Billing &amp; Plans</h3>
              <p className="text-sm text-muted-foreground">
                Manage billing groups, the catalog of plans &amp; packages, and per-account Stripe credentials.
              </p>
              <Badge variant="success" size="sm">
                Available
              </Badge>
            </Card>
          </Link>
          {SYSTEM_TILES.map((tile) => (
            <Card key={tile.title} padding="lg" className="space-y-3">
              <IconContainer variant={tile.iconVariant} size="lg" icon={tile.icon} />
              <h3 className="font-semibold text-foreground">{tile.title}</h3>
              <p className="text-sm text-muted-foreground">{tile.description}</p>
              <Badge variant="secondary" size="sm">
                Coming Soon
              </Badge>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}

export default SystemPage;
