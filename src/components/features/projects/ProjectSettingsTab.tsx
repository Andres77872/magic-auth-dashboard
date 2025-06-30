import React, { useState } from 'react';
import { Card, Button, ConfirmDialog, Modal, Input, Select } from '@/components/common';
import { ProjectForm } from './ProjectForm';
import { projectService, userService } from '@/services';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails, ProjectFormData } from '@/types/project.types';

interface ProjectSettingsTabProps {
  project: ProjectDetails;
  onProjectUpdate: (updatedProject: ProjectDetails) => void;
  onProjectDeleted: () => void;
}

interface User {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
}

export const ProjectSettingsTab: React.FC<ProjectSettingsTabProps> = ({
  project,
  onProjectUpdate,
  onProjectDeleted
}) => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (formData: ProjectFormData) => {
    try {
      setIsUpdating(true);
      setError(null);
      const response = await projectService.updateProject(project.project_hash, formData);
      
      if (response.success && response.project) {
        // Map the response to our expected format
        const updatedProject: ProjectDetails = {
          ...project,
          project_name: response.project.project_name,
          project_description: response.project.project_description,
          updated_at: new Date().toISOString(), // Set current time as updated
        };
        onProjectUpdate(updatedProject);
      } else {
        setError('Failed to update project. Please try again.');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await projectService.toggleProjectArchive(
        project.project_hash,
        project.is_active !== false
      );
      
      if (response.success && response.data) {
        onProjectUpdate(response.data);
        setShowArchiveConfirm(false);
      } else {
        setError('Failed to archive project. Please try again.');
      }
    } catch (err) {
      console.error('Error archiving project:', err);
      setError('Failed to archive project. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await projectService.deleteProject(project.project_hash);
      
      if (response.success) {
        onProjectDeleted();
        setShowDeleteConfirm(false);
      } else {
        setError('Failed to delete project. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await userService.getUsers({
        limit: 100,
        user_type: 'admin', // Only allow admins to own projects
      });
      
      if (response.success && response.data) {
        // Filter out current project admin
        const availableUsers = (response.data as User[]).filter((user: User) => 
          user.user_hash !== project.admin_user
        );
        setUsers(availableUsers);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users for transfer.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;

    try {
      setIsTransferring(true);
      const response = await projectService.transferOwnership(
        project.project_hash,
        selectedNewOwner
      );
      
      if (response.success) {
        const updatedProject = {
          ...project,
          admin_user: selectedNewOwner,
        };
        onProjectUpdate(updatedProject);
        setShowTransferModal(false);
        setSelectedNewOwner('');
      } else {
        setError('Failed to transfer ownership. Please try again.');
      }
    } catch (err) {
      console.error('Error transferring ownership:', err);
      setError('Failed to transfer ownership. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const openTransferModal = () => {
    setShowTransferModal(true);
    fetchUsers();
  };

  const userOptions = users.map(user => ({
    value: user.user_hash,
    label: `${user.username} (${user.email})`,
  }));

  return (
    <div className="project-settings-tab">
      {error && (
        <Card className="error-card">
          <div style={{ color: 'var(--color-error)' }}>
            ⚠️ {error}
            <Button 
              variant="ghost" 
              size="small" 
              onClick={() => setError(null)}
              style={{ float: 'right' }}
            >
              ×
            </Button>
          </div>
        </Card>
      )}

      {/* Project Information */}
      <Card className="settings-card">
        <h3>Project Information</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Update the basic information about your project.
        </p>
        
        <ProjectForm
          mode="edit"
          initialData={{
            project_name: project.project_name,
            project_description: project.project_description,
          }}
          onSubmit={handleUpdate}
          onCancel={() => navigate(ROUTES.PROJECTS)}
          isSubmitting={isUpdating}
        />
      </Card>

      {/* Project Management */}
      <Card className="settings-card">
        <h3>Project Management</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Transfer ownership or change project status.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            onClick={openTransferModal}
          >
            Transfer Ownership
          </Button>
          
          <Button
            variant={project.is_active !== false ? "secondary" : "primary"}
            onClick={() => setShowArchiveConfirm(true)}
            isLoading={isArchiving}
          >
            {project.is_active !== false ? "Archive Project" : "Unarchive Project"}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="danger-card">
        <h3 style={{ color: 'var(--color-error)' }}>⚠️ Danger Zone</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
          Irreversible and destructive actions. Please be cautious.
        </p>
        
        <Button
          variant="danger"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Project
        </Button>
      </Card>

      {/* Archive Confirmation */}
      {showArchiveConfirm && (
        <ConfirmDialog
          isOpen={true}
          title={`${project.is_active !== false ? 'Archive' : 'Unarchive'} Project`}
          message={`Are you sure you want to ${project.is_active !== false ? 'archive' : 'unarchive'} "${project.project_name}"? ${project.is_active !== false ? 'This will make the project read-only.' : 'This will make the project active again.'}`}
          confirmText={project.is_active !== false ? 'Archive' : 'Unarchive'}
          cancelText="Cancel"
          variant={project.is_active !== false ? 'warning' : 'info'}
          onConfirm={handleArchive}
          onClose={() => setShowArchiveConfirm(false)}
          isLoading={isArchiving}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowDeleteConfirm(false);
            setDeleteConfirmation('');
          }}
          title="Delete Project"
          size="medium"
        >
          <div style={{ minWidth: '400px' }}>
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--color-error-bg)', 
              border: '1px solid var(--color-error)',
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <p style={{ color: 'var(--color-error)', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                ⚠️ This action cannot be undone!
              </p>
              <p style={{ color: 'var(--color-error)', margin: 0 }}>
                This will permanently delete the project "{project.project_name}" and all associated data.
              </p>
            </div>
            
            <p style={{ marginBottom: '12px' }}>
              Please type <strong>{project.project_name}</strong> to confirm:
            </p>
            
            <Input
              placeholder="Enter project name"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              style={{ marginBottom: '20px' }}
            />
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmation('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleteConfirmation !== project.project_name || isDeleting}
                isLoading={isDeleting}
              >
                Delete Project
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedNewOwner('');
          }}
          title="Transfer Project Ownership"
          size="medium"
        >
          <div style={{ minWidth: '400px' }}>
            <p style={{ marginBottom: '20px' }}>
              Select a new owner for the project "{project.project_name}". Only admin users can own projects.
            </p>
            
            {isLoadingUsers ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                Loading users...
              </div>
            ) : (
              <div style={{ marginBottom: '20px' }}>
                <Select
                  placeholder="Select new owner..."
                  value={selectedNewOwner}
                  onChange={(value) => setSelectedNewOwner(value)}
                  options={userOptions}
                />
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedNewOwner('');
                }}
                disabled={isTransferring}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleTransferOwnership}
                disabled={!selectedNewOwner || isTransferring}
                isLoading={isTransferring}
              >
                Transfer Ownership
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}; 