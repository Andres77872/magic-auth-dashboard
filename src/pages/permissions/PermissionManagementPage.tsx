import React, { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageContainer, PageHeader, TabNavigation } from '@/components/common';
import { Button } from '@/components/ui/button';
import { RolesPanel } from '@/components/features/permissions/roles/RolesPanel';
import { PermissionGroupsPanel } from '@/components/features/permissions/permission-groups/PermissionGroupsPanel';
import { PermissionsPanel } from '@/components/features/permissions/permissions/PermissionsPanel';
import { UserGroupAssignmentsPanel } from '@/components/features/permissions/assignments/UserGroupAssignmentsPanel';
import { useUserType } from '@/hooks';
import { useAccessCatalog } from '@/hooks/useAccessCatalog';

const TABS = [
  'roles',
  'permission-groups',
  'permissions',
  'assignments',
] as const;
type AccessTab = (typeof TABS)[number];

/** Older `?tab=` values from the previous pages, mapped to their new home. */
const TAB_ALIASES: Record<string, AccessTab> = {
  groups: 'permission-groups',
  'my-permissions': 'roles',
  analytics: 'roles',
  catalog: 'roles',
};

const CREATE_LABELS: Partial<Record<AccessTab, string>> = {
  roles: 'Create role',
  'permission-groups': 'Create permission group',
  permissions: 'Create permission',
};

const SUBTITLES: Record<AccessTab, string> = {
  roles:
    'Each user holds one global role. A role grants its permission groups.',
  'permission-groups':
    'Bundles of permissions that roles, user groups and users can be granted.',
  permissions:
    'The permission strings your apps check. Grant them through permission groups.',
  assignments: 'Grant permission groups to every member of a user group.',
};

function readTab(value: string | null): AccessTab {
  if (value && (TABS as readonly string[]).includes(value))
    return value as AccessTab;
  if (value && TAB_ALIASES[value]) return TAB_ALIASES[value];
  return 'roles';
}

/**
 * Roles & permissions: one place for global roles, permission groups,
 * permissions and user-group grants. Selection is kept in the URL
 * (`?tab=`, `&role=`, `&group=`, `&user_group=`) so any item can be linked.
 */
export function PermissionManagementPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdminOrHigher } = useUserType();
  const catalog = useAccessCatalog();
  const [createFor, setCreateFor] = useState<AccessTab | null>(null);

  const activeTab = readTab(searchParams.get('tab'));
  const canEdit = isAdminOrHigher;

  const setParams = useCallback(
    (changes: Record<string, string | null>, replace = false) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const changeTab = (tab: string): void =>
    setParams({ tab, role: null, group: null });
  const openRole = (hash: string | null): void =>
    setParams({ tab: 'roles', role: hash, group: null }, true);
  const openGroup = (hash: string | null): void =>
    setParams({ tab: 'permission-groups', group: hash, role: null }, true);

  const counts = {
    roles: catalog.roles.data?.length,
    'permission-groups': catalog.permissionGroups.data?.length,
    permissions: catalog.permissions.data?.length,
  };
  const createLabel = CREATE_LABELS[activeTab];

  return (
    <PageContainer>
      <PageHeader
        title="Roles & permissions"
        subtitle={SUBTITLES[activeTab]}
        actions={
          canEdit && createLabel ? (
            <Button onClick={() => setCreateFor(activeTab)}>
              <Plus aria-hidden="true" />
              {createLabel}
            </Button>
          ) : undefined
        }
      />

      <TabNavigation
        className="mb-5"
        ariaLabel="Access control sections"
        activeTab={activeTab}
        onChange={changeTab}
        tabs={[
          { id: 'roles', label: 'Roles', count: counts.roles },
          {
            id: 'permission-groups',
            label: 'Permission groups',
            count: counts['permission-groups'],
          },
          {
            id: 'permissions',
            label: 'Permissions',
            count: counts.permissions,
          },
          { id: 'assignments', label: 'User group grants' },
        ]}
      />

      <div role="tabpanel" aria-label={activeTab}>
        {activeTab === 'roles' && (
          <RolesPanel
            catalog={catalog}
            canEdit={canEdit}
            selectedHash={searchParams.get('role')}
            onSelect={openRole}
            createOpen={createFor === 'roles'}
            onCreateOpenChange={(open) => setCreateFor(open ? 'roles' : null)}
          />
        )}
        {activeTab === 'permission-groups' && (
          <PermissionGroupsPanel
            catalog={catalog}
            canEdit={canEdit}
            selectedHash={searchParams.get('group')}
            onSelect={openGroup}
            onOpenRole={openRole}
            createOpen={createFor === 'permission-groups'}
            onCreateOpenChange={(open) =>
              setCreateFor(open ? 'permission-groups' : null)
            }
          />
        )}
        {activeTab === 'permissions' && (
          <PermissionsPanel
            catalog={catalog}
            canEdit={canEdit}
            onOpenGroup={openGroup}
            createOpen={createFor === 'permissions'}
            onCreateOpenChange={(open) =>
              setCreateFor(open ? 'permissions' : null)
            }
          />
        )}
        {activeTab === 'assignments' && (
          <UserGroupAssignmentsPanel
            catalog={catalog}
            canEdit={canEdit}
            selectedGroupHash={searchParams.get('user_group')}
            onSelectGroup={(hash) => setParams({ user_group: hash }, true)}
          />
        )}
      </div>
    </PageContainer>
  );
}

export default PermissionManagementPage;
