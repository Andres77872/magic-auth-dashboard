import React, { useState, useEffect } from 'react';
import { userService, projectService, systemService } from '@/services';
import { Modal, Button, LoadingSpinner, Badge, ConfirmDialog } from '@/components/common';
import { ProjectIcon, PlusIcon, DeleteIcon, CheckIcon } from '@/components/icons';
import { useToast } from '@/hooks';
import '../../../styles/components/admin-projects-manager.css';

interface AdminProjectsManagerProps {
  userHash: string;
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function AdminProjectsManager({
  userHash,
  username,
  isOpen,
  onClose,
  onUpdate,
}: AdminProjectsManagerProps): React.JSX.Element {
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [projectToRemove, setProjectToRemove] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, userHash]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      // Load assigned projects
      const adminProjectsResponse = await userService.getAdminProjects(userHash);
      if (adminProjectsResponse.success && adminProjectsResponse.data) {
        setAssignedProjects(adminProjectsResponse.data.projects || []);
      }

      // Load all available projects
      const allProjectsResponse = await projectService.getProjects();
      if (allProjectsResponse.success && allProjectsResponse.data) {
        const allProjects = Array.isArray(allProjectsResponse.data) 
          ? allProjectsResponse.data 
          : [];
        const assignedIds = assignedProjects.map((p: any) => p.project_id);
        setAvailableProjects(allProjects.filter((p: any) => !assignedIds.includes(p.project_id)));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      showToast('Failed to load projects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async (projectId: number) => {
    setIsSaving(true);
    try {
      const response = await userService.addAdminToProject(userHash, projectId);
      
      if (response.success) {
        showToast('Project assigned successfully', 'success');
        
        // Invalidate user cache to refresh their project access
        await systemService.invalidateUserCache(userHash);
        
        // Reload projects
        await loadProjects();
        onUpdate?.();
      } else {
        showToast(response.message || 'Failed to assign project', 'error');
      }
    } catch (error) {
      console.error('Failed to add project:', error);
      showToast('An error occurred while assigning project', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProject = (project: any) => {
    setProjectToRemove(project);
    setShowConfirmRemove(true);
  };

  const confirmRemoveProject = async () => {
    if (!projectToRemove) return;

    setIsSaving(true);
    try {
      const response = await userService.removeAdminFromProject(
        userHash,
        projectToRemove.project_id
      );
      
      if (response.success) {
        showToast('Project removed successfully', 'success');
        
        // Invalidate user cache
        await systemService.invalidateUserCache(userHash);
        
        // Reload projects
        await loadProjects();
        onUpdate?.();
      } else {
        showToast(response.message || 'Failed to remove project', 'error');
      }
    } catch (error) {
      console.error('Failed to remove project:', error);
      showToast('An error occurred while removing project', 'error');
    } finally {
      setIsSaving(false);
      setShowConfirmRemove(false);
      setProjectToRemove(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Manage Projects for ${username}`}
        size="lg"
        className="admin-projects-manager-modal"
      >
        {isLoading ? (
          <div className="loading-container">
            <LoadingSpinner size="lg" />
            <p>Loading projects...</p>
          </div>
        ) : (
          <div className="admin-projects-manager">
            {/* Assigned Projects Section */}
            <div className="projects-section">
              <div className="section-header">
                <h3>
                  <ProjectIcon size={20} />
                  Assigned Projects ({assignedProjects.length})
                </h3>
              </div>

              {assignedProjects.length === 0 ? (
                <div className="empty-state">
                  <ProjectIcon size={24} />
                  <p>No projects assigned yet</p>
                  <p className="empty-state-hint">
                    Select projects from the available list below
                  </p>
                </div>
              ) : (
                <div className="admin-projects-grid">
                  {assignedProjects.map(project => (
                    <div key={project.project_id} className="project-card assigned">
                      <div className="project-card-header">
                        <ProjectIcon size={16} />
                        <div className="project-info">
                          <h4>{project.name}</h4>
                          {project.description && (
                            <p className="project-description">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="project-card-footer">
                        <Badge variant="success">
                          <CheckIcon size={16} />
                          Assigned
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProject(project)}
                          disabled={isSaving}
                        >
                          <DeleteIcon size={16} />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Projects Section */}
            <div className="projects-section">
              <div className="section-header">
                <h3>
                  <PlusIcon size={20} />
                  Available Projects ({availableProjects.length})
                </h3>
              </div>

              {availableProjects.length === 0 ? (
                <div className="empty-state">
                  <CheckIcon size={24} />
                  <p>All projects are already assigned</p>
                </div>
              ) : (
                <div className="admin-projects-grid">
                  {availableProjects.map(project => (
                    <div key={project.project_id} className="project-card available">
                      <div className="project-card-header">
                        <ProjectIcon size={16} />
                        <div className="project-info">
                          <h4>{project.name}</h4>
                          {project.description && (
                            <p className="project-description">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="project-card-footer">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddProject(project.project_id)}
                          disabled={isSaving}
                        >
                          <PlusIcon size={16} />
                          Add Project
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="modal-footer">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Confirm Remove Dialog */}
      {showConfirmRemove && projectToRemove && (
        <ConfirmDialog
          isOpen={showConfirmRemove}
          onClose={() => setShowConfirmRemove(false)}
          onConfirm={confirmRemoveProject}
          title="Remove Project Access"
          message={`Are you sure you want to remove ${username}'s access to "${projectToRemove.name}"? They will no longer be able to manage this project.`}
        />
      )}
    </>
  );
}

export default AdminProjectsManager;
