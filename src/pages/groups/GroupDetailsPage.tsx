import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Copy,
  FolderTree,
  FolderKanban,
  Pencil,
  Trash2,
  Users,
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
  AdminGroupBadge,
  DefaultGroupBadge,
  DeleteGroupDialog,
  GroupFormModal,
  GroupMembersTab,
  GroupPermissionsTab,
  GroupProjectGroupsTab,
  RootOnlyNotice,
  groupRoutes,
} from '@/components/features/groups';
import { useSetBreadcrumbLabel } from '@/contexts';
import { useGroupDetails } from '@/hooks/useGroupDetails';
import { useUserGroupMutations } from '@/hooks/useGroups';
import { useTabParam } from '@/hooks/useTabParam';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import { formatNumber } from '@/utils/formatters';
import type { GroupFormData } from '@/types/group.types';
import {
  GroupDetailsSkeleton,
  GroupFacts,
  GroupIconTile,
} from './components/GroupDetailParts';

const TABS = ['members', 'project-groups', 'permissions'] as const;
type GroupTab = (typeof TABS)[number];

/** `/groups/:groupHash` — a user group, its members, project-group grants and permission groups. */
export function GroupDetailsPage(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const [activeTab, setActiveTab] = useTabParam<GroupTab>(TABS, 'members');
  const { details, isLoading, isRefreshing, error, refetch } =
    useGroupDetails(groupHash);
  const { updateGroup, deleteGroup } = useUserGroupMutations();
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);

  useSetBreadcrumbLabel(details?.group.group_name);

  if (!details) {
    return (
      <PageContainer>
        {isLoading || !error ? (
          <GroupDetailsSkeleton statCount={3} />
        ) : (
          <ErrorState
            retryLabel="Try again"
            title="This user group couldn't be loaded"
            message={error}
            onRetry={() => void refetch()}
            isRetrying={isRefreshing}
          />
        )}
      </PageContainer>
    );
  }

  const { group, statistics } = details;
  const canManage = isRoot || !isProjectAdminGroupName(group.group_name);

  const handleEdit = async (data: GroupFormData): Promise<void> => {
    const updated = await updateGroup(group.group_hash, data);
    showToast(`Saved ${updated.group_name}.`, 'success');
    void refetch();
  };

  const handleDelete = async (): Promise<void> => {
    await deleteGroup(group.group_hash);
    showToast(`Deleted user group ${group.group_name}.`, 'success');
    void navigate(groupRoutes.userGroupList, { replace: true });
  };

  const copyId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(group.group_hash);
      showToast('Group ID copied.', 'success');
    } catch {
      showToast('The group ID could not be copied.', 'error');
    }
  };

  const tabs: Tab[] = [
    { id: 'members', label: 'Members', count: statistics.total_members },
    {
      id: 'project-groups',
      label: 'Project groups',
      count: statistics.total_project_groups,
    },
    { id: 'permissions', label: 'Permission groups' },
  ];
  const refreshCounts = (): void => void refetch();

  return (
    <PageContainer>
      <PageHeader
        title={group.group_name}
        icon={
          <GroupIconTile>
            <UsersRound />
          </GroupIconTile>
        }
        badge={
          <>
            <DefaultGroupBadge kind="user" name={group.group_name} />
            <AdminGroupBadge name={group.group_name} canManage={canManage} />
          </>
        }
        subtitle={group.description || 'No description'}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<Pencil aria-hidden="true" />}
              onClick={() => setDialog('edit')}
              disabled={!canManage}
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
                  label: canManage ? 'Delete user group' : 'Delete (root only)',
                  icon: <Trash2 />,
                  onClick: () => setDialog('delete'),
                  disabled: !canManage,
                  destructive: true,
                },
              ]}
            />
          </>
        }
      >
        <GroupFacts groupHash={group.group_hash} createdAt={group.created_at} />
      </PageHeader>

      {!canManage && <RootOnlyNotice className="mb-5" />}

      <section
        aria-label="Summary"
        className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3"
      >
        <StatCard
          title="Members"
          value={formatNumber(statistics.total_members)}
          icon={<Users />}
          subValue="Active users in this group"
          onClick={() => setActiveTab('members')}
        />
        <StatCard
          title="Project groups"
          value={formatNumber(statistics.total_project_groups)}
          icon={<FolderTree />}
          subValue="Granted to this group"
          onClick={() => setActiveTab('project-groups')}
        />
        <StatCard
          title="Reachable projects"
          value={formatNumber(statistics.total_projects)}
          icon={<FolderKanban />}
          subValue="Active projects in those project groups"
        />
      </section>

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="User group sections"
        className="mb-5"
      />

      <div
        role="tabpanel"
        aria-label={tabs.find((tab) => tab.id === activeTab)?.label}
      >
        {activeTab === 'members' && (
          <GroupMembersTab
            groupHash={group.group_hash}
            groupName={group.group_name}
            canManage={canManage}
            onMembershipChange={refreshCounts}
          />
        )}
        {activeTab === 'project-groups' && (
          <GroupProjectGroupsTab
            groupHash={group.group_hash}
            groupName={group.group_name}
            canManage={canManage}
            onAccessChange={refreshCounts}
          />
        )}
        {activeTab === 'permissions' && (
          <GroupPermissionsTab
            groupHash={group.group_hash}
            groupName={group.group_name}
          />
        )}
      </div>

      <GroupFormModal
        isOpen={dialog === 'edit'}
        mode="edit"
        kind="user"
        group={group}
        canUseAdminPrefix={isRoot}
        onClose={() => setDialog(null)}
        onSubmit={handleEdit}
      />

      {dialog === 'delete' && (
        <DeleteGroupDialog
          kind="user"
          groupName={group.group_name}
          count={statistics.total_members}
          onClose={() => setDialog(null)}
          onDelete={handleDelete}
        />
      )}
    </PageContainer>
  );
}

export default GroupDetailsPage;
