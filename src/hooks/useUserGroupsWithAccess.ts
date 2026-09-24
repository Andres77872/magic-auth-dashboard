import { useCallback } from 'react';
import { projectGroupService } from '@/services/project-group.service';
import { groupService, runGroupBatch } from '@/services/group.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type {
  GroupBatchResult,
  UserGroupAccessResult,
  UserGroupWithAccess,
} from '@/types/group.types';

export interface UseUserGroupsWithAccessReturn {
  userGroups: UserGroupWithAccess[];
  /** User groups whose grants couldn't be read, so they may be missing from `userGroups`. */
  uncheckedCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Grant this project group to user groups (one request each; every one is attempted). */
  grant: (userGroupHashes: string[]) => Promise<GroupBatchResult>;
  revoke: (userGroupHash: string) => Promise<void>;
}

/**
 * User groups that have been granted a project group. api.auth has no reverse
 * lookup, so this reads every user group's grants (see
 * `projectGroupService.getUserGroupsForProjectGroup`).
 */
export function useUserGroupsWithAccess(
  projectGroupHash: string | undefined
): UseUserGroupsWithAccessReturn {
  const fetcher = useCallback((): Promise<UserGroupAccessResult> => {
    if (!projectGroupHash)
      return Promise.reject(new Error('Missing project group id.'));
    return projectGroupService.getUserGroupsForProjectGroup(projectGroupHash);
  }, [projectGroupHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    {
      enabled: Boolean(projectGroupHash),
    }
  );

  const grant = useCallback(
    (userGroupHashes: string[]): Promise<GroupBatchResult> => {
      if (!projectGroupHash)
        return Promise.reject(new Error('Missing project group id.'));
      return runGroupBatch(userGroupHashes, (ugHash) =>
        groupService.grantProjectGroupAccess(ugHash, projectGroupHash)
      );
    },
    [projectGroupHash]
  );
  const revoke = useCallback(
    (userGroupHash: string): Promise<void> => {
      if (!projectGroupHash)
        return Promise.reject(new Error('Missing project group id.'));
      return groupService.revokeProjectGroupAccess(
        userGroupHash,
        projectGroupHash
      );
    },
    [projectGroupHash]
  );

  return {
    userGroups: data?.userGroups ?? [],
    uncheckedCount: data?.uncheckedCount ?? 0,
    isLoading,
    isRefreshing,
    error,
    refetch,
    grant,
    revoke,
  };
}

export default useUserGroupsWithAccess;
