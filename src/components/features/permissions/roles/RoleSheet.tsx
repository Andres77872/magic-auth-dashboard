import React, { useCallback, useMemo } from 'react';
import { DetailSheet, FactList } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncData } from '@/hooks';
import { globalRolesService } from '@/services/global-roles.service';
import { formatDateTime } from '@/utils/formatters';
import type {
  GlobalPermission,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';
import { MembershipEditor } from '../shared/MembershipEditor';

interface RoleSheetProps {
  role: GlobalRole | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionGroups: GlobalPermissionGroup[];
  canEdit: boolean;
  onEdit: (role: GlobalRole) => void;
  onDelete: (role: GlobalRole) => void;
}

/** A role's facts, its permission groups (editable) and the permissions they add up to. */
export function RoleSheet({
  role,
  open,
  onOpenChange,
  permissionGroups,
  canEdit,
  onEdit,
  onDelete,
}: RoleSheetProps): React.JSX.Element | null {
  const roleHash = role?.role_hash;
  const fetchGroups = useCallback(
    () =>
      roleHash
        ? globalRolesService.getRolePermissionGroups(roleHash)
        : Promise.resolve([]),
    [roleHash]
  );
  const assigned = useAsyncData(fetchGroups, {
    enabled: open && Boolean(roleHash),
  });

  const assignedHashes = (assigned.data ?? [])
    .map((group) => group.group_hash)
    .join('|');
  const fetchEffective = useCallback(async (): Promise<GlobalPermission[]> => {
    const hashes = assignedHashes ? assignedHashes.split('|') : [];
    const lists = await Promise.all(
      hashes.map((hash) => globalRolesService.getGroupPermissions(hash))
    );
    const byHash = new Map<string, GlobalPermission>();
    for (const permission of lists.flat())
      byHash.set(permission.permission_hash, permission);
    return [...byHash.values()].sort((a, b) =>
      a.permission_name.localeCompare(b.permission_name)
    );
  }, [assignedHashes]);
  const effective = useAsyncData(fetchEffective, {
    enabled: open && assigned.data !== null,
  });

  const effectiveByCategory = useMemo(() => {
    const map = new Map<string, GlobalPermission[]>();
    for (const permission of effective.data ?? []) {
      const list = map.get(permission.permission_category) ?? [];
      list.push(permission);
      map.set(permission.permission_category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [effective.data]);

  if (!role) return null;

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={role.role_display_name}
      description={role.role_description || 'No description'}
      meta={
        <>
          <span className="font-mono text-xs text-muted-foreground">
            {role.role_name}
          </span>
          {role.is_system_role ? (
            <Badge variant="secondary" size="sm">
              System role
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Custom
            </Badge>
          )}
          <Badge variant="info" size="sm">
            Priority {role.role_priority}
          </Badge>
        </>
      }
      footer={
        canEdit ? (
          <>
            {!role.is_system_role && (
              <Button variant="destructive" onClick={() => onDelete(role)}>
                Delete role
              </Button>
            )}
            <Button variant="secondary" onClick={() => onEdit(role)}>
              Edit details
            </Button>
          </>
        ) : undefined
      }
    >
      <MembershipEditor<GlobalPermissionGroup>
        title="Permission groups"
        description="Everyone with this role receives every permission in these groups."
        assigned={assigned.data ?? []}
        catalog={permissionGroups}
        getKey={(group) => group.group_hash}
        getLabel={(group) => group.group_display_name}
        getSecondary={(group) =>
          `${group.group_name} · ${group.group_category}`
        }
        onAdd={async (hash) => {
          await globalRolesService.assignPermissionGroupToRole(
            role.role_hash,
            hash
          );
          await assigned.refetch();
        }}
        onRemove={async (group) => {
          await globalRolesService.removePermissionGroupFromRole(
            role.role_hash,
            group.group_hash
          );
          await assigned.refetch();
        }}
        canEdit={canEdit}
        isLoading={assigned.isLoading}
        error={assigned.error}
        emptyText="This role grants nothing until you add a permission group."
        addPlaceholder="Add a permission group…"
        noun="permission group"
      />

      <section>
        <h3 className="m-0 mb-2 text-[13px] font-semibold text-foreground">
          Effective permissions
          {effective.data && (
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              {effective.data.length}
            </span>
          )}
        </h3>
        {assigned.isLoading || effective.isLoading ? (
          <Skeleton className="h-16" />
        ) : effective.error ? (
          <p className="m-0 text-xs text-muted-foreground">
            Couldn&apos;t resolve permissions. {effective.error}
          </p>
        ) : effectiveByCategory.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">
            No permissions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {effectiveByCategory.map(([category, permissions]) => (
              <div key={category}>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  {category}
                </div>
                <div className="flex flex-wrap gap-1">
                  {permissions.map((permission) => (
                    <span
                      key={permission.permission_hash}
                      title={permission.permission_display_name}
                      className="rounded border border-border bg-secondary/60 px-1.5 py-px font-mono text-[11px] text-foreground"
                    >
                      {permission.permission_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="m-0 mb-2 text-[13px] font-semibold text-foreground">
          Details
        </h3>
        <FactList
          facts={[
            { label: 'Role ID', value: role.role_hash, mono: true },
            { label: 'Created', value: formatDateTime(role.created_at) },
            {
              label: 'Updated',
              value: formatDateTime(role.updated_at, 'Never'),
            },
          ]}
        />
      </section>
    </DetailSheet>
  );
}

export default RoleSheet;
