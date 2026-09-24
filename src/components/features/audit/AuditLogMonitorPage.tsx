/**
 * Audit log (`/audit`). Everyone with access sees the activity log; root also
 * gets the per-request API log, security events and traffic statistics
 * (platform-wide views). Sections live in `?tab=`; with a single section no
 * tab bar is shown.
 */

import React from 'react';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { TabNavigation, type Tab } from '@/components/common/TabNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useTabParam } from '@/hooks/useTabParam';
import { ActivityLogTab } from './ActivityLogTab';
import { ApiRequestsTab } from './ApiRequestsTab';
import { SecurityEventsTab } from './SecurityEventsTab';
import { AuditStatisticsTab } from './AuditStatisticsTab';

export type AuditTab = 'activity' | 'requests' | 'security' | 'statistics';

const TABS: (Tab & { id: AuditTab; rootOnly: boolean; subtitle: string })[] = [
  {
    id: 'activity',
    label: 'Activity',
    rootOnly: false,
    subtitle: 'Sign-ins and management changes across the platform',
  },
  {
    id: 'requests',
    label: 'API requests',
    rootOnly: true,
    subtitle: 'Every API call recorded by the audit middleware',
  },
  {
    id: 'security',
    label: 'Security events',
    rootOnly: true,
    subtitle: 'Denied requests, failed sign-ins and other security signals',
  },
  {
    id: 'statistics',
    label: 'Statistics',
    rootOnly: true,
    subtitle: 'API traffic volume, success rate and latency',
  },
];

const ROOT_TABS: readonly AuditTab[] = TABS.map((tab) => tab.id);
const ADMIN_TABS: readonly AuditTab[] = TABS.filter((tab) => !tab.rootOnly).map(
  (tab) => tab.id
);

export interface AuditLogMonitorPageProps {
  className?: string;
}

export function AuditLogMonitorPage({
  className,
}: AuditLogMonitorPageProps): React.JSX.Element {
  const { user } = useAuth();
  const isRoot = user?.user_type === 'root';
  const available = isRoot ? ROOT_TABS : ADMIN_TABS;
  const [activeTab, setActiveTab] = useTabParam<AuditTab>(
    available,
    'activity'
  );
  const visibleTabs = TABS.filter((tab) => available.includes(tab.id));
  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0];

  return (
    <PageContainer className={className}>
      <PageHeader title="Audit log" subtitle={current.subtitle} />

      {visibleTabs.length > 1 && (
        <TabNavigation
          tabs={visibleTabs.map(({ id, label }) => ({ id, label }))}
          activeTab={activeTab}
          onChange={setActiveTab}
          ariaLabel="Audit log sections"
          className="mb-6"
        />
      )}

      <div
        role={visibleTabs.length > 1 ? 'tabpanel' : undefined}
        aria-label={current.label}
      >
        {activeTab === 'activity' && <ActivityLogTab />}
        {activeTab === 'requests' && <ApiRequestsTab />}
        {activeTab === 'security' && <SecurityEventsTab />}
        {activeTab === 'statistics' && <AuditStatisticsTab />}
      </div>
    </PageContainer>
  );
}

export default AuditLogMonitorPage;
