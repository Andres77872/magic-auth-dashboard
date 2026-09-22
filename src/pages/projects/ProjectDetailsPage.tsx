import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  PageContainer,
  PageHeader,
  LoadingSpinner,
  Button,
  Badge,
  TabNavigation,
  ErrorState,
} from '@/components/common';
import type { Tab } from '@/components/common';
import {
  ProjectOverviewTab,
  ProjectMembersTab,
  ProjectSettingsTab,
  ProjectGroupsTab,
  ProjectPermissionsTab,
} from '@/components/features/projects';
import { ProjectSignInTab } from '@/components/features/oauth';
import {
  FolderKanban,
  LayoutDashboard,
  User,
  Users,
  ShieldCheck,
  Settings,
  KeyRound,
} from 'lucide-react';
import { useProjectDetails, useBackNavigation } from '@/hooks';
import { useSetBreadcrumbLabel } from '@/contexts';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails } from '@/types/project.types';

type TabType = 'overview' | 'members' | 'groups' | 'sign-in' | 'permissions' | 'settings';

const TAB_IDS: TabType[] = [
  'overview',
  'members',
  'groups',
  'sign-in',
  'permissions',
  'settings',
];

export const ProjectDetailsPage: React.FC = () => {
  const { projectHash } = useParams<{ projectHash: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const handleGoBack = useBackNavigation(ROUTES.PROJECTS);
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

  // Show the project name in the breadcrumb leaf once details load.
  useSetBreadcrumbLabel(project?.project_name);

  // Check for tab query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && TAB_IDS.includes(tabParam)) {
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
        <ErrorState
          variant="fullpage"
          title="Couldn't load project"
          message={error || 'This project could not be found.'}
          onRetry={projectHash ? () => void refetch() : undefined}
          isRetrying={isLoading}
        >
          <Button variant="outline" onClick={handleGoBack}>
            Back to Projects
          </Button>
        </ErrorState>
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
      id: 'sign-in',
      label: 'Sign-in',
      icon: <KeyRound size={16} />,
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
            onClick={handleGoBack}
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
        {activeTab === 'sign-in' && (
          <ProjectSignInTab
            projectHash={project.project_hash}
            projectName={project.project_name}
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
