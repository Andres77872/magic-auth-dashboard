/**
 * Patreon management page (ROOT only).
 *
 * The status payload is loaded once here and shared: it drives the posture
 * banner shown on every tab, the Overview, and whether a resync can be queued.
 * The active tab lives in `?tab=`; unknown values fall back to Overview.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import {
  Button,
  PageContainer,
  PageHeader,
  TabNavigation,
  type Tab,
} from '@/components/common';
import {
  PatreonEntitlementsTab,
  PatreonPostureBanner,
  PatreonResyncModal,
  PatreonStatusDashboard,
  PatreonSyncWebhooksTab,
  PatreonTierMapTab,
} from '@/components/features/patreon';
import { usePatreonStatus } from '@/hooks';

const TABS = [
  { id: 'overview', label: 'Overview', icon: <Activity /> },
  { id: 'entitlements', label: 'Entitlements', icon: <Users /> },
  { id: 'tier-map', label: 'Tier map', icon: <ShieldCheck /> },
  { id: 'sync', label: 'Sync & webhooks', icon: <Workflow /> },
] as const satisfies readonly Tab[];

type PatreonTabId = (typeof TABS)[number]['id'];

function isPatreonTab(value: string | null): value is PatreonTabId {
  return TABS.some((tab) => tab.id === value);
}

export function PatreonPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: PatreonTabId = isPatreonTab(rawTab) ? rawTab : 'overview';

  // Normalize an unknown ?tab= value instead of rendering an empty page.
  useEffect(() => {
    if (rawTab !== null && !isPatreonTab(rawTab)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('tab');
          return next;
        },
        { replace: true }
      );
    }
  }, [rawTab, setSearchParams]);

  const handleTabChange = (tabId: string): void => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tabId === 'overview') next.delete('tab');
      else next.set('tab', tabId);
      return next;
    });
  };

  const { status, isLoading, error, refetch } = usePatreonStatus();
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [resyncOpen, setResyncOpen] = useState(false);

  const syncEnabled = status?.readiness.featureFlags.sync ?? false;
  const workerHealthy = status ? status.worker.status === 'healthy' : true;

  const refreshAll = useCallback((): void => {
    void refetch();
    setRefreshSignal((value) => value + 1);
  }, [refetch]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Patreon"
          subtitle="Patreon memberships linked to users, the entitlements they grant, and sync health."
          icon={<HeartHandshake size={24} />}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={refreshAll}
                disabled={isLoading}
              >
                <RefreshCw
                  size={14}
                  className={isLoading ? 'mr-1.5 animate-spin' : 'mr-1.5'}
                  aria-hidden="true"
                />
                Refresh
              </Button>
              <Button
                onClick={() => setResyncOpen(true)}
                disabled={!syncEnabled}
                title={
                  syncEnabled
                    ? undefined
                    : 'Patreon sync is turned off (PATREON_SYNC_ENABLED)'
                }
              >
                Resync…
              </Button>
            </div>
          }
        />

        <PatreonPostureBanner status={status} />

        <TabNavigation
          tabs={[...TABS]}
          activeTab={activeTab}
          onChange={handleTabChange}
          size="md"
        />

        <div
          role="tabpanel"
          aria-label={TABS.find((tab) => tab.id === activeTab)?.label}
        >
          {activeTab === 'overview' && (
            <PatreonStatusDashboard
              status={status}
              isLoading={isLoading}
              error={error}
              onRetry={refreshAll}
            />
          )}
          {activeTab === 'entitlements' && (
            <PatreonEntitlementsTab
              workerHealthy={workerHealthy}
              refreshSignal={refreshSignal}
            />
          )}
          {activeTab === 'tier-map' && (
            <PatreonTierMapTab refreshSignal={refreshSignal} />
          )}
          {activeTab === 'sync' && (
            <PatreonSyncWebhooksTab refreshSignal={refreshSignal} />
          )}
        </div>
      </div>

      <PatreonResyncModal
        isOpen={resyncOpen}
        onClose={() => setResyncOpen(false)}
        onSubmitted={() => {
          void refetch();
          setRefreshSignal((value) => value + 1);
        }}
        workerHealthy={workerHealthy}
      />
    </PageContainer>
  );
}

export default PatreonPage;
