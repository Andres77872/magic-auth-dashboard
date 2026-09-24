import { useCallback, useMemo } from 'react';
import { globalRolesService } from '@/services/global-roles.service';
import { useAsyncData, type AsyncDataState } from '@/hooks/useAsyncData';
import type {
  GlobalPermission,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';

export interface AccessCatalog {
  roles: AsyncDataState<GlobalRole[]>;
  permissionGroups: AsyncDataState<GlobalPermissionGroup[]>;
  permissions: AsyncDataState<GlobalPermission[]>;
  /** Distinct categories in use, for filters and form suggestions. */
  groupCategories: string[];
  permissionCategories: string[];
}

function distinct(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

/** Global roles, permission groups and permissions, each loaded once and refreshable on its own. */
export function useAccessCatalog(): AccessCatalog {
  const fetchRoles = useCallback(async () => {
    const roles = await globalRolesService.getRoles();
    // Higher priority first, then by name — the backend's own listing order.
    return [...roles].sort(
      (a, b) =>
        b.role_priority - a.role_priority ||
        a.role_display_name.localeCompare(b.role_display_name)
    );
  }, []);
  const fetchGroups = useCallback(async () => {
    const groups = await globalRolesService.getPermissionGroups();
    return [...groups].sort((a, b) =>
      a.group_display_name.localeCompare(b.group_display_name)
    );
  }, []);
  const fetchPermissions = useCallback(async () => {
    const permissions = await globalRolesService.getPermissions();
    return [...permissions].sort((a, b) =>
      a.permission_name.localeCompare(b.permission_name)
    );
  }, []);

  const roles = useAsyncData(fetchRoles);
  const permissionGroups = useAsyncData(fetchGroups);
  const permissions = useAsyncData(fetchPermissions);

  const groupCategories = useMemo(
    () =>
      distinct(
        (permissionGroups.data ?? []).map((group) => group.group_category)
      ),
    [permissionGroups.data]
  );
  const permissionCategories = useMemo(
    () =>
      distinct(
        (permissions.data ?? []).map(
          (permission) => permission.permission_category
        )
      ),
    [permissions.data]
  );

  return {
    roles,
    permissionGroups,
    permissions,
    groupCategories,
    permissionCategories,
  };
}

export default useAccessCatalog;
