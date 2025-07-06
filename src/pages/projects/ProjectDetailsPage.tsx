import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, LoadingSpinner, Button, Badge } from '@/components/common';
import { ProjectOverviewTab, ProjectMembersTab, ProjectSettingsTab, ProjectGroupsTab } from '@/components/features/projects';
import { projectService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails, ProjectStatistics, UserAccess } from '@/types/project.types';
import '@/styles/pages/ProjectCreatePage.css'; // Reuse existing styles
import '@/styles/pages/ProjectDetailsPage.css'; // Tab-specific styles

type TabType = 'overview' | 'members' | 'groups' | 'settings';

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
    if (tabParam && ['overview', 'members', 'groups', 'settings'].includes(tabParam)) {
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
      <div className="project-create-page">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-create-page">
        <Card>
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Project not found'}</p>
            <div className="form-actions">
              <Button onClick={() => navigate(ROUTES.PROJECTS)}>
                Back to Projects
              </Button>
              {projectHash && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
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
    { id: 'settings' as TabType, label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="project-create-page">
      {successMessage && (
        <div className="success-message">
          <Card>
            <div className="flex items-center gap-2 text-success">
              <span>✅</span>
              <span>{successMessage}</span>
              <Button 
                variant="ghost" 
                size="small" 
                onClick={() => setSuccessMessage(null)}
              >
                ×
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <div className="flex items-center gap-2">
            <h1>{project.project_name}</h1>
            {project.is_active !== false ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="warning">Archived</Badge>
            )}
          </div>
          <p>{project.project_description || 'No description provided'}</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="outline"
            onClick={() => navigate(`${ROUTES.PROJECTS_EDIT}/${projectHash}`)}
          >
            Edit Project
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(ROUTES.PROJECTS)}
          >
            Back to Projects
          </Button>
        </div>
      </div>

      <Card>
        <div className="tab-container">
          <div className="tab-header">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="tab-content">
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