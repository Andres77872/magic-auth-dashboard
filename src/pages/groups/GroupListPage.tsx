import React, { useState } from 'react';
import { Button, Pagination, EmptyState } from '@/components/common';
import { useGroups } from '@/hooks';
import { GroupTable } from '@/components/features/groups/GroupTable';
import { GroupCard } from '@/components/features/groups/GroupCard';
import { GroupFilter } from '@/components/features/groups/GroupFilter';
import { GroupIcon } from '@/components/icons';
import { ROUTES } from '@/utils/routes';
import type { GroupListParams } from '@/types/group.types';

export const GroupListPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const { 
    groups, 
    pagination, 
    isLoading, 
    error, 
    filters,
    fetchGroups,
    setFilters 
  } = useGroups();

  const handlePageChange = (page: number) => {
    const offset = (page - 1) * (filters.limit || 20);
    setFilters({ offset });
    fetchGroups({ offset });
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setFilters({ sort_by: field, sort_order: direction });
    fetchGroups({ sort_by: field, sort_order: direction });
  };

  const handleFiltersChange = (newFilters: Partial<GroupListParams>) => {
    setFilters(newFilters);
    fetchGroups(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      offset: 0
    };
    setFilters(clearedFilters);
    fetchGroups(clearedFilters);
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  return (
    <div className="group-list-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Groups</h1>
          <p>Manage user groups and their memberships</p>
        </div>
        
        <div className="header-actions">
          <div className="view-toggle">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </div>
          
          <Button
            variant="primary"
            onClick={() => window.location.href = ROUTES.GROUPS_CREATE}
          >
            Create Group
          </Button>
        </div>
      </div>

      <GroupFilter
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {error && (
        <div className="group-list-error-banner">
          {error}
        </div>
      )}

      <div className="groups-content">
        {viewMode === 'table' ? (
          <GroupTable
            groups={groups}
            loading={isLoading}
            onSort={handleSort}
            sortField={filters.sort_by}
            sortDirection={filters.sort_order}
          />
        ) : (
          <div className="groups-grid">
            {groups.map(group => (
              <GroupCard key={group.group_hash} group={group} />
            ))}
          </div>
        )}

        {!isLoading && groups.length === 0 && (
          <EmptyState
            icon={<GroupIcon size="lg" />}
            title="No groups found"
            description="Create your first group to get started with group management and organize your users effectively."
            action={
              <Button
                variant="primary"
                onClick={() => window.location.href = ROUTES.GROUPS_CREATE}
              >
                Create Group
              </Button>
            }
          />
        )}
      </div>

      {pagination && pagination.total > pagination.limit && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}; 