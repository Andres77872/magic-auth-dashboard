import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { BarChart3, Layers, User, Users } from 'lucide-react';
import { Select, Card, CardContent, CardHeader, CardTitle, DataView, EmptyState, StatsGrid } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { usePermissionAssignments, usePermissionManagement, useToast } from '@/hooks';

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

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    if (
      selectedPermissionGroup &&
      !permissionGroupsLoading &&
      !permissionGroups.some((group) => group.group_hash === selectedPermissionGroup)
    ) {
      setSelectedPermissionGroup('');
    }
  }, [permissionGroups, permissionGroupsLoading, selectedPermissionGroup]);

  const formatDate = useCallback((value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }, []);

  const userGroupColumns: DataViewColumn<UserGroupUsage>[] = [
    {
      key: 'group_name',
      header: 'User Group',
      sortable: true,
      width: '30%',
      render: (value) => <span className="font-medium">{value as string}</span>,
    },
    {
      key: 'group_description',
      header: 'Description',
      sortable: false,
      width: '50%',
      hideOnMobile: true,
      render: (value) =>
        value ? (
          <span className="text-muted-foreground line-clamp-2">{value as string}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'assigned_at',
      header: 'Assigned',
      sortable: true,
      width: '20%',
      render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value as string)}</span>,
    },
  ];

  const userColumns: DataViewColumn<UserUsage>[] = [
    {
      key: 'username',
      header: 'User',
      sortable: true,
      width: '35%',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{value as string}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      sortable: false,
      width: '35%',
      hideOnMobile: true,
      render: (value) =>
        value ? (
          <span className="text-muted-foreground line-clamp-2">{value as string}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'assigned_at',
      header: 'Assigned',
      sortable: true,
      width: '30%',
      render: (value) => <span className="text-sm text-muted-foreground">{formatDate(value as string)}</span>,
    },
  ];

  const permissionGroupOptions = useMemo(
    () =>
      permissionGroups.map((pg) => ({
        value: pg.group_hash,
        label: pg.group_display_name || pg.group_name,
      })),
    [permissionGroups]
  );

  const selectedPermissionGroupData = useMemo(
    () => permissionGroups.find((pg) => pg.group_hash === selectedPermissionGroup),
    [permissionGroups, selectedPermissionGroup]
  );

  const hasPermissionGroups = permissionGroups.length > 0;
  const showAnalytics = Boolean(selectedPermissionGroup && selectedPermissionGroupData);
  const totalAssignments = userGroupUsage.length + userUsage.length;
  const stats = useMemo(
    () => [
      {
        title: 'User Groups',
        value: userGroupUsage.length,
        icon: <Users size={20} />,
      },
      {
        title: 'Direct Users',
        value: userUsage.length,
        icon: <User size={20} />,
      },
      {
        title: 'Total Assignments',
        value: totalAssignments,
        icon: <BarChart3 size={20} />,
      },
    ],
    [totalAssignments, userGroupUsage.length, userUsage.length]
  );

  const selectPlaceholder = permissionGroupsLoading
    ? 'Loading permission groups...'
    : hasPermissionGroups
      ? 'Select a permission group to view analytics...'
      : 'No permission groups available';

  const selectHelperText = permissionGroupsLoading
    ? 'Fetching permission groups.'
    : hasPermissionGroups
      ? 'Choose a permission group to view usage across user groups and direct users.'
      : 'Create a permission group to start tracking usage analytics.';

  const emptyStateContent = hasPermissionGroups
    ? {
        icon: <BarChart3 size={32} />,
        title: 'Select a permission group',
        description: 'Choose a permission group to view its usage across user groups and direct users.',
      }
    : {
        icon: <Layers size={32} />,
        title: 'No permission groups available',
        description: 'Create a permission group to start tracking usage analytics.',
      };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Permission Analytics</h2>
        <p className="text-sm text-muted-foreground">
          View usage statistics for permission groups across user groups and individual users.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Permission Group</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a permission group to see where it is applied.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Select
            label="Select permission group"
            value={selectedPermissionGroup}
            onChange={setSelectedPermissionGroup}
            options={permissionGroupOptions}
            placeholder={selectPlaceholder}
            helperText={selectHelperText}
            disabled={permissionGroupsLoading || !hasPermissionGroups}
            fullWidth
            searchable={permissionGroupOptions.length > 8}
            clearable={Boolean(selectedPermissionGroup)}
          />
        </CardContent>
      </Card>

      {showAnalytics && selectedPermissionGroupData && (
        <div className="space-y-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-2">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    {selectedPermissionGroupData.group_display_name || selectedPermissionGroupData.group_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedPermissionGroupData.group_description || 'No description available.'}
                  </p>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  {selectedPermissionGroupData.group_name}
                </p>
              </CardHeader>
            </Card>

            <StatsGrid stats={stats} columns={3} loading={loading} />
          </div>

          <section className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">User Groups Using This Permission Group</h3>
              <p className="text-sm text-muted-foreground">
                These user groups have been assigned this permission group. All members inherit these permissions.
              </p>
            </div>
            <DataView
              columns={userGroupColumns}
              data={userGroupUsage}
              viewMode="table"
              showViewToggle={false}
              isLoading={loading}
              emptyMessage="No user groups are using this permission group"
              emptyDescription="Assign this permission group to a user group to apply it to all members."
              emptyIcon={<Users size={20} />}
            />
          </section>

          <section className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Users with Direct Assignment</h3>
              <p className="text-sm text-muted-foreground">
                These users have been directly assigned this permission group for individual overrides.
              </p>
            </div>
            <DataView
              columns={userColumns}
              data={userUsage}
              viewMode="table"
              showViewToggle={false}
              isLoading={loading}
              emptyMessage="No users have direct assignments of this permission group"
              emptyDescription="Assign this permission group directly to a user to create an override."
              emptyIcon={<User size={20} />}
            />
          </section>
        </div>
      )}

      {!showAnalytics && !permissionGroupsLoading && (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={emptyStateContent.icon}
              title={emptyStateContent.title}
              description={emptyStateContent.description}
              size="lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;

