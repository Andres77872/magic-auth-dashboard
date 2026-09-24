import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DetailSheet, FactList } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncData } from '@/hooks';
import { globalRolesService } from '@/services/global-roles.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  GlobalPermission,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';
import { MembershipEditor } from '../shared/MembershipEditor';

interface PermissionGroupSheetProps {
  group: GlobalPermissionGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: GlobalPermission[];
  roles: GlobalRole[];
  canEdit: boolean;
  onEdit: (group: GlobalPermissionGroup) => void;
  onDelete: (group: GlobalPermissionGroup) => void;
  onOpenRole: (roleHash: string) => void;
}

function UsageList({
  title,
  items,
  loading,
  error,
  empty,
}: {
  title: string;
  items: React.ReactNode[];
  loading: boolean;
  error: string | null;
  empty: string;
}): React.JSX.Element {
  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">
        {title}
        {!loading && !error && (
          <span className="ml-1.5 font-mono text-[11px]">{items.length}</span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-5 w-2/3" />
      ) : error ? (
        <p className="m-0 text-xs text-muted-foreground">
          Couldn&apos;t load. {error}
        </p>
      ) : items.length === 0 ? (
        <p className="m-0 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">{items}</div>
      )}
    </div>
  );
}

const chip =
  'rounded border border-border bg-secondary/60 px-2 py-0.5 text-xs text-foreground no-underline hover:border-input';

/** A permission group's permissions (editable) and everywhere it is granted. */
export function PermissionGroupSheet({
  group,
  open,
  onOpenChange,
  permissions,
  roles,
  canEdit,
  onEdit,
  onDelete,
  onOpenRole,
}: PermissionGroupSheetProps): React.JSX.Element | null {
  const groupHash = group?.group_hash;
  const enabled = open && Boolean(groupHash);

  const fetchPermissions = useCallback(
    () =>
      groupHash
        ? globalRolesService.getGroupPermissions(groupHash)
        : Promise.resolve([]),
    [groupHash]
  );
  const assigned = useAsyncData(fetchPermissions, { enabled });

  // No endpoint lists the roles holding a group, so check each role's groups.
  const fetchRoles = useCallback(async (): Promise<GlobalRole[]> => {
    if (!groupHash) return [];
    const matches = await Promise.all(
      roles.map(async (role) => {
        const groups = await globalRolesService.getRolePermissionGroups(
          role.role_hash
        );
        return groups.some((g) => g.group_hash === groupHash) ? role : null;
      })
    );
    return matches.filter((role): role is GlobalRole => role !== null);
  }, [groupHash, roles]);
  const inRoles = useAsyncData(fetchRoles, { enabled });

  const fetchUserGroups = useCallback(
    () =>
      groupHash
        ? permissionAssignmentsService.getPermissionGroupUserGroups(groupHash)
        : Promise.resolve([]),
    [groupHash]
  );
  const userGroups = useAsyncData(fetchUserGroups, { enabled });

  const fetchUsers = useCallback(
    () =>
      groupHash
        ? permissionAssignmentsService.getPermissionGroupUsers(groupHash)
        : Promise.resolve([]),
    [groupHash]
  );
  const users = useAsyncData(fetchUsers, { enabled });

  const fetchProjects = useCallback(
    () =>
      groupHash
        ? permissionAssignmentsService.getPermissionGroupProjectCatalog(
            groupHash
          )
        : Promise.resolve([]),
    [groupHash]
  );
  const projects = useAsyncData(fetchProjects, { enabled });

  if (!group) return null;

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={group.group_display_name}
      description={group.group_description || 'No description'}
      meta={
        <>
          <span className="font-mono text-xs text-muted-foreground">
            {group.group_name}
          </span>
          <Badge variant="secondary" size="sm">
            {group.group_category}
          </Badge>
        </>
      }
      footer={
        canEdit ? (
          <>
            <Button variant="destructive" onClick={() => onDelete(group)}>
              Delete group
            </Button>
            <Button variant="secondary" onClick={() => onEdit(group)}>
              Edit details
            </Button>
          </>
        ) : undefined
      }
    >
      <MembershipEditor<GlobalPermission>
        title="Permissions"
        description="Granting this group grants all of these permissions."
        assigned={assigned.data ?? []}
        catalog={permissions}
        getKey={(permission) => permission.permission_hash}
        getLabel={(permission) => permission.permission_display_name}
        getSecondary={(permission) => permission.permission_name}
        onAdd={async (hash) => {
          await globalRolesService.assignPermissionToGroup(
            group.group_hash,
            hash
          );
          await assigned.refetch();
        }}
        onRemove={async (permission) => {
          await globalRolesService.removePermissionFromGroup(
            group.group_hash,
            permission.permission_hash
          );
          await assigned.refetch();
        }}
        canEdit={canEdit}
        isLoading={assigned.isLoading}
        error={assigned.error}
        emptyText="This group is empty. Add the permissions it should grant."
        addPlaceholder="Add a permission…"
        noun="permission"
      />

      <section className="space-y-4">
        <h3 className="m-0 text-[13px] font-semibold text-foreground">
          Where it&apos;s granted
        </h3>
        <UsageList
          title="Roles"
          loading={inRoles.isLoading}
          error={inRoles.error}
          empty="Not part of any role."
          items={(inRoles.data ?? []).map((role) => (
            <button
              key={role.role_hash}
              type="button"
              className={chip}
              onClick={() => onOpenRole(role.role_hash)}
            >
              {role.role_display_name}
            </button>
          ))}
        />
        <UsageList
          title="User groups"
          loading={userGroups.isLoading}
          error={userGroups.error}
          empty="Not assigned to any user group."
          items={(userGroups.data ?? []).map((ug) => (
            <Link
              key={ug.group_hash}
              to={`${ROUTES.GROUPS}/${encodeURIComponent(ug.group_hash)}`}
              className={chip}
            >
              {ug.group_name}
            </Link>
          ))}
        />
        <UsageList
          title="Users (direct)"
          loading={users.isLoading}
          error={users.error}
          empty="No direct user assignments."
          items={(users.data ?? []).map((user) => (
            <Link
              key={user.user_hash}
              to={`${ROUTES.USERS}/${encodeURIComponent(user.user_hash)}`}
              className={chip}
            >
              {user.username}
            </Link>
          ))}
        />
        <UsageList
          title="Suggested in projects"
          loading={projects.isLoading}
          error={projects.error}
          empty="No project catalog lists this group."
          items={(projects.data ?? []).map((project) => (
            <Link
              key={project.project_hash}
              to={`${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}?tab=catalog`}
              className={chip}
            >
              {project.project_name}
            </Link>
          ))}
        />
      </section>

      <section>
        <h3 className="m-0 mb-2 text-[13px] font-semibold text-foreground">
          Details
        </h3>
        <FactList
          facts={[
            { label: 'Group ID', value: group.group_hash, mono: true },
            { label: 'Created', value: formatDateTime(group.created_at) },
            {
              label: 'Updated',
              value: formatDateTime(group.updated_at, 'Never'),
            },
          ]}
        />
      </section>
    </DetailSheet>
  );
}

export default PermissionGroupSheet;
