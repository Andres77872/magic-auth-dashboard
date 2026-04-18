import { useState, useEffect, useCallback } from 'react';
import type { UserGroupWithProjectGroups } from '@/types/group.types';
import { projectGroupService } from '@/services';

export interface UseUserGroupsWithAccessReturn {
  userGroups: UserGroupWithProjectGroups[];
  isLoading: boolean;
  error: string | null;
  /** Refetch the user groups access data */
  refetch: () => Promise<void>;
}

/**
 * Fetches all user groups and filters for those linked to a specific project group.
 * Uses client-side aggregation from existing endpoints.
 */
export function useUserGroupsWithAccess(
  projectGroupHash: string | undefined
): UseUserGroupsWithAccessReturn {
  const [userGroups, setUserGroups] = useState<UserGroupWithProjectGroups[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserGroups = useCallback(async () => {
    if (!projectGroupHash) {
      setUserGroups([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await projectGroupService.getUserGroupsForProjectGroup(
        projectGroupHash
      );
      setUserGroups(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load user groups with access'
      );
      setUserGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectGroupHash]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  return { userGroups, isLoading, error, refetch: fetchUserGroups };
}
