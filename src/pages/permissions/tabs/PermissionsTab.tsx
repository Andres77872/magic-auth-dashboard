import React, { useState } from 'react';
import { Button, Input, Select, ConfirmDialog, Table } from '@/components/common';
import { PlusIcon, EditIcon, DeleteIcon } from '@/components/icons';
import { PermissionModal } from '@/components/features/permissions';
import { useToast, usePermissionManagement } from '@/hooks';
import { globalRolesService } from '@/services';
import type { GlobalPermission } from '@/types/global-roles.types';
import type { TableColumn } from '@/components/common/Table';

export const PermissionsTab: React.FC = () => {
  const { showToast } = useToast();
  const { permissions, permissionsLoading: loading, refreshPermissions, categories } = usePermissionManagement();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<GlobalPermission | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<GlobalPermission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Create handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      const response = await globalRolesService.createPermission(data);
      if (response.success) {
        showToast(`Permission "${data.permission_display_name}" created successfully`, 'success');
        await refreshPermissions();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create permission', 'error');
      throw error;
    }
  };

  // Edit handlers
  const handleEdit = (permission: GlobalPermission) => {
    setEditingPermission(permission);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (_data: any) => {
    if (!editingPermission) return;
    
    try {
      // Note: Update endpoint not available in API
      showToast('Edit functionality not available in current API', 'info');
      setIsEditModalOpen(false);
      setEditingPermission(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update permission', 'error');
      throw error;
    }
  };

  // Delete handlers
  const handleDelete = (permission: GlobalPermission) => {
    setPermissionToDelete(permission);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!permissionToDelete) return;

    setIsDeleting(true);
    try {
      // Note: Delete endpoint not available in API
      showToast('Delete functionality not available in current API', 'info');
      setIsDeleteDialogOpen(false);
      setPermissionToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete permission', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPermissions = permissions.filter((permission: GlobalPermission) => {
    const matchesSearch = permission.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permission_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.permission_description && permission.permission_description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || permission.permission_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const columns: TableColumn<GlobalPermission>[] = [
    {
      key: 'permission_display_name',
      header: 'Name',
      sortable: true,
      width: '25%',
      render: (value, row) => (
        <div>
          <div className="permission-display-name">{value as string}</div>
          <div className="permission-name-small">{row.permission_name}</div>
        </div>
      )
    },
    {
      key: 'permission_description',
      header: 'Description',
      sortable: false,
      width: '40%',
      render: (value) => value || <span className="text-muted">—</span>
    },
    {
      key: 'permission_category',
      header: 'Category',
      sortable: true,
      width: '15%',
      render: (value) => (
        <span className="category-badge">{value as string || 'general'}</span>
      )
    },
    {
      key: 'permission_hash',
      header: 'Actions',
      sortable: false,
      width: '20%',
      align: 'right',
      render: (_, row) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<EditIcon size={16} />}
            onClick={() => handleEdit(row)}
            aria-label={`Edit ${row.permission_display_name}`}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<DeleteIcon size={16} />}
            onClick={() => handleDelete(row)}
            aria-label={`Delete ${row.permission_display_name}`}
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
    <div className="permissions-tab">
      <div className="tab-header">
        <div className="tab-header-text">
          <h2>Global Permissions</h2>
          <p>Manage individual permissions that can be grouped into permission groups</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<PlusIcon size={16} />}
          onClick={handleOpenCreateModal}
        >
          Create Permission
        </Button>
      </div>

      <div className="tab-toolbar">
        <div className="tab-search">
          <Input
            type="text"
            placeholder="Search permissions..."
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
          {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredPermissions}
        isLoading={loading}
        emptyMessage="No permissions found"
        emptyAction={
          <Button
            variant="primary"
            leftIcon={<PlusIcon size={16} />}
            onClick={handleOpenCreateModal}
          >
            Create Your First Permission
          </Button>
        }
      />

      {/* Create Permission Modal */}
      <PermissionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        mode="create"
        categories={categories}
      />

      {/* Edit Permission Modal */}
      <PermissionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPermission(null);
        }}
        onSubmit={handleEditSubmit}
        mode="edit"
        permission={editingPermission}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setPermissionToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Permission"
        message={`Are you sure you want to delete the permission "${permissionToDelete?.permission_display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PermissionsTab;

