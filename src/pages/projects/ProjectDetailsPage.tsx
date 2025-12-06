import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  PageContainer,
  PageHeader,
  LoadingSpinner, 
  Button, 
  Badge,
  TabNavigation
} from '@/components/common';
import type { Tab } from '@/components/common';
import { ProjectOverviewTab, ProjectMembersTab, ProjectSettingsTab, ProjectGroupsTab, ProjectPermissionsTab } from '@/components/features/projects';
import { 
  ProjectIcon,
  DashboardIcon,
  UserIcon,
  GroupIcon,
  SecurityIcon,
  SettingsIcon
} from '@/components/icons';
import { projectService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails, ProjectStatistics, UserAccess } from '@/types/project.types';
import '@/styles/pages/ProjectDetailsPage.css';

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

  // Check for tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['overview', 'members', 'groups', 'permissions', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

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
  };

  const handleProjectDeleted = () => {
    navigate(ROUTES.PROJECTS, {
      state: { message: 'Project deleted successfully' }
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="project-details-loading" role="main" aria-busy="true">
          <LoadingSpinner aria-label="Loading project details" />
          <p aria-live="polite">Loading project details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <div className="project-details-error" role="main">
          <p className="text-error" role="alert">{error || 'Project not found'}</p>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate(ROUTES.PROJECTS)}
            >
              Back to Projects
            </Button>
            {projectHash && (
              <Button 
                variant="primary"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    );
  }

  const tabs: Tab[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <DashboardIcon size={16} />,
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: <UserIcon size={16} />,
      count: project.member_count,
    },
    { 
      id: 'groups', 
      label: 'Groups', 
      icon: <GroupIcon size={16} />,
      count: project.group_count,
    },
    { 
      id: 'permissions', 
      label: 'Permissions', 
      icon: <SecurityIcon size={16} />,
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: <SettingsIcon size={16} />,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={project.project_name}
        subtitle={project.project_description || 'No description provided'}
        icon={<ProjectIcon size={28} />}
        badge={
          project.is_active !== false ? (
            <Badge variant="success" aria-label="Status: Active">Active</Badge>
          ) : (
            <Badge variant="warning" aria-label="Status: Archived">Archived</Badge>
          )
        }
        actions={
          <Button 
            variant="outline"
            size="md"
            onClick={() => navigate(ROUTES.PROJECTS)}
            aria-label="Return to projects list"
          >
            Back to Projects
          </Button>
        }
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabType)}
        contained
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
      </TabNavigation>
    </PageContainer>
  );
}; 