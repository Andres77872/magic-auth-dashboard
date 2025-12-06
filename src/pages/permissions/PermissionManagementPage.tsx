import React, { useState } from 'react';
import { 
  PageContainer,
  PageHeader,
  TabNavigation
} from '@/components/common';
import { SecurityIcon } from '@/components/icons';
import { PermissionManagementProvider } from '@/contexts';
import { PermissionsTab } from './tabs/PermissionsTab';
import { PermissionGroupsTab } from './tabs/PermissionGroupsTab';
import { AssignmentsTab } from './tabs/AssignmentsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { Tab } from '@/components/common';

type TabType = 'permissions' | 'groups' | 'assignments' | 'analytics';

export const PermissionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('permissions');

  const tabs: Tab[] = [
    {
      id: 'permissions',
      label: 'Permissions',
      icon: <SecurityIcon size={16} />,
    },
    {
      id: 'groups',
      label: 'Permission Groups',
    },
    {
      id: 'assignments',
      label: 'Assignments',
    },
    {
      id: 'analytics',
      label: 'Analytics',
    },
  ];

  return (
    <PermissionManagementProvider>
      <PageContainer>
        <PageHeader
          title="Permission Management"
          subtitle="Manage global permissions, permission groups, and assignments"
          icon={<SecurityIcon size={28} />}
        />

        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as TabType)}
          contained
        >
          {activeTab === 'permissions' && <PermissionsTab />}
          {activeTab === 'groups' && <PermissionGroupsTab />}
          {activeTab === 'assignments' && <AssignmentsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </TabNavigation>
      </PageContainer>
    </PermissionManagementProvider>
  );
};

export default PermissionManagementPage;

