import React, { useState, useMemo, useCallback } from 'react';
import { UserEmptyState } from '@/components/features/users/UserEmptyState';
import { UserFormModal } from '@/components/features/users/UserFormModal';
import { UserActionsMenu } from '@/components/features/users/UserActionsMenu';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { BulkActionsBar } from '@/components/features/users/BulkActionsBar';
import { 
  PageContainer,
  PageHeader,
  FilterBar,
  StatsGrid,
  Pagination,
  Button,
  Card,
  DataView,
  DataViewCard,
  Badge
} from '@/components/common';
import type { Filter, StatCardProps, DataViewColumn } from '@/components/common';
import { useUsers, usePermissions } from '@/hooks';
import { UserIcon, RefreshIcon, PlusIcon, CheckIcon, WarningIcon, GroupIcon, ProjectIcon } from '@/components/icons';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash, formatCount } from '@/utils/component-utils';
import type { User, UserType } from '@/types/auth.types';

export interface UserFilters {
  search?: string;
  userType?: string;
  isActive?: boolean;
}

export function UserListPage(): React.JSX.Element {
  const { canCreateUser, canCreateAdmin } = usePermissions();
  const {
    users,
    pagination,
    isLoading,
    error,
    fetchUsers,
    setFilters,
    setPage,
    setSort,
    currentPage,
  } = useUsers({
    limit: 10,
    initialFilters: {}
  });

  // View mode state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Bulk selection state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Local filter state
  const [localFilters, setLocalFilters] = useState<UserFilters>({
    search: '',
    userType: '',
    isActive: undefined
  });

  const handleSearchChange = (query: string) => {
    const newFilters = { ...localFilters, search: query || undefined };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleUserTypeChange = (value: string) => {
    const newFilters = { ...localFilters, userType: value || undefined };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleStatusChange = (value: string) => {
    const isActive = value === '' ? undefined : value === 'true';
    const newFilters = { ...localFilters, isActive };
    setLocalFilters(newFilters);
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { search: '', userType: '', isActive: undefined };
    setLocalFilters(clearedFilters);
    setFilters({});
  };

  const handleSortChange = (key: keyof User, direction: 'asc' | 'desc') => {
    setSort(String(key), direction);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleRetry = () => {
    fetchUsers();
  };

  const handleRefresh = async () => {
    await fetchUsers();
  };

  const hasFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== ''
  );
  const showEmptyState = !isLoading && users.length === 0;

  const handleCreateUser = () => {
    setModalMode('create');
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleModalSuccess = () => {
    fetchUsers();
  };

  const handleModalClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // Bulk selection handlers
  const operableUsers = useMemo(() => {
    return users.filter(user => {
      if (user.user_type === 'root' && !canCreateAdmin) {
        return false;
      }
      return canCreateUser;
    });
  }, [users, canCreateUser, canCreateAdmin]);

  const isUserOperable = (user: User) => {
    return operableUsers.some(opUser => opUser.user_hash === user.user_hash);
  };

  const handleSelectUser = (userHash: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userHash)) {
      newSelected.delete(userHash);
    } else {
      newSelected.add(userHash);
    }
    setSelectedUsers(newSelected);
  };

  const isSomeSelected = selectedUsers.size > 0;

  // Define columns for DataView
  const columns: DataViewColumn<User>[] = useMemo(() => [
    // Checkbox column
    {
      key: 'select' as keyof User,
      header: 'Select',
      sortable: false,
      width: '50px',
      render: (_, user) => (
        <input
          type="checkbox"
          checked={selectedUsers.has(user.user_hash)}
          onChange={() => handleSelectUser(user.user_hash)}
          disabled={isLoading || !isUserOperable(user)}
          aria-label={`Select ${user.username}`}
          className="bulk-select-checkbox"
        />
      ),
    },
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, user) => (
        <div className="user-info">
          <UserAvatar 
            username={user.username} 
            userType={user.user_type}
            size="sm"
          />
          <div className="user-details">
            <div className="user-name">{value as string}</div>
            <div className="user-hash" title={user.user_hash}>
              {truncateHash(user.user_hash)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (value) => (
        <span className="user-email">{value as string}</span>
      ),
    },
    {
      key: 'user_type',
      header: 'User Type',
      sortable: true,
      render: (value, user) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <Badge 
            variant={getUserTypeBadgeVariant(value as UserType)}
            size="sm"
          >
            {(value as string).toUpperCase()}
          </Badge>
          {user.user_type_info?.error && (
            <span className="user-type-error" title={user.user_type_info.error}>
              <WarningIcon size={14} aria-hidden="true" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Groups',
      sortable: false,
      render: (_, user) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
          {user.groups && user.groups.length > 0 ? (
            <>
              {user.groups.slice(0, 2).map(group => (
                <Badge key={group.group_hash} variant="secondary" size="sm">
                  <GroupIcon size={12} aria-hidden="true" />
                  {group.group_name}
                </Badge>
              ))}
              {user.groups.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{user.groups.length - 2} more
                </Badge>
              )}
            </>
          ) : (
            <span className="no-groups">No groups</span>
          )}
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      sortable: false,
      render: (_, user) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
          {user.projects && user.projects.length > 0 ? (
            <>
              {user.projects.slice(0, 2).map(project => (
                <Badge key={project.project_hash} variant="info" size="sm">
                  <ProjectIcon size={12} aria-hidden="true" />
                  {project.project_name}
                </Badge>
              ))}
              {user.projects.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{user.projects.length - 2} more
                </Badge>
              )}
            </>
          ) : (
            <span className="no-projects">No projects</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm">
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (value) => (
        <span className="user-date">{formatDateTime(value as string)}</span>
      ),
    },
    {
      key: 'user_hash',
      header: 'Actions',
      sortable: false,
      render: (_, user) => (
        <UserActionsMenu 
          user={user} 
          onUserUpdated={handleRefresh}
          onEditUser={handleEditUser}
        />
      ),
      align: 'center',
      width: '80px',
    },
  ], [selectedUsers, isLoading, handleRefresh, handleEditUser, isUserOperable, handleSelectUser]);

  // Render card for grid view
  const renderCard = useCallback((user: User) => (
    <DataViewCard
      title={user.username}
      subtitle={user.email}
      icon={
        <UserAvatar 
          username={user.username} 
          userType={user.user_type}
          size="md"
        />
      }
      badges={[
        <Badge key="type" variant={getUserTypeBadgeVariant(user.user_type)}>
          {user.user_type.toUpperCase()}
        </Badge>,
        <Badge key="status" variant={user.is_active ? 'success' : 'secondary'}>
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ]}
      stats={[
        {
          label: 'Groups',
          value: <Badge variant="secondary">{formatCount(user.groups?.length || 0, 'group')}</Badge>
        },
        {
          label: 'Projects',
          value: <Badge variant="info">{formatCount(user.projects?.length || 0, 'project')}</Badge>
        },
        {
          label: 'Created',
          value: formatDateTime(user.created_at)
        }
      ]}
      actions={
        <UserActionsMenu 
          user={user} 
          onUserUpdated={handleRefresh}
          onEditUser={handleEditUser}
        />
      }
    />
  ), [handleRefresh, handleEditUser]);

  // Calculate statistics
  const stats: StatCardProps[] = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const inactiveUsers = totalUsers - activeUsers;
    const adminUsers = users.filter(u => u.user_type === 'admin').length;

    return [
      {
        title: 'Total Users',
        value: totalUsers,
        icon: <UserIcon size={20} />,
      },
      {
        title: 'Active Users',
        value: activeUsers,
        icon: <CheckIcon size={20} />,
      },
      {
        title: 'Inactive Users',
        value: inactiveUsers,
        icon: <WarningIcon size={20} />,
      },
      {
        title: 'Admin Users',
        value: adminUsers,
        icon: <GroupIcon size={20} />,
      },
    ];
  }, [users]);

  // Filter options for FilterBar
  const filterBarFilters: Filter[] = [
    {
      key: 'userType',
      label: 'All User Types',
      options: [
        { value: '', label: 'All User Types' },
        { value: 'root', label: 'ROOT Users' },
        { value: 'admin', label: 'ADMIN Users' },
        { value: 'consumer', label: 'CONSUMER Users' },
      ],
      value: localFilters.userType || '',
      onChange: handleUserTypeChange,
    },
    {
      key: 'status',
      label: 'All Status',
      options: [
        { value: '', label: 'All Status' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
      value: localFilters.isActive === undefined ? '' : String(localFilters.isActive),
      onChange: handleStatusChange,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="User Management"
        subtitle="Manage system users, permissions, and access controls"
        icon={<UserIcon size={28} />}
        actions={
          canCreateUser && (
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateUser}
              leftIcon={<PlusIcon size={16} />}
              aria-label="Create new user"
            >
              Create User
            </Button>
          )
        }
      >
        {/* Statistics Section */}
        {!showEmptyState && (
          <StatsGrid stats={stats} columns={4} loading={isLoading} />
        )}
      </PageHeader>

      {/* Filter Section */}
      <div className="filter-section">
        <FilterBar
          filters={filterBarFilters}
          onClearAll={handleClearFilters}
          showClearButton={hasFilters}
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="error-card" padding="lg">
          <div className="error-content">
            <div className="error-icon">
              <UserIcon size="xl" />
            </div>
            <div className="error-details">
              <h3 className="error-title">Failed to load users</h3>
              <p className="error-message">{error}</p>
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={handleRetry}
              disabled={isLoading}
            >
              {isLoading ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {showEmptyState && (
        <UserEmptyState
          hasFilters={hasFilters}
          onClearFilters={handleClearFilters}
          onCreateUser={canCreateUser ? handleCreateUser : undefined}
          canCreateUser={canCreateUser}
        />
      )}

      {/* Bulk Actions Bar */}
      {isSomeSelected && (
        <BulkActionsBar
          selectedCount={selectedUsers.size}
          onClearSelection={() => setSelectedUsers(new Set())}
          isLoading={false}
        />
      )}

      {/* Data View Section with Integrated Toolbar */}
      {!showEmptyState && !error && (
        <DataView<User>
          data={users}
          columns={columns}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
          showSearch={true}
          searchValue={localFilters.search || ''}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by username or email..."
          toolbarActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              leftIcon={<RefreshIcon size={16} className={isLoading ? 'spinning' : ''} />}
              aria-label="Refresh user list"
            >
              Refresh
            </Button>
          }
          renderCard={renderCard}
          gridColumns={{
            mobile: 1,
            tablet: 2,
            desktop: 3
          }}
          onSort={handleSortChange}
          isLoading={isLoading}
          emptyMessage="No users found"
          emptyIcon={<UserIcon size={32} />}
          skeletonRows={10}
          className={`user-data-view ${isSomeSelected ? 'has-selection' : ''}`}
        />
      )}

      {/* Pagination Section */}
      {pagination && pagination.total > 0 && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span className="pagination-text">
              Showing {users.length} of {pagination.total} users
            </span>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            onPageChange={handlePageChange}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        user={selectedUser}
      />
    </PageContainer>
  );
}

export default UserListPage; 