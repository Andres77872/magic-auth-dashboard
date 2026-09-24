import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2Off, Plus, UsersRound } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import type { UseUserGroupsWithAccessReturn } from '@/hooks/useUserGroupsWithAccess';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import { formatCount, formatNumber } from '@/utils/formatters';
import type {
  GroupBatchResult,
  UserGroupWithAccess,
} from '@/types/group.types';
import { AdminGroupBadge, DefaultGroupBadge } from './GroupBadges';
import { GrantUserGroupsModal } from './GrantUserGroupsModal';
import { GroupSectionHeader } from './GroupSectionHeader';
import { NameCell, TimeCell } from './GroupCells';
import { groupRoutes } from './group-routes';

export interface ProjectGroupUserGroupsTabProps {
  projectGroupName: string;
  /** From `useUserGroupsWithAccess` (owned by the page so it can show the count). */
  access: UseUserGroupsWithAccessReturn;
  /** Root may change `admin_…` user groups; others get 403 from the backend. */
  canManageAdminGroups: boolean;
}

/** User groups granted a project group, with grant and revoke. */
export function ProjectGroupUserGroupsTab({
  projectGroupName,
  access,
  canManageAdminGroups,
}: ProjectGroupUserGroupsTabProps): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isGranting, setIsGranting] = useState(false);
  const [toRevoke, setToRevoke] = useState<UserGroupWithAccess | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const canChange = (group: UserGroupWithAccess): boolean =>
    canManageAdminGroups || !isProjectAdminGroupName(group.group_name);

  const handleGranted = (result: GroupBatchResult): void => {
    const granted = result.succeeded.length;
    showToast(
      result.failures.length > 0
        ? `Granted to ${formatNumber(granted)} of ${formatCount(granted + result.failures.length, 'user group')}; ${formatNumber(result.failures.length)} failed.`
        : `Granted ${projectGroupName} to ${formatCount(granted, 'user group')}.`,
      result.failures.length > 0 ? 'warning' : 'success'
    );
    void access.refetch();
  };

  const handleRevoke = async (group: UserGroupWithAccess): Promise<void> => {
    setIsRevoking(true);
    try {
      await access.revoke(group.group_hash);
      showToast(
        `Revoked ${projectGroupName} from ${group.group_name}.`,
        'success'
      );
      setToRevoke(null);
      void access.refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Access could not be revoked.',
        'error'
      );
    } finally {
      setIsRevoking(false);
    }
  };

  const columns: DataViewColumn<UserGroupWithAccess>[] = [
    {
      key: 'group_name',
      header: 'User group',
      render: (_value, group) => (
        <NameCell
          to={groupRoutes.userGroup(group.group_hash)}
          name={group.group_name}
          description={group.description}
          badges={
            <>
              <DefaultGroupBadge kind="user" name={group.group_name} />
              {!canManageAdminGroups && (
                <AdminGroupBadge name={group.group_name} canManage={false} />
              )}
            </>
          }
        />
      ),
    },
    {
      key: 'member_count',
      header: 'Members',
      width: '110px',
      align: 'right',
      render: (_value, group) => (
        <span className="tabular-nums">{formatNumber(group.member_count)}</span>
      ),
    },
    {
      key: 'granted_at',
      header: 'Granted',
      width: '140px',
      hideOnMobile: true,
      render: (_value, group) => <TimeCell value={group.granted_at} />,
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '72px',
      align: 'right',
      render: (_value, group) => (
        <span data-no-row-click>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setToRevoke(group)}
            disabled={!canChange(group)}
            aria-label={`Revoke ${projectGroupName} from ${group.group_name}`}
            title={
              canChange(group)
                ? 'Revoke access'
                : 'Only root users can change admin_ groups'
            }
          >
            <Link2Off aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ];

  const grantButton = (variant: 'primary' | 'secondary'): React.JSX.Element => (
    <Button
      variant={variant}
      size="md"
      leftIcon={<Plus aria-hidden="true" />}
      onClick={() => setIsGranting(true)}
    >
      Grant to user groups
    </Button>
  );

  return (
    <section aria-label="User groups">
      <GroupSectionHeader
        title="User groups with access"
        description="Members of these user groups can sign in to every project in this project group."
        actions={grantButton('primary')}
      />

      {access.uncheckedCount > 0 && (
        <p className="mb-2 text-xs text-warning" role="status">
          {formatCount(access.uncheckedCount, 'user group')} couldn’t be
          checked, so this list may be incomplete.{' '}
          <button
            type="button"
            className="rounded-sm font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => void access.refetch()}
          >
            Check again
          </button>
        </p>
      )}

      {access.error && access.userGroups.length === 0 && !access.isLoading ? (
        <ErrorState
          retryLabel="Try again"
          title="User groups couldn't be loaded"
          message={access.error}
          onRetry={() => void access.refetch()}
          isRetrying={access.isRefreshing}
          variant="inline"
          size="sm"
        />
      ) : (
        <DataView<UserGroupWithAccess>
          data={access.userGroups}
          columns={columns}
          keyExtractor={(group) => group.group_hash}
          onRowClick={(group) =>
            void navigate(groupRoutes.userGroup(group.group_hash))
          }
          isLoading={access.isLoading}
          skeletonRows={3}
          emptyIcon={<UsersRound className="h-8 w-8" />}
          emptyMessage="No user groups have access"
          emptyDescription="Grant this project group to user groups so their members can sign in to its projects."
          emptyAction={grantButton('secondary')}
          caption={`User groups granted ${projectGroupName}`}
        />
      )}

      {isGranting && (
        <GrantUserGroupsModal
          projectGroupName={projectGroupName}
          grantedHashes={access.userGroups.map((group) => group.group_hash)}
          canManageAdminGroups={canManageAdminGroups}
          onClose={() => setIsGranting(false)}
          onGrant={access.grant}
          onGranted={handleGranted}
        />
      )}

      <ConfirmDialog
        isOpen={toRevoke !== null}
        onClose={() => setToRevoke(null)}
        onConfirm={() => {
          if (toRevoke) void handleRevoke(toRevoke);
        }}
        title="Revoke access"
        message={
          toRevoke ? (
            <>
              Members of{' '}
              <strong className="text-foreground">{toRevoke.group_name}</strong>{' '}
              lose access to the projects in {projectGroupName} unless another
              grant covers them. Their sessions for those projects are signed
              out.
            </>
          ) : (
            ''
          )
        }
        confirmText="Revoke access"
        variant="danger"
        isLoading={isRevoking}
      />
    </section>
  );
}

export default ProjectGroupUserGroupsTab;
