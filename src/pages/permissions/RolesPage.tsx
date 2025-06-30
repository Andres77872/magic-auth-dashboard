import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useRoles } from '@/hooks/useRoles';
import { RoleTable } from '@/components/features/rbac/RoleTable';
import { RoleForm } from '@/components/features/rbac/RoleForm';
import type { Role } from '@/types/rbac.types';
import './RolesPage.css';

export const RolesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectHash, setSelectedProjectHash] = useState<string | null>(
    searchParams.get('project') || null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    roles,
    loading: rolesLoading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refreshRoles
  } = useRoles(selectedProjectHash);

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
    setEditingRole(null);
  };

  const handleCreateRole = () => {
    setShowCreateForm(true);
    setEditingRole(null);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowCreateForm(false);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingRole(null);
  };

  const handleFormSubmit = async (roleData: any) => {
    try {
      if (editingRole) {
        await updateRole(editingRole.id, roleData);
      } else {
        await createRole(roleData);
      }
      handleCloseForm();
      await refreshRoles();
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole(roleId);
        await refreshRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const filteredRoles = roles.filter(role =>
    role.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProject = projects.find(p => p.project_hash === selectedProjectHash);

  if (projectsLoading) {
    return (
      <div className="roles-page loading">
        <div className="loading-spinner">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="roles-page">
      <div className="roles-page__header">
        <div className="roles-page__title">
          <h1>Role Management</h1>
          <p>Create and manage roles with permission assignments</p>
        </div>
        
        {projects.length > 0 && (
          <div className="roles-page__controls">
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
                onClick={handleCreateRole}
              >
                Create Role
              </button>
            )}
          </div>
        )}
      </div>

      {selectedProjectHash && selectedProject ? (
        <div className="roles-page__content">
          {(showCreateForm || editingRole) && (
            <div className="roles-page__form">
              <RoleForm
                mode={editingRole ? 'edit' : 'create'}
                projectHash={selectedProjectHash}
                initialData={editingRole || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
              />
            </div>
          )}

          <div className="roles-page__table-section">
            <div className="roles-page__table-header">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="roles-count">
                {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
              </div>
            </div>

            {error && (
              <div className="error-message">
                Error loading roles: {error}
              </div>
            )}

            <RoleTable
              roles={filteredRoles}
              projectHash={selectedProjectHash}
              loading={rolesLoading}
              onEdit={handleEditRole}
              onDelete={handleDeleteRole}
            />
          </div>
        </div>
      ) : (
        <div className="roles-page__empty">
          <div className="empty-state">
            <h3>No Projects Available</h3>
            <p>Create a project first to manage roles.</p>
          </div>
        </div>
      )}
    </div>
  );
}; 