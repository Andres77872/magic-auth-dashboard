import React, { useState, useCallback } from 'react';
import { Select, Card, Table } from '@/components/common';
import { usePermissionAssignments, usePermissionManagement, useToast } from '@/hooks';
import type { TableColumn } from '@/components/common/Table';

interface UserGroupUsage {
  group_hash: string;
  group_name: string;
  group_description: string;
  assigned_at: string;
}

interface UserUsage {
  user_hash: string;
  username: string;
  email: string;
  assigned_at: string;
  notes?: string;
}

export const AnalyticsTab: React.FC = () => {
  const { showToast } = useToast();
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState<string>('');
  const [userGroupUsage, setUserGroupUsage] = useState<UserGroupUsage[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsage[]>([]);
  const [loading, setLoading] = useState(false);

  const { getPermissionGroupUserGroups, getPermissionGroupUsers } = usePermissionAssignments();
  const { permissionGroups, permissionGroupsLoading } = usePermissionManagement();

  const loadAnalytics = useCallback(async () => {
    if (!selectedPermissionGroup) {
      setUserGroupUsage([]);
      setUserUsage([]);
      return;
    }

    setLoading(true);
    try {
      // Load user groups using this permission group
      const userGroupsResponse = await getPermissionGroupUserGroups(selectedPermissionGroup);
      setUserGroupUsage(userGroupsResponse);

      // Load users with direct assignment of this permission group
      const usersResponse = await getPermissionGroupUsers(selectedPermissionGroup);
      setUserUsage(usersResponse);
    } catch (error) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPermissionGroup, getPermissionGroupUserGroups, getPermissionGroupUsers, showToast]);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const userGroupColumns: TableColumn<UserGroupUsage>[] = [
    {
      key: 'group_name',
      header: 'User Group',
      sortable: true,
      width: '30%',
    },
    {
      key: 'group_description',
      header: 'Description',
      sortable: false,
      width: '50%',
      render: (value) => value || <span className="text-muted">—</span>,
    },
    {
      key: 'assigned_at',
      header: 'Assigned',
      sortable: true,
      width: '20%',
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  const userColumns: TableColumn<UserUsage>[] = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      width: '20%',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '25%',
    },
    {
      key: 'notes',
      header: 'Notes',
      sortable: false,
      width: '35%',
      render: (value) => value || <span className="text-muted">—</span>,
    },
    {
      key: 'assigned_at',
      header: 'Assigned',
      sortable: true,
      width: '20%',
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  const permissionGroupOptions = permissionGroups.map(pg => ({
    value: pg.group_hash,
    label: pg.group_display_name
  }));

  const selectedPermissionGroupData = permissionGroups.find(
    pg => pg.group_hash === selectedPermissionGroup
  );

  return (
    <div className="analytics-tab">
      <div className="tab-header">
        <div className="tab-header-text">
          <h2>Permission Analytics</h2>
          <p>View usage statistics for permission groups across user groups and individual users</p>
        </div>
      </div>

      <div className="analytics-selector">
        <div className="form-group">
          <label>Select Permission Group:</label>
          <Select
            value={selectedPermissionGroup}
            onChange={setSelectedPermissionGroup}
            options={permissionGroupOptions}
            placeholder="Select a permission group to view analytics..."
            disabled={permissionGroupsLoading}
          />
        </div>
      </div>

      {selectedPermissionGroup && selectedPermissionGroupData && (
        <div className="analytics-content">
          <Card>
            <div className="analytics-summary">
              <h3>{selectedPermissionGroupData.group_display_name}</h3>
              <p className="analytics-description">
                {selectedPermissionGroupData.group_description || 'No description available'}
              </p>
              
              <div className="analytics-stats">
                <div className="stat-card">
                  <div className="stat-value">{userGroupUsage.length}</div>
                  <div className="stat-label">User Groups</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{userUsage.length}</div>
                  <div className="stat-label">Direct User Assignments</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{userGroupUsage.length + userUsage.length}</div>
                  <div className="stat-label">Total Assignments</div>
                </div>
              </div>
            </div>
          </Card>

          <div className="analytics-section">
            <h3>User Groups Using This Permission Group</h3>
            <p className="section-description">
              These user groups have been assigned this permission group. All members inherit these permissions.
            </p>
            <Table
              columns={userGroupColumns}
              data={userGroupUsage}
              isLoading={loading}
              emptyMessage="No user groups are using this permission group"
            />
          </div>

          <div className="analytics-section">
            <h3>Users with Direct Assignment</h3>
            <p className="section-description">
              These users have been directly assigned this permission group (individual overrides).
            </p>
            <Table
              columns={userColumns}
              data={userUsage}
              isLoading={loading}
              emptyMessage="No users have direct assignments of this permission group"
            />
          </div>
        </div>
      )}

      {!selectedPermissionGroup && (
        <div className="empty-state">
          <h3>Select a Permission Group</h3>
          <p>Choose a permission group to view its usage analytics across user groups and individual users.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;

