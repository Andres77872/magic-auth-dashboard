import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/types/project.types';
import type { UserType } from '@/types/auth.types';
import { SearchIcon, LoadingIcon, ErrorIcon, HealthIcon } from '@/components/icons';
import '@/styles/components/assign-project-modal.css';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProjects: string[]) => void;
  initialSelection?: string[];
  isLoading?: boolean;
  userName?: string;
  allowMultiple?: boolean;
  userType?: UserType;
}

export function AssignProjectModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  isLoading = false,
  userName = 'user',
  allowMultiple = true,
  userType = 'consumer'
}: AssignProjectModalProps): React.JSX.Element {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(initialSelection);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSelectedProjects(initialSelection);
    }
  }, [isOpen, initialSelection]);

  const fetchProjects = async () => {
    setFetchingProjects(true);
    setError('');
    
    try {
      const response = await projectService.getProjects({
        limit: 100, // Get a reasonable number of projects
      });
      
      if (response && Array.isArray(response.projects)) {
        setProjects(response.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setFetchingProjects(false);
    }
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProjectToggle = (projectHash: string) => {
    setSelectedProjects(prev => {
      if (!allowMultiple) {
        // Single selection mode for consumer users
        return prev.includes(projectHash) ? [] : [projectHash];
      }
      
      // Multiple selection mode for admin users
      if (prev.includes(projectHash)) {
        return prev.filter(hash => hash !== projectHash);
      } else {
        return [...prev, projectHash];
      }
    });
  };

  const handleSelectAll = () => {
    // Only available in multiple selection mode
    if (!allowMultiple) return;
    
    if (selectedProjects.length === filteredProjects.length) {
      // Deselect all filtered projects
      setSelectedProjects(prev => 
        prev.filter(hash => !filteredProjects.some(p => p.project_hash === hash))
      );
    } else {
      // Select all filtered projects
      const allFilteredHashes = filteredProjects.map(p => p.project_hash);
      setSelectedProjects(prev => [
        ...prev.filter(hash => !filteredProjects.some(p => p.project_hash === hash)),
        ...allFilteredHashes
      ]);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedProjects);
  };

  const handleCancel = () => {
    setSelectedProjects(initialSelection);
    setSearchTerm('');
    onClose();
  };

  const selectedCount = selectedProjects.length;
  const allFilteredSelected = filteredProjects.length > 0 && 
    filteredProjects.every(p => selectedProjects.includes(p.project_hash));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Assign ${allowMultiple ? 'Projects' : 'Project'} to ${userName}`}
      size="large"
      className="assign-project-modal"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="assign-project-content">
        {/* Header with selection count */}
        <div className="selection-header">
          <p className="selection-count">
            {allowMultiple ? (
              <>{selectedCount} project{selectedCount !== 1 ? 's' : ''} selected</>
            ) : (
              userType === 'consumer' ? (
                selectedCount > 0 ? 'Project selected' : 'Select a project (required)'
              ) : (
                <>{selectedCount} project{selectedCount !== 1 ? 's' : ''} selected</>
              )
            )}
          </p>
        </div>

        {/* Search and select all */}
        <div className="project-controls">
          <div className="search-section">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<SearchIcon size="small" />}
              disabled={fetchingProjects}
            />
          </div>
          
          {allowMultiple && filteredProjects.length > 0 && (
            <div className="select-all-section">
              <button
                type="button"
                className="select-all-btn"
                onClick={handleSelectAll}
                disabled={fetchingProjects}
              >
                {allFilteredSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Project list */}
        <div className="project-list-container">
          {fetchingProjects ? (
            <div className="loading-state">
              <div className="loading-spinner">
                <LoadingIcon size="large" />
              </div>
              <p>Loading projects...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">
                <ErrorIcon size="large" />
              </div>
              <p>{error}</p>
              <Button
                variant="outline"
                size="small"
                onClick={fetchProjects}
              >
                Retry
              </Button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <HealthIcon size="large" />
              </div>
              <p>
                {searchTerm ? 'No projects match your search.' : 'No projects available.'}
              </p>
            </div>
          ) : (
            <div className="project-list">
              {filteredProjects.map((project) => {
                const isSelected = selectedProjects.includes(project.project_hash);
                
                return (
                  <div
                    key={project.project_hash}
                    className={`project-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleProjectToggle(project.project_hash)}
                  >
                    <div className="project-checkbox">
                      <input
                        type={allowMultiple ? "checkbox" : "radio"}
                        name={allowMultiple ? undefined : "project-selection"}
                        checked={isSelected}
                        onChange={() => handleProjectToggle(project.project_hash)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="project-info">
                      <h4 className="project-name">{project.project_name}</h4>
                      {project.project_description && (
                        <p className="project-description">{project.project_description}</p>
                      )}
                      <div className="project-meta">
                        <span className="project-members">
                          {project.member_count || 0} member{(project.member_count || 0) !== 1 ? 's' : ''}
                        </span>
                        {project.is_active !== undefined && (
                          <span className={`project-status ${project.is_active ? 'active' : 'inactive'}`}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="user-modal-actions">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={fetchingProjects || (userType === 'consumer' && selectedCount === 0)}
          >
            {allowMultiple 
              ? `Assign ${selectedCount} Project${selectedCount !== 1 ? 's' : ''}`
              : selectedCount > 0 ? 'Assign Project' : 'Select a Project'
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AssignProjectModal; 