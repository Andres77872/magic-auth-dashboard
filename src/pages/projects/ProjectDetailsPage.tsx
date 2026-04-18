import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  PageContainer,
  PageHeader,
  LoadingSpinner,
  Button,
  Badge,
  TabNavigation,
} from '@/components/common';
import type { Tab } from '@/components/common';
import {
  ProjectOverviewTab,
  ProjectMembersTab,
  ProjectSettingsTab,
  ProjectGroupsTab,
  ProjectPermissionsTab,
} from '@/components/features/projects';
import {
  FolderKanban,
  LayoutDashboard,
  User,
  Users,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { useProjectDetails } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails } from '@/types/project.types';

type TabType = 'overview' | 'members' | 'groups' | 'permissions' | 'settings';

export const ProjectDetailsPage: React.FC = () => {
  const { projectHash } = useParams<{ projectHash: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const {
    project,
    userAccess,
    statistics,
    projectGroups,
    isLoading,
    error,
    refetch,
    updateProjectState,
  } = useProjectDetails(projectHash);

  // Check for tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabType;
    if (
      tabParam &&
      ['overview', 'members', 'groups', 'permissions', 'settings'].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!projectHash) {
      navigate(ROUTES.PROJECTS);
    }
  }, [navigate, projectHash]);

  const handleProjectUpdate = (updatedProject: ProjectDetails) => {
    updateProjectState(updatedProject);
  };

  const handleProjectDeleted = () => {
    navigate(ROUTES.PROJECTS, {
      state: { message: 'Project deleted successfully' },
    });
  };

  // Refetch project data when project groups change
  const handleProjectGroupsChange = async () => {
    await refetch();
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16 gap-4" role="main" aria-busy="true">
          <LoadingSpinner aria-label="Loading project details" />
          <p className="text-sm text-muted-foreground" aria-live="polite">Loading project details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !project) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-4 py-8" role="main">
          <p className="text-sm text-destructive" role="alert">
            {error || 'Project not found'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(ROUTES.PROJECTS)}>
              Back to Projects
            </Button>
            {projectHash && (
              <Button variant="primary" onClick={() => void refetch()}>
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
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'members',
      label: 'Members',
      icon: <User size={16} />,
      count: project.member_count,
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: <Users size={16} />,
      count: project.group_count,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: <ShieldCheck size={16} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={project.project_name}
        subtitle={project.project_description || 'No description provided'}
        icon={<FolderKanban size={28} />}
        badge={
          project.is_active !== false ? (
            <Badge variant="success" aria-label="Status: Active">
              Active
            </Badge>
          ) : (
            <Badge variant="warning" aria-label="Status: Inactive">
              Inactive
            </Badge>
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
            projectGroups={projectGroups}
          />
        )}
        {activeTab === 'members' && <ProjectMembersTab project={project} />}
        {activeTab === 'groups' && (
          <ProjectGroupsTab
            project={project}
            projectGroups={projectGroups}
            onProjectGroupsChange={handleProjectGroupsChange}
          />
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
