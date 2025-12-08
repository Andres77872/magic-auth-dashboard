import React, { useState, useEffect } from 'react';
import { userService, projectService, systemService } from '@/services';
import { Modal, Button, LoadingSpinner, Badge, ConfirmDialog } from '@/components/common';
import { FolderKanban, Plus, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks';

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
      // Load assigned projects - API returns { success, user_hash, assigned_projects }
      const adminProjectsResponse = await userService.getAdminProjects(userHash);
      const currentAssigned = adminProjectsResponse.success && adminProjectsResponse.assigned_projects
        ? adminProjectsResponse.assigned_projects.map((p: any) => ({
            project_id: p.project_id,
            project_hash: p.project_hash,
            name: p.project_name,
            description: p.project_description,
          }))
        : [];
      setAssignedProjects(currentAssigned);

      // Load all available projects
      const allProjectsResponse = await projectService.getProjects();
      if (allProjectsResponse.success) {
        const projectsList = (allProjectsResponse as any).projects || [];
        const assignedIds = currentAssigned.map((p: any) => String(p.project_id));
        setAvailableProjects(
          projectsList.filter((p: any) => !assignedIds.includes(String(p.project_id)))
        );
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
                  <FolderKanban size={20} />
                  Assigned Projects ({assignedProjects.length})
                </h3>
              </div>

              {assignedProjects.length === 0 ? (
                <div className="empty-state">
                  <FolderKanban size={24} />
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
                        <FolderKanban size={16} />
                        <div className="project-info">
                          <h4>{project.name}</h4>
                          {project.description && (
                            <p className="project-description">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="project-card-footer">
                        <Badge variant="success">
                          <Check size={16} />
                          Assigned
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProject(project)}
                          disabled={isSaving}
                        >
                          <Trash2 size={16} />
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
                  <Plus size={20} />
                  Available Projects ({availableProjects.length})
                </h3>
              </div>

              {availableProjects.length === 0 ? (
                <div className="empty-state">
                  <Check size={24} />
                  <p>All projects are already assigned</p>
                </div>
              ) : (
                <div className="admin-projects-grid">
                  {availableProjects.map(project => (
                    <div key={project.project_id} className="project-card available">
                      <div className="project-card-header">
                        <FolderKanban size={16} />
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
                          <Plus size={16} />
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
