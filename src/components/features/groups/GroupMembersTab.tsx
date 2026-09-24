import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserMinus, Users } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { TablePager } from '@/components/common/TablePager';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { useUsersByGroup } from '@/hooks/useUsersByGroup';
import { useGroupMemberActions } from '@/hooks/useGroupMemberActions';
import { useToast } from '@/hooks/useToast';
import { formatCount, formatNumber, pluralize } from '@/utils/formatters';
import type { BulkAddMembersResult, GroupMember } from '@/types/group.types';
import { AddMembersModal } from './AddMembersModal';
import { GroupSectionHeader } from './GroupSectionHeader';
import { NameCell, TimeCell } from './GroupCells';
import { groupRoutes } from './group-routes';

export interface GroupMembersTabProps {
  groupHash: string;
  groupName: string;
  /** False for non-root operators on `admin_…` groups (the backend would answer 403). */
  canManage: boolean;
  /** Called after membership changed, so the page can refresh its counts. */
  onMembershipChange?: () => void;
}

/** Members of a user group: paginated list, add (single or bulk) and remove. */
export function GroupMembersTab({
  groupHash,
  groupName,
  canManage,
  onMembershipChange,
}: GroupMembersTabProps): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const list = useUsersByGroup(groupHash);
  const { removeMember } = useGroupMemberActions(groupHash);
  const [isAdding, setIsAdding] = useState(false);
  const [toRemove, setToRemove] = useState<GroupMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAdded = (result: BulkAddMembersResult): void => {
    if (result.failed > 0) {
      showToast(
        `Added ${formatNumber(result.succeeded)} of ${formatCount(result.requested, 'user')} to ${groupName}; ${formatNumber(result.failed)} could not be added.`,
        'warning'
      );
    } else {
      showToast(
        `Added ${formatCount(result.succeeded, 'member')} to ${groupName}.`,
        'success'
      );
    }
    void list.refetch();
    onMembershipChange?.();
  };

  const handleRemove = async (member: GroupMember): Promise<void> => {
    setIsRemoving(true);
    try {
      await removeMember(member.user_hash);
      showToast(`Removed ${member.username} from ${groupName}.`, 'success');
      setToRemove(null);
      if (list.members.length === 1 && list.offset > 0) {
        list.setOffset(list.offset - list.limit);
      } else {
        void list.refetch();
      }
      onMembershipChange?.();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'The member could not be removed.',
        'error'
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const columns: DataViewColumn<GroupMember>[] = [
    {
      key: 'username',
      header: 'User',
      render: (_value, member) => (
        <NameCell
          to={groupRoutes.user(member.user_hash)}
          name={member.username}
          description={member.email}
          leading={<UserAvatar username={member.username} size="sm" />}
        />
      ),
    },
    {
      key: 'user_type',
      header: 'Type',
      width: '120px',
      render: (_value, member) => <UserTypeBadge userType={member.user_type} />,
    },
    {
      key: 'joined_at',
      header: 'Joined',
      width: '140px',
      hideOnMobile: true,
      render: (_value, member) => <TimeCell value={member.joined_at} />,
    },
    {
      key: 'user_hash',
      header: 'Actions',
      width: '72px',
      align: 'right',
      render: (_value, member) => (
        <span data-no-row-click>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setToRemove(member)}
            disabled={!canManage}
            aria-label={`Remove ${member.username} from ${groupName}`}
            title={
              canManage
                ? 'Remove from group'
                : 'Only root users can change this group'
            }
          >
            <UserMinus aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ];

  const addButton = (variant: 'primary' | 'secondary'): React.JSX.Element => (
    <Button
      variant={variant}
      size="md"
      leftIcon={<Plus aria-hidden="true" />}
      onClick={() => setIsAdding(true)}
      disabled={!canManage}
    >
      Add members
    </Button>
  );

  return (
    <section aria-label="Members">
      <GroupSectionHeader
        title="Members"
        description="Members can sign in to every project this group reaches through its project groups."
        actions={addButton('primary')}
      />

      {list.error && list.total === undefined ? (
        <ErrorState
          retryLabel="Try again"
          title="Members couldn't be loaded"
          message={list.error}
          onRetry={() => void list.refetch()}
          isRetrying={list.isRefreshing}
          variant="inline"
          size="sm"
        />
      ) : (
        <>
          {list.error && (
            <p className="mb-2 text-xs text-destructive" role="alert">
              Couldn't refresh members: {list.error}
            </p>
          )}
          <DataView<GroupMember>
            data={list.members}
            columns={columns}
            keyExtractor={(member) => member.user_hash}
            onRowClick={(member) =>
              void navigate(groupRoutes.user(member.user_hash))
            }
            isLoading={list.isLoading}
            skeletonRows={4}
            emptyIcon={<Users className="h-8 w-8" />}
            emptyMessage="No members yet"
            emptyDescription={
              canManage
                ? 'Add users to give them access to this group’s projects.'
                : undefined
            }
            emptyAction={canManage ? addButton('secondary') : undefined}
            caption={`Members of ${groupName}`}
          />
          <TablePager
            offset={list.offset}
            limit={list.limit}
            pageCount={list.members.length}
            total={list.total}
            onOffsetChange={list.setOffset}
            onLimitChange={list.setLimit}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel={pluralize(list.total ?? 0, 'member')}
          />
        </>
      )}

      {isAdding && (
        <AddMembersModal
          groupHash={groupHash}
          groupName={groupName}
          knownMemberHashes={list.members.map((member) => member.user_hash)}
          onClose={() => setIsAdding(false)}
          onAdded={handleAdded}
        />
      )}

      <ConfirmDialog
        isOpen={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) void handleRemove(toRemove);
        }}
        title="Remove member"
        message={
          toRemove ? (
            <>
              <strong className="text-foreground">{toRemove.username}</strong>{' '}
              loses access to the projects {groupName} reaches, unless another
              group grants it. Their current project sessions stop working on
              the next request.
            </>
          ) : (
            ''
          )
        }
        confirmText="Remove member"
        variant="danger"
        isLoading={isRemoving}
      />
    </section>
  );
}

export default GroupMembersTab;
