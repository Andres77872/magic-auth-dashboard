import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  FolderTree,
  HelpCircle,
  Plus,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common';
import { Panel } from '@/components/common/Panel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TablePager } from '@/components/common/TablePager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useProjectGroupMembership,
  useProjectUserGroups,
} from '@/hooks/useProjectDetails';
import {
  useProjectWorkflow,
  type WorkflowStep,
} from '@/hooks/useProjectWorkflow';
import { useToast } from '@/hooks/useToast';
import { getDefaultGroupRole } from '@/utils/default-groups';
import { formatDate, formatNumber } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type { ProjectGroupInfo } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';
import { AddToProjectGroupsDialog } from './AddToProjectGroupsDialog';

interface ProjectGroupsTabProps {
  projectHash: string;
  projectName: string;
  projectGroups: ProjectGroupInfo[];
  /** Reload the project details (its project groups) after a change. */
  onProjectGroupsChange: () => Promise<void>;
}

const PAGE_SIZE = 25;

function StepIcon({ step }: { step: WorkflowStep }): React.JSX.Element {
  if (step.status === 'complete')
    return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />;
  if (step.status === 'unknown')
    return <HelpCircle className="h-4 w-4 text-warning" aria-hidden="true" />;
  return (
    <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  );
}

const STEP_STATUS_LABEL = {
  complete: 'Done',
  incomplete: 'To do',
  unknown: 'Unknown',
} as const;

/**
 * Where the project sits in USER → USER_GROUP → PROJECT_GROUP → PROJECT: the
 * project groups that contain it (editable) and the user groups those
 * project groups are granted to (read-only here; grants live on user groups).
 */
export function ProjectGroupsTab({
  projectHash,
  projectName,
  projectGroups,
  onProjectGroupsChange,
}: ProjectGroupsTabProps): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const userGroups = useProjectUserGroups(projectHash);
  const membership = useProjectGroupMembership(projectHash);
  const workflow = useProjectWorkflow({
    projectGroups,
    userGroups: userGroups.userGroups,
    userGroupsUnavailable:
      Boolean(userGroups.error) && userGroups.userGroups.length === 0,
  });
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ProjectGroupInfo | null>(null);
  const [offset, setOffset] = useState(0);

  const refreshAll = async (): Promise<void> => {
    await Promise.all([onProjectGroupsChange(), userGroups.refetch()]);
  };

  const handleAdd = async (groupHashes: string[]): Promise<void> => {
    const result = await membership.addToProjectGroups(groupHashes);
    if (result.added.length > 0) {
      showToast(
        `Added to ${result.added.length} project group${result.added.length === 1 ? '' : 's'}.`,
        result.failed.length > 0 ? 'warning' : 'success'
      );
      await refreshAll();
    }
    if (result.failed.length > 0) {
      showToast(
        result.failed.map((failure) => failure.message).join(' '),
        'error'
      );
      throw new Error('Some project groups could not be updated.');
    }
    setAdding(false);
  };

  const confirmRemove = async (): Promise<void> => {
    if (!removing) return;
    try {
      await membership.removeFromProjectGroup(removing.group_hash);
      showToast(`Removed from ${removing.group_name}.`, 'success');
      setRemoving(null);
      await refreshAll();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The project could not be removed from the group.',
        'error'
      );
    }
  };

  const columns = useMemo<DataViewColumn<UserGroup>[]>(
    () => [
      {
        key: 'group_name',
        header: 'User group',
        render: (_value, group) => {
          const role = getDefaultGroupRole(group.group_name);
          return (
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  to={`${ROUTES.GROUPS}/${encodeURIComponent(group.group_hash)}`}
                  onClick={(event) => event.stopPropagation()}
                  className="truncate text-[13px] font-medium text-foreground no-underline hover:underline"
                >
                  {group.group_name}
                </Link>
                {role && (
                  <Badge
                    variant={role === 'admin' ? 'info' : 'secondary'}
                    size="sm"
                    title="Named like the groups api.auth creates with a project"
                  >
                    {role === 'admin' ? 'Admin group' : 'Default'}
                  </Badge>
                )}
              </div>
              <span className="block truncate text-xs text-muted-foreground">
                {group.description || 'No description'}
              </span>
            </div>
          );
        },
      },
      {
        key: 'member_count',
        header: 'Members',
        width: '110px',
        align: 'right',
        render: (_value, group) => (
          <span className="font-mono text-xs tabular-nums text-foreground">
            {formatNumber(group.member_count)}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: 'Created',
        width: '120px',
        hideOnMobile: true,
        render: (_value, group) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(group.created_at)}
          </span>
        ),
      },
    ],
    []
  );

  const pageRows = userGroups.userGroups.slice(offset, offset + PAGE_SIZE);
  const isDefaultProjectGroup = removing
    ? removing.group_name.trim().toLowerCase().startsWith('default_')
    : false;

  return (
    <div className="space-y-6">
      <Panel
        title="Access chain"
        description="Users reach a project through a user group that is granted a project group containing it."
        padding="none"
      >
        <ol className="m-0 grid list-none grid-cols-1 divide-y divide-border p-0 md:grid-cols-3 md:divide-x md:divide-y-0">
          {workflow.steps.map((step) => (
            <li key={step.id} className="flex gap-3 px-5 py-4">
              <span className="mt-0.5">
                <StepIcon step={step} />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="m-0 text-[13px] font-medium text-foreground">
                  {step.label}
                  <span className="sr-only">
                    {' '}
                    ({STEP_STATUS_LABEL[step.status]})
                  </span>
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  {step.description}
                </p>
                {step.cta && (
                  <Button
                    variant="link"
                    size="xs"
                    className="h-auto px-0"
                    onClick={() => {
                      const cta = step.cta;
                      if (!cta) return;
                      if (cta.action === 'add-to-project-group')
                        setAdding(true);
                      else void navigate(cta.target);
                    }}
                  >
                    {step.cta.label}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel
        title="Project groups"
        description="Groups of projects this project belongs to."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" />
            Add to project group
          </Button>
        }
        padding="none"
      >
        {projectGroups.length === 0 ? (
          <EmptyState
            icon={<FolderTree />}
            title="Not in any project group"
            description="Add the project to a project group, then grant that group to user groups."
            size="sm"
          />
        ) : (
          <ul className="m-0 list-none divide-y divide-border p-0">
            {projectGroups.map((group) => (
              <li
                key={group.group_hash}
                className="flex items-center gap-3 px-5 py-2.5"
              >
                <FolderTree
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`${ROUTES.PROJECT_GROUPS}/${encodeURIComponent(group.group_hash)}`}
                    className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
                  >
                    {group.group_name}
                  </Link>
                  {group.description && (
                    <p className="m-0 truncate text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRemoving(group)}
                  disabled={membership.pending === group.group_hash}
                  aria-label={`Remove from ${group.group_name}`}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        title="User groups with access"
        description={
          userGroups.isLoading
            ? 'Granted one of the project groups above. Manage grants and members on each user group.'
            : `${formatNumber(userGroups.total)} granted one of the project groups above. Manage grants and members on each user group.`
        }
        padding="none"
      >
        {userGroups.error && userGroups.userGroups.length === 0 ? (
          <div
            className="flex flex-col items-center gap-3 px-5 py-8 text-center"
            role="alert"
          >
            <p className="m-0 text-[13px] text-muted-foreground">
              User groups could not be loaded. {userGroups.error}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void userGroups.refetch()}
              disabled={userGroups.isRefreshing}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'px-5 pb-3 transition-opacity',
              userGroups.isRefreshing && 'opacity-70'
            )}
          >
            <DataView<UserGroup>
              data={pageRows}
              columns={columns}
              keyExtractor={(group) => group.group_hash}
              onRowClick={(group) =>
                void navigate(
                  `${ROUTES.GROUPS}/${encodeURIComponent(group.group_hash)}`
                )
              }
              isLoading={userGroups.isLoading}
              skeletonRows={4}
              emptyIcon={<UsersRound className="h-8 w-8" />}
              emptyMessage="No user group can reach this project"
              emptyDescription={
                projectGroups.length === 0
                  ? 'Add the project to a project group first.'
                  : 'Grant one of the project groups above to a user group.'
              }
              emptyAction={
                projectGroups.length > 0 ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link to={ROUTES.GROUPS}>Open user groups</Link>
                  </Button>
                ) : undefined
              }
              caption="User groups with access"
            />
            {userGroups.userGroups.length > PAGE_SIZE && (
              <TablePager
                offset={offset}
                limit={PAGE_SIZE}
                pageCount={pageRows.length}
                total={userGroups.userGroups.length}
                onOffsetChange={setOffset}
                itemLabel="user groups"
              />
            )}
            {userGroups.total > userGroups.userGroups.length && (
              <p className="m-0 pt-2 text-xs text-muted-foreground">
                Showing the first {formatNumber(userGroups.userGroups.length)}{' '}
                of {formatNumber(userGroups.total)}.
              </p>
            )}
          </div>
        )}
      </Panel>

      <AddToProjectGroupsDialog
        open={adding}
        onOpenChange={setAdding}
        projectName={projectName}
        assignedGroupHashes={projectGroups.map((group) => group.group_hash)}
        onAdd={handleAdd}
        isAdding={membership.pending === 'bulk'}
      />

      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
        variant="warning"
        title="Remove from project group?"
        message={
          removing ? (
            <>
              User groups that reach {projectName} only through{' '}
              <span className="font-mono">{removing.group_name}</span> lose
              access, and their users&apos; sessions for this project are
              revoked.
              {isDefaultProjectGroup &&
                ' This looks like the project’s default group: its admin_, user_ and readonly_ groups reach the project through it, so its administrators would lose admin scope.'}
            </>
          ) : (
            ''
          )
        }
        confirmText="Remove"
        isLoading={
          removing !== null && membership.pending === removing.group_hash
        }
      />
    </div>
  );
}

export default ProjectGroupsTab;
