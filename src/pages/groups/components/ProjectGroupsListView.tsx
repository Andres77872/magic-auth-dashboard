import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, FolderTree, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ErrorState } from '@/components/common/ErrorState';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePager } from '@/components/common/TablePager';
import { Button } from '@/components/ui/button';
import {
  DefaultGroupBadge,
  DeleteGroupDialog,
  GroupFormModal,
  NameCell,
  TimeCell,
  groupRoutes,
} from '@/components/features/groups';
import {
  useProjectGroupMutations,
  useProjectGroups,
} from '@/hooks/useProjectGroups';
import { useToast } from '@/hooks/useToast';
import { formatCount, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import type { GroupFormData, ProjectGroup } from '@/types/group.types';

type Dialog =
  | { type: 'create' }
  | { type: 'edit'; group: ProjectGroup }
  | { type: 'delete'; group: ProjectGroup }
  | null;

export interface ProjectGroupsListViewProps {
  /** Open the create dialog on mount (used by `/groups/project-groups/create`). */
  startWithCreate?: boolean;
  /** Called when that initial create dialog is dismissed without creating. */
  onCreateDismiss?: () => void;
}

/** `/groups?tab=project-groups`: every project group, searchable and sortable on the server. */
export function ProjectGroupsListView({
  startWithCreate = false,
  onCreateDismiss,
}: ProjectGroupsListViewProps): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const list = useProjectGroups();
  const { createProjectGroup, updateProjectGroup, deleteProjectGroup } =
    useProjectGroupMutations();
  const [dialog, setDialog] = useState<Dialog>(
    startWithCreate ? { type: 'create' } : null
  );
  // Set when a create succeeds, so closing the dialog afterwards isn't treated as a dismissal.
  const createdRef = useRef(false);

  const closeForm = (): void => {
    const wasInitialCreate =
      startWithCreate && dialog?.type === 'create' && !createdRef.current;
    setDialog(null);
    if (wasInitialCreate) onCreateDismiss?.();
  };

  const handleCreate = async (data: GroupFormData): Promise<void> => {
    const group = await createProjectGroup(data);
    createdRef.current = true;
    showToast(`Created project group ${group.group_name}.`, 'success');
    void navigate(groupRoutes.projectGroup(group.group_hash), {
      replace: startWithCreate,
    });
  };

  const handleEdit = async (
    group: ProjectGroup,
    data: GroupFormData
  ): Promise<void> => {
    const updated = await updateProjectGroup(group.group_hash, data);
    showToast(`Saved ${updated.group_name}.`, 'success');
    void list.refetch();
  };

  const handleDelete = async (group: ProjectGroup): Promise<void> => {
    await deleteProjectGroup(group.group_hash);
    showToast(`Deleted project group ${group.group_name}.`, 'success');
    setDialog(null);
    if (list.projectGroups.length === 1 && list.offset > 0) {
      list.setOffset(list.offset - list.limit);
    } else {
      void list.refetch();
    }
  };

  const columns: DataViewColumn<ProjectGroup>[] = [
    {
      key: 'group_name',
      header: 'Name',
      sortable: true,
      render: (_value, group) => (
        <NameCell
          to={groupRoutes.projectGroup(group.group_hash)}
          name={group.group_name}
          description={group.description}
          badges={<DefaultGroupBadge kind="project" name={group.group_name} />}
        />
      ),
    },
    {
      key: 'project_count',
      header: 'Projects',
      width: '110px',
      align: 'right',
      render: (_value, group) => (
        <span className="tabular-nums">
          {formatNumber(group.project_count)}
        </span>
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
                  void navigate(groupRoutes.projectGroup(group.group_hash)),
              },
              {
                key: 'edit',
                label: 'Edit',
                icon: <Pencil />,
                onClick: () => setDialog({ type: 'edit', group }),
              },
              {
                key: 'delete',
                label: 'Delete',
                icon: <Trash2 />,
                onClick: () => setDialog({ type: 'delete', group }),
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
      Create project group
    </Button>
  );

  const searching = list.search !== '';

  return (
    <>
      <PageHeader
        title="Project groups"
        subtitle={
          <>
            {list.total !== undefined &&
              !searching &&
              `${formatCount(list.total, 'group')} · `}
            Bundles of projects. Granting one to a{' '}
            <Link
              to={groupRoutes.userGroupList}
              className="text-foreground underline-offset-2 hover:underline"
            >
              user group
            </Link>{' '}
            lets its members sign in to every project inside.
          </>
        }
        actions={createButton('primary')}
      />

      {list.error && list.projectGroups.length === 0 ? (
        <ErrorState
          retryLabel="Try again"
          title="Project groups couldn't be loaded"
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
          <DataView<ProjectGroup>
            data={list.projectGroups}
            columns={columns}
            keyExtractor={(group) => group.group_hash}
            onRowClick={(group) =>
              void navigate(groupRoutes.projectGroup(group.group_hash))
            }
            showSearch
            searchValue={list.searchInput}
            onSearchChange={list.setSearchInput}
            searchPlaceholder="Search project groups by name"
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
                aria-label="Refresh project groups"
              >
                <RefreshCw
                  className={cn(list.isRefreshing && 'animate-spin')}
                  aria-hidden="true"
                />
              </Button>
            }
            isLoading={list.isLoading}
            skeletonRows={6}
            emptyIcon={<FolderTree className="h-8 w-8" />}
            emptyMessage={
              searching
                ? `No project groups match “${list.search}”`
                : 'No project groups yet'
            }
            emptyDescription={
              searching
                ? 'Try another name.'
                : 'Every new project gets its own project group; you can also create shared ones.'
            }
            emptyAction={searching ? undefined : createButton('secondary')}
            caption="Project groups"
          />
          <TablePager
            offset={list.offset}
            limit={list.limit}
            pageCount={list.projectGroups.length}
            total={list.total}
            onOffsetChange={list.setOffset}
            onLimitChange={list.setLimit}
            itemLabel="project groups"
          />
        </>
      )}

      <GroupFormModal
        isOpen={dialog?.type === 'create' || dialog?.type === 'edit'}
        mode={dialog?.type === 'edit' ? 'edit' : 'create'}
        kind="project"
        group={dialog?.type === 'edit' ? dialog.group : null}
        onClose={closeForm}
        onSubmit={(data) =>
          dialog?.type === 'edit'
            ? handleEdit(dialog.group, data)
            : handleCreate(data)
        }
      />

      {dialog?.type === 'delete' && (
        <DeleteGroupDialog
          kind="project"
          groupName={dialog.group.group_name}
          count={dialog.group.project_count}
          onClose={() => setDialog(null)}
          onDelete={() => handleDelete(dialog.group)}
        />
      )}
    </>
  );
}

export default ProjectGroupsListView;
