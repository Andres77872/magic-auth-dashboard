import { useCallback } from 'react';
import { groupService, runGroupBatch } from '@/services/group.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { globalRolesService } from '@/services/global-roles.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type {
  GroupBatchResult,
  ProjectGroupGrant,
  UserGroupDetails,
} from '@/types/group.types';
import type {
  AssignedPermissionGroup,
  BulkPermissionGroupAssignResult,
} from '@/types/permission-assignments.types';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

export interface UseGroupDetailsReturn {
  details: UserGroupDetails | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** `GET /admin/user-groups/{hash}`: the group, its counts and the projects it reaches. */
export function useGroupDetails(
  groupHash: string | undefined
): UseGroupDetailsReturn {
  const fetcher = useCallback((): Promise<UserGroupDetails> => {
    if (!groupHash) return Promise.reject(new Error('Missing user group id.'));
    return groupService.getGroup(groupHash);
  }, [groupHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(groupHash) }
  );
  return { details: data, isLoading, isRefreshing, error, refetch };
}

export interface UseGroupProjectGroupGrantsReturn {
  grants: ProjectGroupGrant[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** One request per project group; every one is attempted. */
  grant: (projectGroupHashes: string[]) => Promise<GroupBatchResult>;
  revoke: (projectGroupHash: string) => Promise<void>;
}

/** Project groups granted to a user group, with grant/revoke. */
export function useGroupProjectGroupGrants(
  groupHash: string
): UseGroupProjectGroupGrantsReturn {
  const fetcher = useCallback(
    () => groupService.listProjectGroupGrants(groupHash),
    [groupHash]
  );
  const { data, error, isLoading, isRefreshing, refetch } =
    useAsyncData(fetcher);

  const grant = useCallback(
    (projectGroupHashes: string[]) =>
      runGroupBatch(projectGroupHashes, (pgHash) =>
        groupService.grantProjectGroupAccess(groupHash, pgHash)
      ),
    [groupHash]
  );
  const revoke = useCallback(
    (projectGroupHash: string) =>
      groupService.revokeProjectGroupAccess(groupHash, projectGroupHash),
    [groupHash]
  );

  return {
    grants: data ?? [],
    isLoading,
    isRefreshing,
    error,
    refetch,
    grant,
    revoke,
  };
}

export interface UseGroupPermissionGroupsReturn {
  assigned: AssignedPermissionGroup[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  assign: (
    permissionGroupHashes: string[]
  ) => Promise<BulkPermissionGroupAssignResult>;
  remove: (permissionGroupHash: string) => Promise<void>;
}

/** Permission groups assigned to a user group (`/permissions/admin/user-groups/{hash}/permission-groups`). */
export function useGroupPermissionGroups(
  groupHash: string
): UseGroupPermissionGroupsReturn {
  const fetcher = useCallback(
    () => permissionAssignmentsService.getUserGroupPermissionGroups(groupHash),
    [groupHash]
  );
  const { data, error, isLoading, isRefreshing, refetch } =
    useAsyncData(fetcher);

  const assign = useCallback(
    (hashes: string[]) =>
      permissionAssignmentsService.bulkAssignPermissionGroupsToUserGroup(
        groupHash,
        hashes
      ),
    [groupHash]
  );
  const remove = useCallback(
    (hash: string) =>
      permissionAssignmentsService.removePermissionGroupFromUserGroup(
        groupHash,
        hash
      ),
    [groupHash]
  );

  return {
    assigned: data ?? [],
    isLoading,
    isRefreshing,
    error,
    refetch,
    assign,
    remove,
  };
}

export interface UsePermissionGroupCatalogReturn {
  permissionGroups: GlobalPermissionGroup[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** The global permission-group catalogue (`GET /roles/permission-groups`, max 100). */
export function usePermissionGroupCatalog(
  enabled: boolean
): UsePermissionGroupCatalogReturn {
  const fetcher = useCallback(
    () => globalRolesService.getPermissionGroups(),
    []
  );
  const { data, error, isLoading, refetch } = useAsyncData(fetcher, {
    enabled,
  });
  return { permissionGroups: data ?? [], isLoading, error, refetch };
}

export default useGroupDetails;
