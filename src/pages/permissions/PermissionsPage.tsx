import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionTable } from '@/components/features/rbac/PermissionTable';
import { PermissionForm } from '@/components/features/rbac/PermissionForm';
import { PermissionCategories } from '@/components/features/rbac/PermissionCategories';
import type { Permission } from '@/types/rbac.types';
import '@/styles/pages/PermissionsPage.css';

export const PermissionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectHash, setSelectedProjectHash] = useState<string | null>(
    searchParams.get('project') || null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    permissions,
    loading: permissionsLoading,
    error,
    createPermission,
    updatePermission,
    deletePermission,
    refreshPermissions,
    categories
  } = usePermissions(selectedProjectHash);

  // Set default project if none selected and projects are available
  useEffect(() => {
    if (!selectedProjectHash && projects.length > 0 && !projectsLoading) {
      const firstProject = projects[0];
      setSelectedProjectHash(firstProject.project_hash);
      setSearchParams({ project: firstProject.project_hash });
    }
  }, [projects, projectsLoading, selectedProjectHash, setSearchParams]);

  const handleProjectChange = (projectHash: string) => {
    setSelectedProjectHash(projectHash);
    setSearchParams({ project: projectHash });
    setShowCreateForm(false);
    setEditingPermission(null);
    setSelectedCategory('');
  };

  const handleCreatePermission = () => {
    setShowCreateForm(true);
    setEditingPermission(null);
  };

  const handleEditPermission = (permission: Permission) => {
    setEditingPermission(permission);
    setShowCreateForm(false);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingPermission(null);
  };

  const handleFormSubmit = async (permissionData: any) => {
    try {
      if (editingPermission) {
        await updatePermission(editingPermission.id, permissionData);
      } else {
        await createPermission(permissionData);
      }
      handleCloseForm();
      await refreshPermissions();
    } catch (error) {
      console.error('Error saving permission:', error);
    }
  };

  const handleDeletePermission = async (permissionId: number) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await deletePermission(permissionId);
        await refreshPermissions();
      } catch (error) {
        console.error('Error deleting permission:', error);
      }
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedProject = projects.find(p => p.project_hash === selectedProjectHash);

  if (projectsLoading) {
    return (
      <div className="permissions-page loading">
        <div className="loading-spinner">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="permissions-page">
      <div className="permissions-page__header">
        <div className="permissions-page__title">
          <h1>Permission Management</h1>
          <p>Create and manage custom permissions for your projects</p>
        </div>
        
        {projects.length > 0 && (
          <div className="permissions-page__controls">
            <div className="project-selector">
              <label htmlFor="project-select">Project:</label>
              <select
                id="project-select"
                value={selectedProjectHash || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.project_hash} value={project.project_hash}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedProjectHash && (
              <button 
                className="btn btn-primary"
                onClick={handleCreatePermission}
              >
                Create Permission
              </button>
            )}
          </div>
        )}
      </div>

      {selectedProjectHash && selectedProject ? (
        <div className="permissions-page__content">
          <div className="permissions-page__sidebar">
            <PermissionCategories
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              permissionCounts={permissions.reduce((acc, perm) => {
                acc[perm.category] = (acc[perm.category] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
            />
          </div>

          <div className="permissions-page__main">
            {(showCreateForm || editingPermission) && (
              <div className="permissions-page__form">
                <PermissionForm
                  mode={editingPermission ? 'edit' : 'create'}
                  projectHash={selectedProjectHash}
                  initialData={editingPermission || undefined}
                  categories={categories}
                  onSubmit={handleFormSubmit}
                  onCancel={handleCloseForm}
                />
              </div>
            )}

            <div className="permissions-page__table-section">
              <div className="permissions-page__table-header">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="permissions-count">
                  {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''}
                  {selectedCategory && ` in ${selectedCategory}`}
                </div>
              </div>

              {error && (
                <div className="permissions-page-error-message">
                  Error loading permissions: {error}
                </div>
              )}

              <PermissionTable
                permissions={filteredPermissions}
                projectHash={selectedProjectHash}
                loading={permissionsLoading}
                onEdit={handleEditPermission}
                onDelete={handleDeletePermission}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="permissions-page__empty">
          <div className="empty-state">
            <h3>No Projects Available</h3>
            <p>Create a project first to manage permissions.</p>
          </div>
        </div>
      )}
    </div>
  );
}; 