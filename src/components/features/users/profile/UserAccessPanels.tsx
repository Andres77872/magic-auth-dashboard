import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FolderKanban, Plus, Users, X } from 'lucide-react';
import { ConfirmDialog, EmptyState, Panel } from '@/components/common';
import { Button } from '@/components/ui/button';
import { useToast, useUserType } from '@/hooks';
import { groupService } from '@/services/group.service';
import { formatDate } from '@/utils/formatters';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import { ROUTES } from '@/utils/routes';
import type { User, UserGroupAssignment } from '@/types/auth.types';
import { AssignGroupModal } from '../AssignGroupModal';

interface UserAccessPanelsProps {
  user: User;
  canManage: boolean;
  onChanged: () => void;
}

/**
 * How a user reaches projects: group memberships (editable) and the projects
 * those memberships unlock through project groups.
 */
export function UserAccessPanels({
  user,
  canManage,
  onChanged,
}: UserAccessPanelsProps): React.JSX.Element {
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState<UserGroupAssignment | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const groups = user.groups ?? [];
  const projects = user.projects ?? [];

  const handleAssign = async (groupHash: string): Promise<void> => {
    setAssigning(true);
    try {
      await groupService.addMemberToGroup(groupHash, {
        user_hash: user.user_hash,
      });
      showToast(`${user.username} was added to the group.`, 'success');
      setAssignOpen(false);
      onChanged();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The user could not be added to the group.',
        'error'
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await groupService.removeMemberFromGroup(
        removing.group_hash,
        user.user_hash
      );
      showToast(
        `${user.username} was removed from ${removing.group_name}.`,
        'success'
      );
      setRemoving(null);
      onChanged();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The user could not be removed from the group.',
        'error'
      );
    } finally {
      setRemoveBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Panel
        title="Group memberships"
        description="Groups grant access to projects through their project groups"
        padding="none"
        actions={
          canManage ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAssignOpen(true)}
            >
              <Plus aria-hidden="true" />
              Add to group
            </Button>
          ) : undefined
        }
      >
        {groups.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Not in any group"
            description="Without a group this user can't reach any project."
            size="sm"
          />
        ) : (
          <ul className="m-0 list-none divide-y divide-border p-0">
            {groups.map((group) => {
              const locked =
                isProjectAdminGroupName(group.group_name) && !isRoot;
              return (
                <li
                  key={group.group_hash}
                  className="flex items-center gap-3 px-5 py-2.5"
                >
                  <Users
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`${ROUTES.GROUPS}/${encodeURIComponent(group.group_hash)}`}
                      className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
                    >
                      {group.group_name}
                    </Link>
                    <span className="block truncate text-xs text-muted-foreground">
                      {group.group_description || 'No description'}
                      {group.assigned_at &&
                        ` · Joined ${formatDate(group.assigned_at)}`}
                      {typeof group.projects_count === 'number' &&
                        ` · ${group.projects_count} project${group.projects_count === 1 ? '' : 's'}`}
                    </span>
                  </div>
                  {canManage && !locked && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setRemoving(group)}
                      aria-label={`Remove from ${group.group_name}`}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Project access"
        description="Projects this user can sign in to"
        padding="none"
      >
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderKanban />}
            title="No project access"
            description="Add the user to a group that has project access."
            size="sm"
          />
        ) : (
          <ul className="m-0 list-none divide-y divide-border p-0">
            {projects.map((project) => {
              const via =
                project.access_groups?.map((g) => g.group_name) ??
                (project.project_group ? [project.project_group] : []);
              const permissionCount =
                project.effective_permissions?.length ??
                project.permissions?.length ??
                0;
              return (
                <li key={project.project_hash}>
                  <Link
                    to={`${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}`}
                    className="group flex items-center gap-3 px-5 py-2.5 no-underline transition-colors hover:bg-accent/40"
                  >
                    <FolderKanban
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {project.project_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {via.length > 0
                          ? `Through ${via.join(', ')}`
                          : project.project_description || 'Access granted'}
                        {permissionCount > 0 &&
                          ` · ${permissionCount} permission${permissionCount === 1 ? '' : 's'}`}
                      </span>
                    </span>
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <AssignGroupModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        onConfirm={(groupHash) => void handleAssign(groupHash)}
        isLoading={assigning}
        userName={user.username}
        excludeHashes={groups.map((group) => group.group_hash)}
      />
      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void handleRemove()}
        variant="warning"
        title={`Remove from ${removing?.group_name ?? 'group'}?`}
        message={`${user.username} loses access to any project that is only reachable through this group.`}
        confirmText="Remove"
        isLoading={removeBusy}
      />
    </div>
  );
}

export default UserAccessPanels;
