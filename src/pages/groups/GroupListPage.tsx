import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  SearchBar,
  FilterBar,
  Button,
  Pagination,
  ConfirmDialog,
  Card
} from '@/components/common';
import type { Filter } from '@/components/common';
import { useGroups } from '@/hooks';
import { GroupTable } from '@/components/features/groups/GroupTable';
import { GroupCard } from '@/components/features/groups/GroupCard';
import { GroupFormModal } from '@/components/features/groups/GroupFormModal';
import { GroupIcon, PlusIcon } from '@/components/icons';
import { useToast } from '@/hooks';
import type { GroupListParams, UserGroup, GroupFormData } from '@/types/group.types';

export const GroupListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const { 
    groups, 
    pagination, 
    isLoading, 
    error, 
    filters,
    fetchGroups,
    setFilters,
    createGroup,
    updateGroup,
    deleteGroup
  } = useGroups();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<UserGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePageChange = (page: number) => {
    const offset = (page - 1) * (filters.limit || 20);
    setFilters({ offset });
    fetchGroups({ offset });
  };

  const handleSort = (field: keyof UserGroup, direction: 'asc' | 'desc') => {
    setFilters({ sort_by: field as string, sort_order: direction });
    fetchGroups({ sort_by: field as string, sort_order: direction });
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

  // Create group handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateSubmit = async (data: GroupFormData) => {
    try {
      await createGroup(data);
      showToast(`Group "${data.group_name}" created successfully`, 'success');
      handleCloseCreateModal();
      fetchGroups(); // Refresh the list
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create group', 'error');
      throw error;
    }
  };

  // Edit group handlers
  const handleEdit = (group: UserGroup) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedGroup(null);
  };

  const handleEditSubmit = async (data: GroupFormData) => {
    if (!selectedGroup) return;
    
    try {
      await updateGroup(selectedGroup.group_hash, data);
      showToast(`Group "${data.group_name}" updated successfully`, 'success');
      handleCloseEditModal();
      fetchGroups(); // Refresh the list
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update group', 'error');
      throw error;
    }
  };

  // Delete group handlers
  const handleDelete = (group: UserGroup) => {
    setGroupToDelete(group);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setGroupToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    try {
      await deleteGroup(groupToDelete.group_hash);
      showToast(`Group "${groupToDelete.group_name}" deleted successfully`, 'success');
      handleCloseDeleteDialog();
      fetchGroups(); // Refresh the list
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // View group details
  const handleView = (group: UserGroup) => {
    navigate(`/dashboard/groups/${group.group_hash}`);
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1;
  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 0;

  // Define filter options for FilterBar
  const filterBarFilters: Filter[] = [
    {
      key: 'sort',
      label: 'Sort by',
      options: [
        { value: 'created_at:desc', label: 'Newest first' },
        { value: 'created_at:asc', label: 'Oldest first' },
        { value: 'group_name:asc', label: 'Name (A-Z)' },
        { value: 'group_name:desc', label: 'Name (Z-A)' },
        { value: 'member_count:desc', label: 'Most members' },
        { value: 'member_count:asc', label: 'Fewest members' }
      ],
      value: `${filters.sort_by}:${filters.sort_order}`,
      onChange: (value: string) => {
        const [sort_by, sort_order] = value.split(':');
        handleFiltersChange({ sort_by, sort_order: sort_order as 'asc' | 'desc' });
      }
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="User Groups"
        subtitle="Manage user groups and their memberships"
        icon={<GroupIcon size={28} />}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              aria-label={`Switch to ${viewMode === 'table' ? 'grid' : 'table'} view`}
            >
              {viewMode === 'table' ? 'Grid View' : 'Table View'}
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusIcon size={16} />}
              onClick={handleOpenCreateModal}
              aria-label="Create new group"
            >
              Create Group
            </Button>
          </>
        }
      />

      {/* Search and Filter */}
      <div className="search-filter-section">
        <SearchBar
          onSearch={(query) => handleFiltersChange({ search: query, offset: 0 })}
          placeholder="Search groups by name or description..."
          defaultValue={filters.search || ''}
        />
        <FilterBar
          filters={filterBarFilters}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="error-card" padding="lg">
          <div className="error-content">
            <GroupIcon size={32} />
            <h3>Failed to load groups</h3>
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Table or Grid View */}
      {viewMode === 'table' ? (
        <Card padding="none">
          <GroupTable
            groups={groups}
            loading={isLoading}
            onSort={handleSort}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            emptyAction={
              <Button
                variant="primary"
                leftIcon={<PlusIcon size={16} />}
                onClick={handleOpenCreateModal}
              >
                Create Your First Group
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="groups-grid">
          {groups.length > 0 ? (
            groups.map(group => (
              <GroupCard key={group.group_hash} group={group} />
            ))
          ) : (
            <Card className="empty-state-card" padding="lg">
              <GroupIcon size={48} />
              <h3>No groups found</h3>
              <p>Create your first group to get started</p>
              <Button
                variant="primary"
                leftIcon={<PlusIcon size={16} />}
                onClick={handleOpenCreateModal}
              >
                Create Group
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <div className="pagination-section">
          <div className="pagination-info">
            <span>Showing {groups.length} of {pagination.total} groups</span>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Create Group Modal */}
      <GroupFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateSubmit}
        mode="create"
      />

      {/* Edit Group Modal */}
      <GroupFormModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSubmit={handleEditSubmit}
        mode="edit"
        group={selectedGroup}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${groupToDelete?.group_name}"? This action cannot be undone. All user memberships and project access grants for this group will be removed.`}
        confirmText="Delete Group"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};
