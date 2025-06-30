import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserFilter } from '@/components/features/users/UserFilter';
import { UserTable } from '@/components/features/users/UserTable';
import { Pagination } from '@/components/common';
import { useUsers, usePermissions } from '@/hooks';
import { UserIcon } from '@/components/icons';
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

  const handleCreateUser = () => {
    navigate(ROUTES.USERS_CREATE);
  };

  return (
    <div className="user-list-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>User Management</h1>
          <p>Manage system users, permissions, and access controls</p>
        </div>
        {canCreateUser && (
          <div className="page-actions">
            <button 
              onClick={handleCreateUser}
              className="btn btn-primary"
            >
              <UserIcon size="small" />
              Create User
            </button>
          </div>
        )}
      </div>

      <div className="page-content">
        {/* Filter Section */}
        <div className="filter-section">
          <UserFilter 
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-message">{error}</span>
              <button 
                onClick={handleRetry}
                className="btn btn-outline btn-small"
                disabled={isLoading}
              >
                {isLoading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="table-section">
          <UserTable
            users={users}
            isLoading={isLoading}
            onSort={handleSortChange}
          />
        </div>

        {/* Pagination Section */}
        {pagination && pagination.total > 0 && (
          <div className="pagination-section">
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