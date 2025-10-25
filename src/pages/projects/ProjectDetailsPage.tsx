import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, LoadingSpinner, Button, Badge } from '@/components/common';
import { ProjectOverviewTab, ProjectMembersTab, ProjectSettingsTab, ProjectGroupsTab, ProjectPermissionsTab } from '@/components/features/projects';
import { projectService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails, ProjectStatistics, UserAccess } from '@/types/project.types';
import '@/styles/pages/ProjectCreatePage.css'; // Reuse existing styles
import '@/styles/pages/ProjectDetailsPage.css'; // Tab-specific styles

type TabType = 'overview' | 'members' | 'groups' | 'permissions' | 'settings';

export const ProjectDetailsPage: React.FC = () => {
  const { projectHash } = useParams<{ projectHash: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['overview', 'members', 'groups', 'permissions', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!projectHash) {
      navigate(ROUTES.PROJECTS);
      return;
    }

    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await projectService.getProject(projectHash);
        if (response.success && response.project) {
          // Convert API response to ProjectDetails format
          const projectDetails: ProjectDetails = {
            ...response.project,
            member_count: response.statistics.total_users,
            group_count: response.statistics.total_groups,
            access_level: response.user_access.access_level,
            is_active: true, // Default to active unless specified otherwise
          };
          setProject(projectDetails);
          setUserAccess(response.user_access);
          setStatistics(response.statistics);
        } else {
          setError('Failed to load project data');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectHash, navigate]);

  const handleProjectUpdate = (updatedProject: ProjectDetails) => {
    setProject(updatedProject);
    setSuccessMessage('Project updated successfully');
  };

  const handleProjectDeleted = () => {
    navigate(ROUTES.PROJECTS, {
      state: { message: 'Project deleted successfully' }
    });
  };

  if (isLoading) {
    return (
      <div className="project-create-page" role="main" aria-busy="true">
        <div className="loading-container">
          <LoadingSpinner aria-label="Loading project details" />
          <p aria-live="polite">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-create-page" role="main" aria-labelledby="error-title">
        <Card>
          <div className="error-container">
            <h2 id="error-title" className="text-error">Error</h2>
            <p role="alert" className="text-secondary">{error || 'Project not found'}</p>
            <div className="form-actions">
              <Button 
                onClick={() => navigate(ROUTES.PROJECTS)}
                aria-label="Return to projects list"
              >
                Back to Projects
              </Button>
              {projectHash && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  aria-label="Retry loading project"
                >
                  Retry
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'members' as TabType, label: 'Members', icon: '👥' },
    { id: 'groups' as TabType, label: 'Groups', icon: '🏷️' },
    { id: 'permissions' as TabType, label: 'Permissions', icon: '🔐' },
    { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="project-create-page" role="main" aria-labelledby="project-title">
      {successMessage && (
        <div className="success-message" role="status" aria-live="polite">
          <Card>
            <div className="flex items-center gap-2 text-success">
              <span aria-hidden="true">✅</span>
              <span>{successMessage}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSuccessMessage(null)}
                aria-label="Dismiss success message"
              >
                ×
              </Button>
            </div>
          </Card>
        </div>
      )}

      <header className="page-header">
        <div className="header-content">
          <div className="flex items-center gap-2">
            <h1 id="project-title">{project.project_name}</h1>
            {project.is_active !== false ? (
              <Badge variant="success" aria-label="Status: Active">Active</Badge>
            ) : (
              <Badge variant="warning" aria-label="Status: Archived">Archived</Badge>
            )}
          </div>
          <p className="text-secondary">{project.project_description || 'No description provided'}</p>
        </div>
        <nav className="header-actions" aria-label="Project actions">
          <Button 
            variant="outline"
            onClick={() => navigate(`${ROUTES.PROJECTS_EDIT}/${projectHash}`)}
            aria-label="Edit project details"
          >
            Edit Project
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS)}
            aria-label="Return to projects list"
          >
            Back to Projects
          </Button>
        </nav>
      </header>

      <Card>
        <div className="tab-container">
          <div className="tab-header" role="tablist" aria-label="Project sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div 
            className="tab-content" 
            role="tabpanel" 
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'overview' && (
              <ProjectOverviewTab 
                project={project} 
                userAccess={userAccess}
                statistics={statistics}
              />
            )}
            {activeTab === 'members' && (
              <ProjectMembersTab project={project} />
            )}
            {activeTab === 'groups' && (
              <ProjectGroupsTab project={project} />
            )}
            {activeTab === 'permissions' && (
              <ProjectPermissionsTab project={project} />
            )}
            {activeTab === 'settings' && (
              <ProjectSettingsTab 
                project={project} 
                onProjectUpdate={handleProjectUpdate}
                onProjectDeleted={handleProjectDeleted}
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}; 