import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import {
  findAdminGroupCandidates,
  useProjectAdministrators,
  useProjectUserGroups,
} from '@/hooks/useProjectDetails';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { GroupMember, UserGroup } from '@/types/group.types';
import { AddAdministratorDialog } from './AddAdministratorDialog';

interface ProjectAdministratorsPanelProps {
  projectHash: string;
  /** Only root may change `admin_…` groups; api.auth answers 403 to everyone else. */
  canEdit: boolean;
}

function ListSkeleton(): React.JSX.Element {
  return (
    <ul className="m-0 list-none space-y-3 px-5 py-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </li>
      ))}
    </ul>
  );
}

function AdministratorRow({
  member,
  canEdit,
  isPending,
  onRemove,
}: {
  member: GroupMember;
  canEdit: boolean;
  isPending: boolean;
  onRemove: (member: GroupMember) => void;
}): React.JSX.Element {
  const isAdminType = member.user_type === 'admin';
  return (
    <li className="flex items-center gap-3 py-2.5">
      <UserAvatar username={member.username} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={`${ROUTES.USERS}/${encodeURIComponent(member.user_hash)}`}
            className="truncate text-[13px] font-medium text-foreground no-underline hover:underline"
          >
            {member.username}
          </Link>
          <UserTypeBadge userType={member.user_type} />
        </div>
        <p className="m-0 truncate text-xs text-muted-foreground">
          {isAdminType
            ? `Added ${formatDate(member.joined_at)}`
            : 'Not an admin user: this membership gives project access, not admin scope'}
        </p>
      </div>
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(member)}
          disabled={isPending}
          aria-label={`Remove ${member.username} from administrators`}
        >
          <UserMinus aria-hidden="true" />
        </Button>
      )}
    </li>
  );
}

function AdministratorList({
  group,
  canEdit,
}: {
  group: UserGroup;
  canEdit: boolean;
}): React.JSX.Element {
  const { showToast } = useToast();
  const {
    members,
    total,
    pending,
    isLoading,
    error,
    refetch,
    isRefreshing,
    addAdministrator,
    removeAdministrator,
  } = useProjectAdministrators(group.group_hash);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<GroupMember | null>(null);

  const confirmRemove = async (): Promise<void> => {
    if (!removing) return;
    try {
      await removeAdministrator(removing.user_hash);
      showToast(
        `${removing.username} is no longer an administrator of this project.`,
        'success'
      );
      setRemoving(null);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The administrator could not be removed.',
        'error'
      );
    }
  };

  return (
    <>
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 px-5 py-6 text-center"
          role="alert"
        >
          <p className="m-0 text-[13px] text-muted-foreground">
            Administrators could not be loaded. {error}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefreshing}
          >
            Try again
          </Button>
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="No administrators"
          description={
            canEdit
              ? 'Only root users can manage this project until an admin user is added.'
              : 'Only root users can manage this project. Ask a root user to add an administrator.'
          }
          size="sm"
        />
      ) : (
        <ul className="m-0 list-none divide-y divide-border px-5 py-1">
          {members.map((member) => (
            <AdministratorRow
              key={member.user_hash}
              member={member}
              canEdit={canEdit}
              isPending={pending === member.user_hash}
              onRemove={setRemoving}
            />
          ))}
        </ul>
      )}
      {total > members.length && (
        <p className="m-0 px-5 pb-3 text-xs text-muted-foreground">
          Showing {members.length} of {total}.{' '}
          <Link
            to={`${ROUTES.GROUPS}/${encodeURIComponent(group.group_hash)}`}
            className="text-primary"
          >
            See all in the group
          </Link>
        </p>
      )}
      {canEdit && (
        <div className="border-t border-border px-5 py-3">
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <UserPlus aria-hidden="true" />
            Add administrator
          </Button>
        </div>
      )}

      <AddAdministratorDialog
        open={adding}
        onOpenChange={setAdding}
        groupName={group.group_name}
        existingUserHashes={members.map((member) => member.user_hash)}
        isAdding={pending !== null && adding}
        onAdd={async (user) => {
          try {
            await addAdministrator(user.user_hash);
            showToast(
              `${user.username} is now an administrator of this project.`,
              'success'
            );
            setAdding(false);
          } catch (err) {
            showToast(
              err instanceof Error
                ? err.message
                : 'The administrator could not be added.',
              'error'
            );
            throw err;
          }
        }}
      />
      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
        variant="warning"
        title="Remove administrator?"
        message={
          removing ? (
            <>
              {removing.username} will be removed from{' '}
              <span className="font-mono">{group.group_name}</span> and lose
              admin scope over this project (and project access through that
              group).
            </>
          ) : (
            ''
          )
        }
        confirmText="Remove"
        isLoading={removing !== null && pending === removing.user_hash}
      />
    </>
  );
}

/**
 * Administrators: members of the project's `admin_…` user group. api.auth
 * grants project-admin scope to admin-type users in that group; root users
 * administer every project without it. Only root can change the group.
 */
export function ProjectAdministratorsPanel({
  projectHash,
  canEdit,
}: ProjectAdministratorsPanelProps): React.JSX.Element {
  const selectId = useId();
  const { userGroups, isLoading, error, refetch, isRefreshing } =
    useProjectUserGroups(projectHash);
  const candidates = findAdminGroupCandidates(userGroups);
  const [chosenHash, setChosenHash] = useState<string | null>(null);
  const group =
    candidates.find((candidate) => candidate.group_hash === chosenHash) ??
    candidates[0] ??
    null;

  return (
    <Panel
      title="Administrators"
      description={
        group ? (
          <>
            Admin users in <span className="font-mono">{group.group_name}</span>
            . Root users administer every project.
          </>
        ) : (
          'Admin users in the project’s admin group. Root users administer every project.'
        )
      }
      padding="none"
    >
      {isLoading ? (
        <ListSkeleton />
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 px-5 py-6 text-center"
          role="alert"
        >
          <p className="m-0 text-[13px] text-muted-foreground">
            The project’s groups could not be loaded. {error}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefreshing}
          >
            Try again
          </Button>
        </div>
      ) : !group ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="No admin group reaches this project"
          description="Projects are created with an admin_… user group. It may have been deleted or lost its project group."
          size="sm"
        />
      ) : (
        <>
          {candidates.length > 1 && (
            <div className="space-y-1.5 border-b border-border px-5 py-3">
              <label
                htmlFor={selectId}
                className="block text-xs font-medium text-foreground"
              >
                Admin group
              </label>
              <select
                id={selectId}
                value={group.group_hash}
                onChange={(event) => setChosenHash(event.target.value)}
                className="h-8 w-full rounded-sm border border-input bg-card px-2 text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {candidates.map((candidate) => (
                  <option
                    key={candidate.group_hash}
                    value={candidate.group_hash}
                  >
                    {candidate.group_name}
                  </option>
                ))}
              </select>
              <p className="m-0 text-xs text-muted-foreground">
                Several admin groups reach this project through shared project
                groups. Only the one created with this project assigns its
                administrators.
              </p>
            </div>
          )}
          <AdministratorList
            key={group.group_hash}
            group={group}
            canEdit={canEdit}
          />
        </>
      )}
    </Panel>
  );
}

export default ProjectAdministratorsPanel;
