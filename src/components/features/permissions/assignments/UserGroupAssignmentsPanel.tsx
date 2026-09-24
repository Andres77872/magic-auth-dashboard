import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { Panel } from '@/components/common';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAsyncData } from '@/hooks';
import { groupService } from '@/services/group.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { ROUTES } from '@/utils/routes';
import type { AccessCatalog } from '@/hooks/useAccessCatalog';
import type { AssignedPermissionGroup } from '@/types/permission-assignments.types';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import { MembershipEditor } from '../shared/MembershipEditor';

interface UserGroupAssignmentsPanelProps {
  catalog: AccessCatalog;
  canEdit: boolean;
  selectedGroupHash: string | null;
  onSelectGroup: (groupHash: string | null) => void;
}

const NO_GROUPS: GlobalPermissionGroup[] = [];

/**
 * Grant permission groups to a whole user group. Direct grants to a single
 * user live on that user's profile.
 */
export function UserGroupAssignmentsPanel({
  catalog,
  canEdit,
  selectedGroupHash,
  onSelectGroup,
}: UserGroupAssignmentsPanelProps): React.JSX.Element {
  const fetchGroups = useCallback(async () => {
    const res = await groupService.getGroups({ limit: 1000 });
    return [...(res.user_groups ?? [])].sort((a, b) =>
      a.group_name.localeCompare(b.group_name)
    );
  }, []);
  const userGroups = useAsyncData(fetchGroups);

  const fetchAssigned = useCallback(
    () =>
      selectedGroupHash
        ? permissionAssignmentsService.getUserGroupPermissionGroups(
            selectedGroupHash
          )
        : Promise.resolve<AssignedPermissionGroup[]>([]),
    [selectedGroupHash]
  );
  const assigned = useAsyncData(fetchAssigned, {
    enabled: Boolean(selectedGroupHash),
  });

  const selectedGroup = (userGroups.data ?? []).find(
    (group) => group.group_hash === selectedGroupHash
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Panel
        title="User group"
        description="Choose the group whose grants you want to change"
      >
        <SearchableSelect
          options={(userGroups.data ?? []).map((group) => ({
            value: group.group_hash,
            label: group.group_name,
          }))}
          value={selectedGroupHash ?? ''}
          onValueChange={(value) => onSelectGroup(value || null)}
          placeholder={
            userGroups.isLoading ? 'Loading groups…' : 'Search user groups…'
          }
          disabled={userGroups.isLoading}
          clearable
        />
        {userGroups.error && (
          <p className="m-0 mt-2 text-xs text-destructive">
            User groups could not be loaded. {userGroups.error}
          </p>
        )}
        {selectedGroup && (
          <div className="mt-4 space-y-1 text-[13px]">
            <p className="m-0 text-muted-foreground">
              {selectedGroup.description || 'No description'}
            </p>
            {typeof selectedGroup.member_count === 'number' && (
              <p className="m-0 text-muted-foreground">
                {selectedGroup.member_count} member
                {selectedGroup.member_count === 1 ? '' : 's'}
              </p>
            )}
            <Link
              to={`${ROUTES.GROUPS}/${encodeURIComponent(selectedGroup.group_hash)}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary no-underline hover:underline"
            >
              Open group{' '}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        )}
        <div className="mt-5 flex gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="m-0">
            Group grants count in server-side permission checks. Only a
            user&apos;s global role is embedded in a consumer&apos;s access
            token. To grant one user directly, open their profile.
          </p>
        </div>
      </Panel>

      <Panel title="Granted permission groups">
        {selectedGroupHash ? (
          <MembershipEditor<AssignedPermissionGroup | GlobalPermissionGroup>
            title="Permission groups"
            description="Every member receives these permission groups."
            assigned={assigned.data ?? []}
            catalog={catalog.permissionGroups.data ?? NO_GROUPS}
            getKey={(group) => group.group_hash}
            getLabel={(group) => group.group_display_name}
            getSecondary={(group) =>
              `${group.group_name} · ${group.group_category}`
            }
            onAdd={async (hash) => {
              await permissionAssignmentsService.assignPermissionGroupToUserGroup(
                selectedGroupHash,
                hash
              );
              await assigned.refetch();
            }}
            onRemove={async (group) => {
              await permissionAssignmentsService.removePermissionGroupFromUserGroup(
                selectedGroupHash,
                group.group_hash
              );
              await assigned.refetch();
            }}
            canEdit={canEdit}
            isLoading={assigned.isLoading}
            error={assigned.error}
            emptyText="This group grants no permission groups."
            addPlaceholder="Grant a permission group…"
            noun="permission group"
          />
        ) : (
          <p className="m-0 py-8 text-center text-[13px] text-muted-foreground">
            Choose a user group to see its grants.
          </p>
        )}
      </Panel>
    </div>
  );
}

export default UserGroupAssignmentsPanel;
