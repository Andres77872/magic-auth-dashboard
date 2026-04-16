import { useCallback, useEffect, useState } from 'react';
import {
  globalRolesService,
  permissionAssignmentsService,
  userService,
} from '@/services';
import type { UserProfileResponse } from '@/types/auth.types';
import type { GlobalRole } from '@/types/global-roles.types';
import type { PermissionSource } from '@/types/permission-assignments.types';

interface PermissionSources {
  from_role: PermissionSource[];
  from_user_groups: PermissionSource[];
  from_direct_assignment: PermissionSource[];
}

interface UseUserProfileDetailsReturn {
  profileData: UserProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  globalRole: GlobalRole | null;
  permissionSources: PermissionSources | null;
  isGlobalDataLoading: boolean;
  refetch: () => Promise<void>;
}

function normalizeUserProfile(
  response: UserProfileResponse
): UserProfileResponse {
  const userGroups = response.user.groups || [];
  const userProjects = response.user.projects || [];
  const allPermissions = userProjects.flatMap(
    (project) => project.effective_permissions || []
  );
  const accountAgeMs =
    new Date().getTime() - new Date(response.user.created_at).getTime();
  const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

  return {
    ...response,
    statistics: response.statistics || {
      total_groups: userGroups.length,
      total_accessible_projects: userProjects.length,
      total_permissions: allPermissions.length,
      account_age_days: accountAgeDays,
    },
    permissions: response.permissions || allPermissions,
  };
}

export function useUserProfileDetails(
  userHash?: string
): UseUserProfileDetailsReturn {
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalRole, setGlobalRole] = useState<GlobalRole | null>(null);
  const [permissionSources, setPermissionSources] =
    useState<PermissionSources | null>(null);
  const [isGlobalDataLoading, setIsGlobalDataLoading] = useState(false);

  const fetchGlobalData = useCallback(async (hash: string) => {
    setIsGlobalDataLoading(true);

    const [roleResult, sourcesResult] = await Promise.allSettled([
      globalRolesService.getUserRole(hash),
      permissionAssignmentsService.getMyPermissionSources(),
    ]);

    if (
      roleResult.status === 'fulfilled' &&
      roleResult.value.success &&
      roleResult.value.data
    ) {
      setGlobalRole(roleResult.value.data);
    } else {
      setGlobalRole(null);
    }

    if (
      sourcesResult.status === 'fulfilled' &&
      sourcesResult.value.success &&
      sourcesResult.value.data
    ) {
      setPermissionSources(sourcesResult.value.data);
    } else {
      setPermissionSources(null);
    }

    setIsGlobalDataLoading(false);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userHash) {
      setProfileData(null);
      setGlobalRole(null);
      setPermissionSources(null);
      setError('User ID is required');
      setIsLoading(false);
      setIsGlobalDataLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await userService.getUserByHash(userHash);

      if (response.success && response.user) {
        setProfileData(normalizeUserProfile(response));
        await fetchGlobalData(userHash);
      } else {
        setProfileData(null);
        setGlobalRole(null);
        setPermissionSources(null);
        setError(response.message || 'Failed to fetch user data');
      }
    } catch (err) {
      setProfileData(null);
      setGlobalRole(null);
      setPermissionSources(null);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchGlobalData, userHash]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    profileData,
    isLoading,
    error,
    globalRole,
    permissionSources,
    isGlobalDataLoading,
    refetch: fetchProfile,
  };
}

export default useUserProfileDetails;
