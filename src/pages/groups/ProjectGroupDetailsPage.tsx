import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Copy,
  FolderKanban,
  FolderTree,
  Pencil,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { TabNavigation, type Tab } from '@/components/common/TabNavigation';
import { Button } from '@/components/ui/button';
import {
  DefaultGroupBadge,
  DeleteGroupDialog,
  GroupFormModal,
  ProjectGroupProjectsTab,
  ProjectGroupUserGroupsTab,
  groupRoutes,
} from '@/components/features/groups';
import { useSetBreadcrumbLabel } from '@/contexts';
import {
  useProjectGroupDetails,
  useProjectGroupMutations,
} from '@/hooks/useProjectGroups';
import { useUserGroupsWithAccess } from '@/hooks/useUserGroupsWithAccess';
import { useTabParam } from '@/hooks/useTabParam';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { formatNumber } from '@/utils/formatters';
import type { GroupFormData } from '@/types/group.types';
import {
  GroupDetailsSkeleton,
  GroupFacts,
  GroupIconTile,
} from './components/GroupDetailParts';

const TABS = ['projects', 'user-groups'] as const;
type ProjectGroupTab = (typeof TABS)[number];

export interface ProjectGroupDetailsPageProps {
  /** Open the edit dialog once the group has loaded (used by `/groups/project-groups/edit/:groupHash`). */
  startEditing?: boolean;
  /** Called when the dialog opened by `startEditing` closes. */
  onEditDismiss?: () => void;
}

/** `/groups/project-groups/:groupHash` — a project group, its projects and the user groups granted it. */
export function ProjectGroupDetailsPage({
  startEditing = false,
  onEditDismiss,
}: ProjectGroupDetailsPageProps = {}): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const [activeTab, setActiveTab] = useTabParam<ProjectGroupTab>(
    TABS,
    'projects'
  );
  const { details, isLoading, isRefreshing, error, refetch } =
    useProjectGroupDetails(groupHash);
  const access = useUserGroupsWithAccess(groupHash);
  const { updateProjectGroup, deleteProjectGroup } = useProjectGroupMutations();
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(
    startEditing ? 'edit' : null
  );

  useSetBreadcrumbLabel(details?.projectGroup.group_name);

  if (!details) {
    return (
      <PageContainer>
        {isLoading || !error ? (
          <GroupDetailsSkeleton statCount={2} />
        ) : (
          <ErrorState
            retryLabel="Try again"
            title="This project group couldn't be loaded"
            message={error}
            onRetry={() => void refetch()}
            isRetrying={isRefreshing}
          />
        )}
      </PageContainer>
    );
  }

  const { projectGroup, projects } = details;

  const closeDialog = (): void => {
    const wasStartEdit = startEditing && dialog === 'edit';
    setDialog(null);
    if (wasStartEdit) onEditDismiss?.();
  };

  const handleEdit = async (data: GroupFormData): Promise<void> => {
    const updated = await updateProjectGroup(projectGroup.group_hash, data);
    showToast(`Saved ${updated.group_name}.`, 'success');
    void refetch();
  };

  const handleDelete = async (): Promise<void> => {
    await deleteProjectGroup(projectGroup.group_hash);
    showToast(`Deleted project group ${projectGroup.group_name}.`, 'success');
    void navigate(groupRoutes.projectGroupList, { replace: true });
  };

  const copyId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(projectGroup.group_hash);
      showToast('Group ID copied.', 'success');
    } catch {
      showToast('The group ID could not be copied.', 'error');
    }
  };

  const tabs: Tab[] = [
    { id: 'projects', label: 'Projects', count: projects.length },
    {
      id: 'user-groups',
      label: 'User groups',
      count: access.isLoading ? undefined : access.userGroups.length,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={projectGroup.group_name}
        icon={
          <GroupIconTile>
            <FolderTree />
          </GroupIconTile>
        }
        badge={
          <DefaultGroupBadge kind="project" name={projectGroup.group_name} />
        }
        subtitle={projectGroup.description || 'No description'}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Pencil aria-hidden="true" />}
              onClick={() => setDialog('edit')}
            >
              Edit
            </Button>
            <ActionsMenu
              ariaLabel="More actions"
              triggerClassName="h-[34px] w-[34px] border border-input bg-card"
              items={[
                {
                  key: 'copy',
                  label: 'Copy group ID',
                  icon: <Copy />,
                  onClick: () => void copyId(),
                },
                {
                  key: 'delete',
                  label: 'Delete project group',
                  icon: <Trash2 />,
                  onClick: () => setDialog('delete'),
                  destructive: true,
                },
              ]}
            />
          </>
        }
      >
        <GroupFacts
          groupHash={projectGroup.group_hash}
          createdAt={projectGroup.created_at}
        />
      </PageHeader>

      <section
        aria-label="Summary"
        className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          title="Projects"
          value={formatNumber(projects.length)}
          icon={<FolderKanban />}
          subValue="Active projects in this group"
          onClick={() => setActiveTab('projects')}
        />
        <StatCard
          title="User groups with access"
          value={
            access.error && access.userGroups.length === 0
              ? '—'
              : formatNumber(access.userGroups.length)
          }
          icon={<UsersRound />}
          loading={access.isLoading}
          subValue={
            access.uncheckedCount > 0
              ? 'Some user groups couldn’t be checked'
              : 'Their members can sign in to these projects'
          }
          onClick={() => setActiveTab('user-groups')}
        />
      </section>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Project group sections"
        className="mb-5"
      />

      <div
        role="tabpanel"
        aria-label={tabs.find((tab) => tab.id === activeTab)?.label}
      >
        {activeTab === 'projects' && (
          <ProjectGroupProjectsTab
            groupHash={projectGroup.group_hash}
            groupName={projectGroup.group_name}
            projects={projects}
            onChange={() => void refetch()}
          />
        )}
        {activeTab === 'user-groups' && (
          <ProjectGroupUserGroupsTab
            projectGroupName={projectGroup.group_name}
            access={access}
            canManageAdminGroups={isRoot}
          />
        )}
      </div>

      <GroupFormModal
        isOpen={dialog === 'edit'}
        mode="edit"
        kind="project"
        group={projectGroup}
        onClose={closeDialog}
        onSubmit={handleEdit}
      />

      {dialog === 'delete' && (
        <DeleteGroupDialog
          kind="project"
          groupName={projectGroup.group_name}
          count={projects.length}
          onClose={() => setDialog(null)}
          onDelete={handleDelete}
        />
      )}
    </PageContainer>
  );
}

export default ProjectGroupDetailsPage;
