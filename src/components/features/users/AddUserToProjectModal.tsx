import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/common';
import { groupService, projectService } from '@/services';
import type { UserGroup } from '@/types/group.types';
import type { ProjectDetails } from '@/types/project.types';
import { SearchIcon, LoadingIcon, HealthIcon } from '@/components/icons';
import '@/styles/components/assign-project-modal.css';

interface AddUserToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userHash: string;
  userName?: string;
}

export function AddUserToProjectModal({
  isOpen,
  onClose,
  onSuccess,
  userHash,
  userName = 'user'
}: AddUserToProjectModalProps): React.JSX.Element {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchGroupTerm, setSearchGroupTerm] = useState('');
  const [searchProjectTerm, setSearchProjectTerm] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'group' | 'project'>('group');

  // Fetch groups when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setStep('group');
      setSelectedGroup('');
      setSelectedProject('');
      setError('');
    }
  }, [isOpen]);

  // Fetch projects when group is selected
  useEffect(() => {
    if (selectedGroup && step === 'project') {
      fetchProjects();
    }
  }, [selectedGroup, step]);

  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    setError('');

    try {
      const response = await groupService.getGroups({ limit: 100 });
      if (response.success && Array.isArray(response.user_groups)) {
        setGroups(response.user_groups);
      } else {
        setError('Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load user groups');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    setError('');

    try {
      const response = await projectService.getProjects({ limit: 100 });
      if (response && Array.isArray(response.projects)) {
        setProjects(response.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchGroupTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchGroupTerm.toLowerCase())
  );

  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchProjectTerm.toLowerCase()) ||
    (project.project_description || '').toLowerCase().includes(searchProjectTerm.toLowerCase())
  );

  const handleGroupNext = () => {
    if (selectedGroup) {
      setStep('project');
    }
  };

  const handleBack = () => {
    setStep('group');
    setSelectedProject('');
  };

  const handleAdd = async () => {
    if (!selectedGroup || !selectedProject) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Step 1: Add user to group
      await groupService.addMemberToGroup(selectedGroup, { user_hash: userHash });

      // Step 2: Grant group access to project
      await groupService.grantGroupProjectAccess(selectedGroup, selectedProject);

      onSuccess();
      handleCancel();
    } catch (err) {
      console.error('Error adding user to project:', err);
      setError(err instanceof Error ? err.message : 'Failed to add user to project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedGroup('');
    setSelectedProject('');
    setSearchGroupTerm('');
    setSearchProjectTerm('');
    setStep('group');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Add ${userName} to Project via Group`}
      size="lg"
      className="assign-project-modal"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="assign-project-content">
        {/* Step indicator */}
        <div className="selection-header">
          <p className="selection-count">
            Step {step === 'group' ? '1' : '2'} of 2: 
            {step === 'group' ? ' Select a user group' : ' Select a project'}
          </p>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', color: '#c00', borderRadius: '0.25rem' }}>
            {error}
          </div>
        )}

        {/* Group Selection */}
        {step === 'group' && (
          <>
            <div className="project-controls">
              <div className="search-section">
                <Input
                  placeholder="Search groups..."
                  value={searchGroupTerm}
                  onChange={(e) => setSearchGroupTerm(e.target.value)}
                  leftIcon={<SearchIcon size={16} />}
                  disabled={isLoadingGroups}
                />
              </div>
            </div>

            <div className="project-list-container">
              {isLoadingGroups ? (
                <div className="loading-state">
                  <div className="loading-spinner">
                    <LoadingIcon size={24} />
                  </div>
                  <p>Loading groups...</p>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <HealthIcon size={24} />
                  </div>
                  <p>{searchGroupTerm ? 'No groups match your search.' : 'No user groups available.'}</p>
                </div>
              ) : (
                <div className="project-list">
                  {filteredGroups.map(group => {
                    const isSelected = selectedGroup === group.group_hash;
                    return (
                      <div
                        key={group.group_hash}
                        className={`project-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedGroup(group.group_hash)}
                      >
                        <div className="project-checkbox">
                          <input
                            type="radio"
                            name="group-selection"
                            checked={isSelected}
                            onChange={() => setSelectedGroup(group.group_hash)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="project-info">
                          <h4 className="project-name">{group.group_name}</h4>
                          {group.description && <p className="project-description">{group.description}</p>}
                          <div className="project-meta">
                            <span className="project-members">{group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Project Selection */}
        {step === 'project' && (
          <>
            <div className="project-controls">
              <div className="search-section">
                <Input
                  placeholder="Search projects..."
                  value={searchProjectTerm}
                  onChange={(e) => setSearchProjectTerm(e.target.value)}
                  leftIcon={<SearchIcon size={16} />}
                  disabled={isLoadingProjects}
                />
              </div>
            </div>

            <div className="project-list-container">
              {isLoadingProjects ? (
                <div className="loading-state">
                  <div className="loading-spinner">
                    <LoadingIcon size={24} />
                  </div>
                  <p>Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <HealthIcon size={24} />
                  </div>
                  <p>{searchProjectTerm ? 'No projects match your search.' : 'No projects available.'}</p>
                </div>
              ) : (
                <div className="project-list">
                  {filteredProjects.map(project => {
                    const isSelected = selectedProject === project.project_hash;
                    return (
                      <div
                        key={project.project_hash}
                        className={`project-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedProject(project.project_hash)}
                      >
                        <div className="project-checkbox">
                          <input
                            type="radio"
                            name="project-selection"
                            checked={isSelected}
                            onChange={() => setSelectedProject(project.project_hash)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="project-info">
                          <h4 className="project-name">{project.project_name}</h4>
                          {project.project_description && <p className="project-description">{project.project_description}</p>}
                          <div className="project-meta">
                            <span className="project-members">{project.member_count || 0} member{(project.member_count || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal actions */}
        <div className="user-modal-actions">
          {step === 'project' && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          {step === 'group' ? (
            <Button
              variant="primary"
              onClick={handleGroupNext}
              disabled={isLoadingGroups || !selectedGroup}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleAdd}
              loading={isSubmitting}
              disabled={isLoadingProjects || !selectedProject}
            >
              Add to Project
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default AddUserToProjectModal;
