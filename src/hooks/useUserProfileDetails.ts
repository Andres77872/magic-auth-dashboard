import { useCallback, useEffect, useState } from 'react';
import { globalRolesService, userService } from '@/services';
import type { UserProfileResponse, UserGroupAssignment, UserProjectAccess } from '@/types/auth.types';
import type { GlobalRole } from '@/types/global-roles.types';

/**
 * Computed permission sources derived from the user's groups and projects.
 * This is calculated from the API response data, not fetched separately.
 */
interface ComputedPermissionSources {
  from_user_groups: Array<{
    group_hash: string;
    group_name: string;
    permissions_count: number;
  }>;
  from_projects: Array<{
    project_hash: string;
    project_name: string;
    access_groups_count: number;
    permissions_count: number;
  }>;
}

interface UseUserProfileDetailsReturn {
  profileData: UserProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  globalRole: GlobalRole | null;
  /** Computed from user's groups and projects - NOT fetched from API */
  computedPermissionSources: ComputedPermissionSources | null;
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

/**
 * Compute permission sources from user's groups and projects.
 * This replaces the buggy API call that fetched current user's sources.
 */
function computePermissionSources(
  groups: UserGroupAssignment[],
  projects: UserProjectAccess[]
): ComputedPermissionSources {
  const from_user_groups = groups.map((group) => ({
    group_hash: group.group_hash,
    group_name: group.group_name,
    permissions_count: group.projects_count || 0,
  }));

  const from_projects = projects.map((project) => ({
    project_hash: project.project_hash,
    project_name: project.project_name,
    access_groups_count: project.access_groups?.length || 0,
    permissions_count: project.effective_permissions?.length || 0,
  }));

  return { from_user_groups, from_projects };
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
  const [computedPermissionSources, setComputedPermissionSources] =
    useState<ComputedPermissionSources | null>(null);
  const [isGlobalDataLoading, setIsGlobalDataLoading] = useState(false);

  const fetchGlobalRole = useCallback(async (hash: string) => {
    setIsGlobalDataLoading(true);
    const roleResult = await globalRolesService.getUserRole(hash);

    if (roleResult.success && roleResult.data) {
      setGlobalRole(roleResult.data);
    } else {
      setGlobalRole(null);
    }

    setIsGlobalDataLoading(false);
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!userHash) {
      setProfileData(null);
      setGlobalRole(null);
      setComputedPermissionSources(null);
      setError('User ID is required');
      setIsLoading(false);
      setIsGlobalDataLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch with full enrichment to get all available data
      const response = await userService.getUserByHash(userHash, {
        include_group_hierarchy: true,
        include_permission_details: true,
      });

      if (response.success && response.user) {
        const normalized = normalizeUserProfile(response);
        setProfileData(normalized);
        
        // Compute permission sources from available data (not API call)
        const groups = normalized.user.groups || [];
        const projects = normalized.user.projects || [];
        setComputedPermissionSources(computePermissionSources(groups, projects));
        
        // Fetch global role separately (this endpoint is per-user)
        await fetchGlobalRole(userHash);
      } else {
        setProfileData(null);
        setGlobalRole(null);
        setComputedPermissionSources(null);
        setError(response.message || 'Failed to fetch user data');
      }
    } catch (err) {
      setProfileData(null);
      setGlobalRole(null);
      setComputedPermissionSources(null);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  }, [fetchGlobalRole, userHash]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  return {
    profileData,
    isLoading,
    error,
    globalRole,
    computedPermissionSources,
    isGlobalDataLoading,
    refetch: fetchProfile,
  };
}

export default useUserProfileDetails;
