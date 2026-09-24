import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, Plus, RefreshCw, Trash2, UsersRound } from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePager } from '@/components/common/TablePager';
import { Button } from '@/components/ui/button';
import {
  AdminGroupBadge,
  DefaultGroupBadge,
  DeleteGroupDialog,
  GroupFormModal,
  NameCell,
  TimeCell,
  groupRoutes,
} from '@/components/features/groups';
import { useGroups, useUserGroupMutations } from '@/hooks/useGroups';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import { formatCount, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { GroupFormData, UserGroup } from '@/types/group.types';

type Dialog =
  | { type: 'create' }
  | { type: 'edit'; group: UserGroup }
  | { type: 'delete'; group: UserGroup }
  | null;

/** `/groups?tab=user-groups`: every user group, searchable and sortable on the server. */
export function UserGroupsListView(): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const list = useGroups();
  const { createGroup, updateGroup, deleteGroup } = useUserGroupMutations();
  const [dialog, setDialog] = useState<Dialog>(null);

  const canManage = (group: UserGroup): boolean =>
    isRoot || !isProjectAdminGroupName(group.group_name);

  const handleCreate = async (data: GroupFormData): Promise<void> => {
    const group = await createGroup(data);
    showToast(`Created user group ${group.group_name}.`, 'success');
    void navigate(groupRoutes.userGroup(group.group_hash));
  };

  const handleEdit = async (
    group: UserGroup,
    data: GroupFormData
  ): Promise<void> => {
    const updated = await updateGroup(group.group_hash, data);
    showToast(`Saved ${updated.group_name}.`, 'success');
    void list.refetch();
  };

  const handleDelete = async (group: UserGroup): Promise<void> => {
    await deleteGroup(group.group_hash);
    showToast(`Deleted user group ${group.group_name}.`, 'success');
    setDialog(null);
    if (list.groups.length === 1 && list.offset > 0) {
      list.setOffset(list.offset - list.limit);
    } else {
      void list.refetch();
    }
  };

  const columns: DataViewColumn<UserGroup>[] = [
    {
      key: 'group_name',
      header: 'Name',
      sortable: true,
      render: (_value, group) => (
        <NameCell
          to={groupRoutes.userGroup(group.group_hash)}
          name={group.group_name}
          description={group.description}
          badges={
            <>
              <DefaultGroupBadge kind="user" name={group.group_name} />
              {!isRoot && (
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
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '140px',
      hideOnMobile: true,
      render: (_value, group) => <TimeCell value={group.created_at} />,
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '72px',
      align: 'right',
      render: (_value, group) => (
        <span data-no-row-click>
          <ActionsMenu
            ariaLabel={`Actions for ${group.group_name}`}
            items={[
              {
                key: 'view',
                label: 'View details',
                icon: <Eye />,
                onClick: () =>
                  void navigate(groupRoutes.userGroup(group.group_hash)),
              },
              {
                key: 'edit',
                label: canManage(group) ? 'Edit' : 'Edit (root only)',
                icon: <Pencil />,
                onClick: () => setDialog({ type: 'edit', group }),
                disabled: !canManage(group),
              },
              {
                key: 'delete',
                label: canManage(group) ? 'Delete' : 'Delete (root only)',
                icon: <Trash2 />,
                onClick: () => setDialog({ type: 'delete', group }),
                disabled: !canManage(group),
                destructive: true,
              },
            ]}
          />
        </span>
      ),
    },
  ];

  const createButton = (
    variant: 'primary' | 'secondary'
  ): React.JSX.Element => (
    <Button
      variant={variant}
      size="md"
      leftIcon={<Plus aria-hidden="true" />}
      onClick={() => setDialog({ type: 'create' })}
    >
      Create user group
    </Button>
  );

  const searching = list.search !== '';

  return (
    <>
      <PageHeader
        title="User groups"
        subtitle={
          <>
            {list.total !== undefined &&
              `${formatCount(list.total, 'group')} · `}
            Members sign in to the projects of the{' '}
            <Link
              to={groupRoutes.projectGroupList}
              className="text-foreground underline-offset-2 hover:underline"
            >
              project groups
            </Link>{' '}
            their group is granted.
          </>
        }
        actions={createButton('primary')}
      />

      {list.error && list.groups.length === 0 ? (
        <ErrorState
          retryLabel="Try again"
          title="User groups couldn't be loaded"
          message={list.error}
          onRetry={() => void list.refetch()}
          isRetrying={list.isRefreshing}
        />
      ) : (
        <>
          {list.error && (
            <p className="mb-2 text-xs text-destructive" role="alert">
              Couldn’t refresh the list: {list.error}
            </p>
          )}
          <DataView<UserGroup>
            data={list.groups}
            columns={columns}
            keyExtractor={(group) => group.group_hash}
            onRowClick={(group) =>
              void navigate(groupRoutes.userGroup(group.group_hash))
            }
            showSearch
            searchValue={list.searchInput}
            onSearchChange={list.setSearchInput}
            searchPlaceholder="Search user groups by name"
            onSort={(key, direction) => {
              if (key === 'group_name' || key === 'created_at')
                list.setSort({ field: key, order: direction });
            }}
            toolbarActions={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void list.refetch()}
                disabled={list.isRefreshing}
                aria-label="Refresh user groups"
              >
                <RefreshCw
                  className={cn(list.isRefreshing && 'animate-spin')}
                  aria-hidden="true"
                />
              </Button>
            }
            isLoading={list.isLoading}
            skeletonRows={6}
            emptyIcon={<UsersRound className="h-8 w-8" />}
            emptyMessage={
              searching
                ? `No user groups match “${list.search}”`
                : 'No user groups yet'
            }
            emptyDescription={
              searching
                ? 'Try another name.'
                : 'Create a group to manage project access for many users at once.'
            }
            emptyAction={searching ? undefined : createButton('secondary')}
            caption="User groups"
          />
          <TablePager
            offset={list.offset}
            limit={list.limit}
            pageCount={list.groups.length}
            total={list.total}
            onOffsetChange={list.setOffset}
            onLimitChange={list.setLimit}
            itemLabel="user groups"
          />
        </>
      )}

      <GroupFormModal
        isOpen={dialog?.type === 'create' || dialog?.type === 'edit'}
        mode={dialog?.type === 'edit' ? 'edit' : 'create'}
        kind="user"
        group={dialog?.type === 'edit' ? dialog.group : null}
        canUseAdminPrefix={isRoot}
        onClose={() => setDialog(null)}
        onSubmit={(data) =>
          dialog?.type === 'edit'
            ? handleEdit(dialog.group, data)
            : handleCreate(data)
        }
      />

      {dialog?.type === 'delete' && (
        <DeleteGroupDialog
          kind="user"
          groupName={dialog.group.group_name}
          count={dialog.group.member_count}
          onClose={() => setDialog(null)}
          onDelete={() => handleDelete(dialog.group)}
        />
      )}
    </>
  );
}

export default UserGroupsListView;
