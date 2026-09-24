import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { FolderKanban, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import {
  ErrorState,
  PageContainer,
  PageHeader,
  TabNavigation,
  type Tab,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectAccessBadge } from '@/components/features/projects/ProjectAccessBadge';
import { ProjectOverviewTab } from '@/components/features/projects/ProjectOverviewTab';
import { ProjectMembersTab } from '@/components/features/projects/ProjectMembersTab';
import { ProjectGroupsTab } from '@/components/features/projects/ProjectGroupsTab';
import { ProjectCatalogPanel } from '@/components/features/projects/ProjectCatalogPanel';
import { ProjectSettingsTab } from '@/components/features/projects/ProjectSettingsTab';
import { ProjectFormModal } from '@/components/features/projects/ProjectFormModal';
import { DeleteProjectDialog } from '@/components/features/projects/DeleteProjectDialog';
import { ProjectSignInTab } from '@/components/features/oauth';
import { useSetBreadcrumbLabel } from '@/contexts';
import { useProjectDetails } from '@/hooks/useProjectDetails';
import { useTabParam } from '@/hooks/useTabParam';
import { useUserType } from '@/hooks/useUserType';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';

const PROJECT_TABS = [
  'overview',
  'members',
  'groups',
  'sign-in',
  'catalog',
  'settings',
] as const;
type ProjectTab = (typeof PROJECT_TABS)[number];
/** `?tab=permissions` is the old name of the catalog tab; keep old links working. */
const TAB_PARAM_VALUES = [...PROJECT_TABS, 'permissions'] as const;
/** Tabs backed by routes that only root and the project's assigned admins may call. */
const MANAGE_ONLY_TABS: readonly ProjectTab[] = [
  'members',
  'groups',
  'sign-in',
  'settings',
];

const TAB_LABELS: Record<ProjectTab, string> = {
  overview: 'Overview',
  members: 'Members',
  groups: 'Groups',
  'sign-in': 'Sign-in',
  catalog: 'Catalog',
  settings: 'Settings',
};

function ProjectDetailsSkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading project">
      <div className="mb-6 flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <Skeleton className="mb-6 h-8 w-full max-w-xl" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  );
}

function ProjectDetailsView({
  projectHash,
}: {
  projectHash: string;
}): React.JSX.Element {
  const navigate = useNavigate();
  const { isRoot } = useUserType();
  const {
    project,
    userAccess,
    projectGroups,
    canManage,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useProjectDetails(projectHash);
  useSetBreadcrumbLabel(project?.project_name);

  const [rawTab, setTab] = useTabParam(TAB_PARAM_VALUES, 'overview');
  const requestedTab: ProjectTab =
    rawTab === 'permissions' ? 'catalog' : rawTab;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <ProjectDetailsSkeleton />
      </PageContainer>
    );
  }

  if (!project || !userAccess) {
    return (
      <PageContainer>
        <ErrorState
          variant="fullpage"
          title="This project could not be loaded"
          message={error ?? 'The project was not found.'}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
        />
      </PageContainer>
    );
  }

  // Viewers who only reach the project through their groups can't call the
  // admin-scoped routes; fall back to the overview deterministically.
  const activeTab: ProjectTab =
    !canManage && MANAGE_ONLY_TABS.includes(requestedTab)
      ? 'overview'
      : requestedTab;
  const tabs: Tab[] = PROJECT_TABS.map((id) => ({
    id,
    label: TAB_LABELS[id],
    disabled: !canManage && MANAGE_ONLY_TABS.includes(id),
  }));
  const refresh = (): Promise<void> => refetch();

  return (
    <PageContainer>
      <PageHeader
        title={project.project_name}
        subtitle={project.project_description || 'No description'}
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
            <FolderKanban className="h-5 w-5" />
          </span>
        }
        badge={<ProjectAccessBadge accessLevel={userAccess.access_level} />}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void refetch()}
              disabled={isRefreshing}
              aria-label="Refresh project"
            >
              <RefreshCw
                className={cn(isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
            </Button>
            {canManage && (
              <>
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </Button>
              </>
            )}
          </>
        }
      >
        <TabNavigation
          tabs={tabs}
          activeTab={activeTab}
          onChange={setTab}
          ariaLabel="Project sections"
        />
      </PageHeader>

      {error && (
        <p className="mb-4 text-xs text-destructive" role="alert">
          The project could not be refreshed: {error}
        </p>
      )}

      <div role="tabpanel" aria-label={TAB_LABELS[activeTab]}>
        {activeTab === 'overview' && (
          <ProjectOverviewTab
            project={project}
            userAccess={userAccess}
            projectGroups={projectGroups}
            canManage={canManage}
            isRoot={isRoot}
          />
        )}
        {activeTab === 'members' && (
          <ProjectMembersTab projectHash={project.project_hash} />
        )}
        {activeTab === 'groups' && (
          <ProjectGroupsTab
            projectHash={project.project_hash}
            projectName={project.project_name}
            projectGroups={projectGroups}
            onProjectGroupsChange={refresh}
          />
        )}
        {activeTab === 'sign-in' && (
          <ProjectSignInTab
            projectHash={project.project_hash}
            projectName={project.project_name}
          />
        )}
        {activeTab === 'catalog' && (
          <ProjectCatalogPanel
            projectHash={project.project_hash}
            projectName={project.project_name}
          />
        )}
        {activeTab === 'settings' && (
          <ProjectSettingsTab
            project={project}
            onUpdated={refresh}
            onDeleteRequest={() => setDeleteOpen(true)}
          />
        )}
      </div>

      {canManage && (
        <>
          <ProjectFormModal
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            project={project}
            onSaved={() => void refetch()}
          />
          <DeleteProjectDialog
            project={project}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            onDeleted={() => void navigate(ROUTES.PROJECTS, { replace: true })}
          />
        </>
      )}
    </PageContainer>
  );
}

/**
 * Project details. The view is keyed by the hash so switching projects never
 * shows the previous project's data while the next one loads.
 */
export function ProjectDetailsPage(): React.JSX.Element {
  const { projectHash } = useParams<{ projectHash: string }>();
  if (!projectHash) return <Navigate to={ROUTES.PROJECTS} replace />;
  return <ProjectDetailsView key={projectHash} projectHash={projectHash} />;
}

export default ProjectDetailsPage;
