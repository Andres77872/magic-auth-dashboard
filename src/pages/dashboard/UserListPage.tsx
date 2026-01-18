import React, { useState, useMemo, useCallback } from 'react';
import { UserEmptyState } from '@/components/features/users/UserEmptyState';
import { UserFormModal } from '@/components/features/users/UserFormModal';
import { UserActionsMenu } from '@/components/features/users/UserActionsMenu';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { UserDetailsModal } from '@/components/features/users/UserDetailsModal';
import { 
  PageContainer,
  PageHeader,
  FilterBar,
  StatsGrid,
  Pagination,
  Button,
  DataView,
  DataViewCard,
  Badge,
  ErrorState
} from '@/components/common';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Filter, StatCardProps, DataViewColumn } from '@/components/common';
import { useUsers, usePermissions } from '@/hooks';
import { User as UserIcon, RefreshCw, Plus, Check, AlertTriangle, Users, FolderKanban } from 'lucide-react';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash, formatCount } from '@/utils/component-utils';
import type { User, UserType } from '@/types/auth.types';

export interface UserFilters {
  search?: string;
  userType?: string;
  isActive?: boolean;
}

export function UserListPage(): React.JSX.Element {
  const { canCreateUser } = usePermissions();
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

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);

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

  const handleViewDetails = useCallback((user: User) => {
    setDetailsUser(user);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setDetailsUser(null);
  };

  const handleEditFromDetails = () => {
    if (!detailsUser) return;
    setShowDetailsModal(false);
    handleEditUser(detailsUser);
  };

  const handleCardActionInteraction = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  // Define columns for DataView
  const columns: DataViewColumn<User>[] = useMemo(() => [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar 
            username={user.username} 
            userType={user.user_type}
            size="sm"
          />
          <div className="flex flex-col min-w-0">
            <button
              type="button"
              onClick={() => handleViewDetails(user)}
              className="text-sm font-medium text-primary hover:underline text-left truncate"
              title={value as string}
              aria-label={`View details for ${user.username}`}
            >
              {value as string}
            </button>
            <span className="text-xs text-muted-foreground" title={user.user_hash}>
              {truncateHash(user.user_hash)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-foreground">{value as string}</span>
      ),
    },
    {
      key: 'user_type',
      header: 'User Type',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center gap-2">
          <Badge 
            variant={getUserTypeBadgeVariant(value as UserType)}
            size="sm"
          >
            {(value as string).toUpperCase()}
          </Badge>
          {user.user_type_info?.error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive cursor-help">
                    <AlertTriangle size={14} aria-hidden="true" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] bg-destructive text-destructive-foreground">
                  {user.user_type_info.error}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Groups',
      sortable: false,
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
          {user.groups && user.groups.length > 0 ? (
            <>
              {user.groups.slice(0, 2).map(group => (
                <Badge key={group.group_hash} variant="secondary" size="sm" className="gap-1">
                  <Users size={12} aria-hidden="true" />
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
            <span className="text-sm text-muted-foreground">No groups</span>
          )}
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      sortable: false,
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
          {user.projects && user.projects.length > 0 ? (
            <>
              {user.projects.slice(0, 2).map(project => (
                <Badge key={project.project_hash} variant="info" size="sm" className="gap-1">
                  <FolderKanban size={12} aria-hidden="true" />
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
            <span className="text-sm text-muted-foreground">No projects</span>
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
        <span className="text-sm text-muted-foreground">{formatDateTime(value as string)}</span>
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
  ], [handleRefresh, handleEditUser, handleViewDetails]);

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
      onClick={() => handleViewDetails(user)}
      actions={
        <div onClick={handleCardActionInteraction} onKeyDown={handleCardActionInteraction}>
          <UserActionsMenu 
            user={user} 
            onUserUpdated={handleRefresh}
            onEditUser={handleEditUser}
            onViewDetails={() => handleViewDetails(user)}
          />
        </div>
      }
    />
  ), [handleRefresh, handleEditUser, handleViewDetails, handleCardActionInteraction]);

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
        icon: <Check size={20} />,
      },
      {
        title: 'Inactive Users',
        value: inactiveUsers,
        icon: <AlertTriangle size={20} />,
      },
      {
        title: 'Admin Users',
        value: adminUsers,
        icon: <Users size={20} />,
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
              leftIcon={<Plus size={16} />}
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
        <ErrorState
          icon={<UserIcon size={24} />}
          title="Failed to load users"
          message={error}
          onRetry={handleRetry}
          isRetrying={isLoading}
          retryLabel="Try Again"
          variant="card"
          size="md"
        />
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
              leftIcon={<RefreshCw size={16} className={isLoading ? 'spinning' : ''} />}
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

      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetails}
        user={detailsUser}
        onEdit={handleEditFromDetails}
      />
    </PageContainer>
  );
}

export default UserListPage; 