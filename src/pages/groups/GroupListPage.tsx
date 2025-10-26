import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Pagination, ConfirmDialog } from '@/components/common';
import { useGroups } from '@/hooks';
import { GroupTable } from '@/components/features/groups/GroupTable';
import { GroupCard } from '@/components/features/groups/GroupCard';
import { GroupFilter } from '@/components/features/groups/GroupFilter';
import { GroupFormModal } from '@/components/features/groups/GroupFormModal';
import { GroupIcon, PlusIcon } from '@/components/icons';
import { useToast } from '@/hooks';
import type { GroupListParams, UserGroup, GroupFormData } from '@/types/group.types';
import '../../styles/pages/groups.css';

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

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div className="groups-header-content">
          <div className="groups-header-text">
            <h1 className="groups-title">User Groups</h1>
            <p className="groups-subtitle">
              Manage user groups and their memberships
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={16} aria-hidden="true" />}
            onClick={handleOpenCreateModal}
            aria-label="Create new group"
          >
            Create Group
          </Button>
        </div>

        <GroupFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClear={handleClearFilters}
        />

        <div className="groups-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            aria-label="Table view"
          >
            Table
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            Grid
          </button>
        </div>
      </div>

      {error && (
        <div className="groups-error-banner">
          <p>{error}</p>
        </div>
      )}

      <div className="groups-content">
        {viewMode === 'table' ? (
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
        ) : (
          <div className="groups-grid">
            {groups.length > 0 ? (
              groups.map(group => (
                <GroupCard key={group.group_hash} group={group} />
              ))
            ) : (
              <div className="groups-empty-state">
                <GroupIcon size="lg" />
                <h3>No groups found</h3>
                <p>Create your first group to get started</p>
                <Button
                  variant="primary"
                  leftIcon={<PlusIcon size={16} />}
                  onClick={handleOpenCreateModal}
                >
                  Create Group
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {pagination && pagination.total > pagination.limit && (
        <div className="groups-pagination">
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
    </div>
  );
};
