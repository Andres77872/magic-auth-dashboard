import React, { useState } from 'react';
import { Card } from '@/components/common';
import { PermissionManagementProvider } from '@/contexts';
import { PermissionsTab } from './tabs/PermissionsTab';
import { PermissionGroupsTab } from './tabs/PermissionGroupsTab';
import { AssignmentsTab } from './tabs/AssignmentsTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import '@/styles/pages/permission-management-page.css';

type TabType = 'permissions' | 'groups' | 'assignments' | 'analytics';

export const PermissionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('permissions');

  return (
    <PermissionManagementProvider>
      <div className="permission-management-page">
        <div className="permission-management-page-header">
          <div className="permission-management-page-header-content">
            <div className="permission-management-page-header-text">
              <h1 className="permission-management-page-title">Permission Management</h1>
              <p className="permission-management-page-subtitle">
                Manage global permissions, permission groups, and assignments
              </p>
            </div>
          </div>
        </div>

        <div className="permission-management-page-content">
          <Card>
            <div className="permission-management-tabs">
              <div className="permission-management-tabs-nav">
                <button
                  className={`permission-management-tab ${activeTab === 'permissions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('permissions')}
                >
                  Permissions
                </button>
                <button
                  className={`permission-management-tab ${activeTab === 'groups' ? 'active' : ''}`}
                  onClick={() => setActiveTab('groups')}
                >
                  Permission Groups
                </button>
                <button
                  className={`permission-management-tab ${activeTab === 'assignments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('assignments')}
                >
                  Assignments
                </button>
                <button
                  className={`permission-management-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics
                </button>
              </div>

              <div className="permission-management-tabs-content">
                {activeTab === 'permissions' && <PermissionsTab />}
                {activeTab === 'groups' && <PermissionGroupsTab />}
                {activeTab === 'assignments' && <AssignmentsTab />}
                {activeTab === 'analytics' && <AnalyticsTab />}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PermissionManagementProvider>
  );
};

export default PermissionManagementPage;

