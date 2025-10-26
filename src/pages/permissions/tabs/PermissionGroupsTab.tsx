import React, { useState } from 'react';
import { Button, Input, Select, ConfirmDialog, Table } from '@/components/common';
import { PlusIcon, EditIcon, DeleteIcon, SettingsIcon } from '@/components/icons';
import { PermissionGroupModal, ManageGroupPermissionsModal } from '@/components/features/permissions';
import { useToast, usePermissionManagement } from '@/hooks';
import { globalRolesService } from '@/services';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import type { TableColumn } from '@/components/common/Table';

export const PermissionGroupsTab: React.FC = () => {
  const { showToast } = useToast();
  const { permissionGroups, permissionGroupsLoading: loading, refreshPermissionGroups, categories } = usePermissionManagement();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPermissionGroup, setEditingPermissionGroup] = useState<GlobalPermissionGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [permissionGroupToDelete, setPermissionGroupToDelete] = useState<GlobalPermissionGroup | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManagePermissionsModalOpen, setIsManagePermissionsModalOpen] = useState(false);
  const [managingPermissionGroup, setManagingPermissionGroup] = useState<GlobalPermissionGroup | null>(null);


  // Create handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      const response = await globalRolesService.createPermissionGroup(data);
      if (response.success) {
        showToast(`Permission group "${data.group_display_name}" created successfully`, 'success');
        await refreshPermissionGroups();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create permission group', 'error');
      throw error;
    }
  };

  // Edit handlers
  const handleEdit = (permissionGroup: GlobalPermissionGroup) => {
    setEditingPermissionGroup(permissionGroup);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (_data: any) => {
    if (!editingPermissionGroup) return;
    
    try {
      // Note: Update endpoint not available in API
      showToast('Edit functionality not available in current API', 'info');
      setIsEditModalOpen(false);
      setEditingPermissionGroup(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update permission group', 'error');
      throw error;
    }
  };

  // Delete handlers
  const handleDelete = (permissionGroup: GlobalPermissionGroup) => {
    setPermissionGroupToDelete(permissionGroup);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!permissionGroupToDelete) return;

    setIsDeleting(true);
    try {
      // Note: Delete endpoint not available in API
      showToast('Delete functionality not available in current API', 'info');
      setIsDeleteDialogOpen(false);
      setPermissionGroupToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete permission group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Manage permissions handlers
  const handleManagePermissions = (permissionGroup: GlobalPermissionGroup) => {
    setManagingPermissionGroup(permissionGroup);
    setIsManagePermissionsModalOpen(true);
  };

  const filteredPermissionGroups = permissionGroups.filter((pg: GlobalPermissionGroup) => {
    const matchesSearch = pg.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pg.group_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pg.group_description && pg.group_description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || pg.group_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns: TableColumn<GlobalPermissionGroup>[] = [
    {
      key: 'group_display_name',
      header: 'Name',
      sortable: true,
      width: '25%',
      render: (value, row) => (
        <div>
          <div className="permission-group-display-name">{value as string}</div>
          <div className="permission-group-name-small">{row.group_name}</div>
        </div>
      )
    },
    {
      key: 'group_description',
      header: 'Description',
      sortable: false,
      width: '35%',
      render: (value) => value || <span className="text-muted">—</span>
    },
    {
      key: 'group_category',
      header: 'Category',
      sortable: true,
      width: '15%',
      render: (value) => (
        <span className="category-badge">{value as string || 'general'}</span>
      )
    },
    {
      key: 'group_hash',
      header: 'Actions',
      sortable: false,
      width: '25%',
      align: 'right',
      render: (_, row) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<SettingsIcon size={16} />}
            onClick={() => handleManagePermissions(row)}
            aria-label={`Manage permissions for ${row.group_display_name}`}
          >
            Permissions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<EditIcon size={16} />}
            onClick={() => handleEdit(row)}
            aria-label={`Edit ${row.group_display_name}`}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<DeleteIcon size={16} />}
            onClick={() => handleDelete(row)}
            aria-label={`Delete ${row.group_display_name}`}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((cat: string) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1)
    }))
  ];

  return (
    <div className="permission-groups-tab">
      <div className="tab-header">
        <div className="tab-header-text">
          <h2>Permission Groups</h2>
          <p>Manage collections of permissions that can be assigned to roles, user groups, and users</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<PlusIcon size={16} />}
          onClick={handleOpenCreateModal}
        >
          Create Permission Group
        </Button>
      </div>

      <div className="tab-toolbar">
        <div className="tab-search">
          <Input
            type="text"
            placeholder="Search permission groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="tab-filters">
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={categoryOptions}
            placeholder="Filter by category"
          />
        </div>

        <div className="tab-count">
          {filteredPermissionGroups.length} permission group{filteredPermissionGroups.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredPermissionGroups}
        isLoading={loading}
        emptyMessage="No permission groups found"
        emptyAction={
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={16} />}
            onClick={handleOpenCreateModal}
          >
            Create Your First Permission Group
          </Button>
        }
      />

      {/* Create Permission Group Modal */}
      <PermissionGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        mode="create"
        categories={categories}
      />

      {/* Edit Permission Group Modal */}
      <PermissionGroupModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPermissionGroup(null);
        }}
        onSubmit={handleEditSubmit}
        mode="edit"
        permissionGroup={editingPermissionGroup}
        categories={categories}
      />

      {/* Manage Permissions Modal */}
      <ManageGroupPermissionsModal
        isOpen={isManagePermissionsModalOpen}
        onClose={() => {
          setIsManagePermissionsModalOpen(false);
          setManagingPermissionGroup(null);
        }}
        permissionGroup={managingPermissionGroup}
        onUpdate={refreshPermissionGroups}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setPermissionGroupToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Permission Group"
        message={`Are you sure you want to delete the permission group "${permissionGroupToDelete?.group_display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PermissionGroupsTab;

