import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { projectService } from '@/services';
import type { ProjectDetails } from '@/types/project.types';

interface AssignProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedProjects: string[]) => void;
  initialSelection?: string[];
  isLoading?: boolean;
  userName?: string;
}

export function AssignProjectModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  isLoading = false,
  userName = 'user'
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
      if (prev.includes(projectHash)) {
        return prev.filter(hash => hash !== projectHash);
      } else {
        return [...prev, projectHash];
      }
    });
  };

  const handleSelectAll = () => {
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
      title={`Assign Projects to ${userName}`}
      size="large"
      className="assign-project-modal"
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="assign-project-content">
        {/* Header with selection count */}
        <div className="selection-header">
          <p className="selection-count">
            {selectedCount} project{selectedCount !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Search and select all */}
        <div className="project-controls">
          <div className="search-section">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              }
              disabled={fetchingProjects}
            />
          </div>
          
          {filteredProjects.length > 0 && (
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5c0-1.66 4.03-3 9-3s9 1.34 9 3"/>
                  <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
                </svg>
              </div>
              <p>Loading projects...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
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
                        type="checkbox"
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
        <div className="modal-actions">
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
            disabled={fetchingProjects}
          >
            Assign {selectedCount} Project{selectedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AssignProjectModal; 