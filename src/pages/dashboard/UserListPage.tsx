import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserFilter } from '@/components/features/users/UserFilter';
import { UserTable } from '@/components/features/users/UserTable';
import { UserStats } from '@/components/features/users/UserStats';
import { UserEmptyState } from '@/components/features/users/UserEmptyState';
import { Pagination, Button } from '@/components/common';
import { useUsers, usePermissions } from '@/hooks';
import { UserIcon, RefreshIcon } from '@/components/icons';
import { ROUTES } from '@/utils/routes';
import type { User } from '@/types/auth.types';
import type { UserFilters } from '@/components/features/users/UserFilter';

export function UserListPage(): React.JSX.Element {
  const navigate = useNavigate();
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
    filters,
    currentPage,
  } = useUsers({
    limit: 10,
    initialFilters: {}
  });

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
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

  const hasFilters = Object.keys(filters).some(key => filters[key as keyof UserFilters] !== undefined);
  const showEmptyState = !isLoading && users.length === 0;

  const handleCreateUser = () => {
    navigate(ROUTES.USERS_CREATE);
  };

  return (
    <div className="user-list-page">
      {/* Enhanced Page Header */}
      <div className="user-list-page-header">
        <div className="user-list-page-header-content">
          <div className="user-list-page-title-section">
            <h1 className="user-list-page-title">
              <UserIcon size="md" />
              User Management
            </h1>
            <p className="user-list-page-subtitle">
              Manage system users, permissions, and access controls
            </p>
          </div>
          <div className="user-list-page-actions">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              disabled={isLoading}
              leftIcon={<RefreshIcon size="sm" className={isLoading ? 'spinning' : ''} aria-hidden="true" />}
              aria-label="Refresh user list"
            >
              Refresh
            </Button>
            {canCreateUser && (
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateUser}
                leftIcon={<UserIcon size="sm" aria-hidden="true" />}
                aria-label="Create new user"
              >
                Create User
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="user-list-page-content">
        {/* Statistics Section */}
        {!showEmptyState && (
          <div className="stats-section">
            <UserStats users={users} isLoading={isLoading} />
          </div>
        )}

        {/* Filter Section */}
        <div className="filter-section">
          <UserFilter 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="error-banner" role="alert">
            <div className="error-content">
              <div className="error-icon">
                <UserIcon size="md" />
              </div>
              <div className="error-details">
                <span className="error-title">Failed to load users</span>
                <span className="error-message">{error}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isLoading}
              >
                {isLoading ? 'Retrying...' : 'Try Again'}
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {showEmptyState && (
          <div className="empty-state-section">
            <UserEmptyState
              hasFilters={hasFilters}
              onClearFilters={() => handleFiltersChange({})}
              onCreateUser={canCreateUser ? handleCreateUser : undefined}
              canCreateUser={canCreateUser}
            />
          </div>
        )}

        {/* Table Section */}
        {!showEmptyState && (
          <div className="table-section">
            <UserTable
              users={users}
              isLoading={isLoading}
              onSort={handleSortChange}
              onUserUpdated={handleRefresh}
            />
          </div>
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
      </div>
    </div>
  );
}

export default UserListPage; 