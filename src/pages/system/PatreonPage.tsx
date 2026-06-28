/**
 * Patreon management page (ROOT only).
 *
 * Tabbed surface: read-only operational Overview plus management views for
 * entitlements, the tier map, and the sync queue / webhook deliveries.
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, HeartHandshake, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { PageContainer, PageHeader, TabNavigation, type Tab } from '@/components/common';
import {
  PatreonEntitlementsTab,
  PatreonStatusDashboard,
  PatreonSyncWebhooksTab,
  PatreonTierMapTab,
} from '@/components/features/patreon';

type PatreonTabId = 'overview' | 'entitlements' | 'tier-map' | 'sync';

const TABS: Tab[] = [
  { id: 'overview', label: 'Overview', icon: <Activity /> },
  { id: 'entitlements', label: 'Entitlements', icon: <Users /> },
  { id: 'tier-map', label: 'Tier Map', icon: <ShieldCheck /> },
  { id: 'sync', label: 'Sync & Webhooks', icon: <RefreshCw /> },
];

export function PatreonPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as PatreonTabId) || 'overview';

  const handleTabChange = (tabId: string): void => {
    setSearchParams({ tab: tabId });
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Patreon"
          subtitle="Entitlement/link integration management and operational health"
          icon={<HeartHandshake size={24} />}
        />

        <TabNavigation tabs={TABS} activeTab={activeTab} onChange={handleTabChange} size="md" />

        {activeTab === 'overview' && <PatreonStatusDashboard />}
        {activeTab === 'entitlements' && <PatreonEntitlementsTab />}
        {activeTab === 'tier-map' && <PatreonTierMapTab />}
        {activeTab === 'sync' && <PatreonSyncWebhooksTab />}
      </div>
    </PageContainer>
  );
}

export default PatreonPage;
