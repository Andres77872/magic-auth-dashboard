/**
 * Data hooks for the project details page. Each hook owns one api.auth read
 * (and the writes that invalidate it) so tabs load only what they show.
 */

import { useCallback, useState } from 'react';
import { projectService } from '@/services/project.service';
import { groupService } from '@/services/group.service';
import { projectGroupService } from '@/services/project-group.service';
import { globalRolesService } from '@/services/global-roles.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { useAsyncData } from './useAsyncData';
import type {
  ProjectActivityEntry,
  ProjectDetailsData,
  ProjectGroupInfo,
  ProjectInfo,
  ProjectMember,
  ProjectUserAccess,
} from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';
import type { UserType } from '@/types/auth.types';
import type { GroupMember, ProjectGroup, UserGroup } from '@/types/group.types';
import type {
  CatalogMetadata,
  CatalogedRole,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';
import type { CatalogedPermissionGroup } from '@/types/permission-assignments.types';

const NO_PROJECT_GROUPS: ProjectGroupInfo[] = [];
const NO_MEMBERS: ProjectMember[] = [];
const NO_USER_GROUPS: UserGroup[] = [];
const NO_ACTIVITY: ProjectActivityEntry[] = [];
const NO_GROUP_MEMBERS: GroupMember[] = [];

interface AsyncFlags {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Project -----------------------------------------------------------------------

export interface UseProjectDetailsReturn extends AsyncFlags {
  details: ProjectDetailsData | null;
  project: ProjectInfo | null;
  userAccess: ProjectUserAccess | null;
  projectGroups: ProjectGroupInfo[];
  /** Root, or an admin assigned to this project: may edit, delete and read members/groups. */
  canManage: boolean;
}

/**
 * `GET /projects/{hash}`. Render the page under `key={projectHash}` so a
 * different project never shows the previous one's data while loading.
 */
export function useProjectDetails(
  projectHash: string | undefined
): UseProjectDetailsReturn {
  const fetcher = useCallback((): Promise<ProjectDetailsData> => {
    if (!projectHash)
      return Promise.reject(new Error('No project was specified.'));
    return projectService.getProject(projectHash);
  }, [projectHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(projectHash) }
  );

  return {
    details: data,
    project: data?.project ?? null,
    userAccess: data?.user_access ?? null,
    projectGroups: data?.project_groups ?? NO_PROJECT_GROUPS,
    canManage: data?.user_access.access_level === 'admin_access',
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

export default useProjectDetails;

// Members -----------------------------------------------------------------------

export interface UseProjectMembersOptions {
  offset: number;
  limit: number;
  userType?: UserType;
  enabled?: boolean;
}

export interface UseProjectMembersReturn extends AsyncFlags {
  members: ProjectMember[];
  pagination: PaginationResponse | null;
}

/** One server page of `GET /projects/{hash}/members` (root or an assigned admin). */
export function useProjectMembers(
  projectHash: string,
  { offset, limit, userType, enabled = true }: UseProjectMembersOptions
): UseProjectMembersReturn {
  const fetcher = useCallback(
    () =>
      projectService.getProjectMembers(projectHash, {
        offset,
        limit,
        user_type: userType,
      }),
    [projectHash, offset, limit, userType]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return {
    members: data?.members ?? NO_MEMBERS,
    pagination: data?.pagination ?? null,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

// User groups with access ---------------------------------------------------------

/** api.auth's maximum page for `GET /projects/{hash}/groups`. */
export const PROJECT_USER_GROUPS_MAX = 500;

export interface UseProjectUserGroupsReturn extends AsyncFlags {
  userGroups: UserGroup[];
  /** Real number of user groups with access (may exceed what was loaded). */
  total: number;
}

/** User groups that reach the project through its project groups (up to 500, sorted by name). */
export function useProjectUserGroups(
  projectHash: string,
  { enabled = true }: { enabled?: boolean } = {}
): UseProjectUserGroupsReturn {
  const fetcher = useCallback(
    () =>
      projectService.getProjectGroups(projectHash, {
        limit: PROJECT_USER_GROUPS_MAX,
        offset: 0,
      }),
    [projectHash]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return {
    userGroups: data?.user_groups ?? NO_USER_GROUPS,
    total: data?.pagination.total ?? 0,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

/**
 * Candidates for the project's administrator group. api.auth creates one
 * `admin_<internal project id>` user group per project and treats membership
 * of it (for admin-type users) as admin assignment. The dashboard never sees
 * internal ids, so it relies on the backend's `admin_` naming convention and
 * lets the operator choose when another project's admin group also reaches
 * this project through a shared project group.
 */
export function findAdminGroupCandidates(userGroups: UserGroup[]): UserGroup[] {
  return userGroups.filter((group) =>
    group.group_name.trim().toLowerCase().startsWith('admin_')
  );
}

// Project-group membership --------------------------------------------------------

/** api.auth's maximum page for `GET /admin/project-groups`. */
const PROJECT_GROUP_LIST_MAX = 1000;

export interface AddToProjectGroupsResult {
  added: string[];
  failed: Array<{ groupHash: string; message: string }>;
}

export interface UseProjectGroupMembershipReturn {
  /** Hash of the project group being changed, or `'bulk'` while adding. */
  pending: string | null;
  /** Adds the project to each group; reports per-group failures instead of stopping at the first. */
  addToProjectGroups: (
    groupHashes: string[]
  ) => Promise<AddToProjectGroupsResult>;
  removeFromProjectGroup: (groupHash: string) => Promise<void>;
}

/** Add or remove this project from project groups (`/admin/project-groups/{hash}/projects`). */
export function useProjectGroupMembership(
  projectHash: string
): UseProjectGroupMembershipReturn {
  const [pending, setPending] = useState<string | null>(null);

  const addToProjectGroups = useCallback(
    async (groupHashes: string[]): Promise<AddToProjectGroupsResult> => {
      setPending('bulk');
      try {
        const outcomes = await Promise.allSettled(
          groupHashes.map((groupHash) =>
            projectGroupService.assignProjectToGroup(groupHash, projectHash)
          )
        );
        const result: AddToProjectGroupsResult = { added: [], failed: [] };
        outcomes.forEach((outcome, index) => {
          if (outcome.status === 'fulfilled')
            result.added.push(groupHashes[index]);
          else
            result.failed.push({
              groupHash: groupHashes[index],
              message:
                outcome.reason instanceof Error
                  ? outcome.reason.message
                  : 'Could not add the project.',
            });
        });
        return result;
      } finally {
        setPending(null);
      }
    },
    [projectHash]
  );

  const removeFromProjectGroup = useCallback(
    async (groupHash: string): Promise<void> => {
      setPending(groupHash);
      try {
        await projectGroupService.removeProjectFromGroup(
          groupHash,
          projectHash
        );
      } finally {
        setPending(null);
      }
    },
    [projectHash]
  );

  return { pending, addToProjectGroups, removeFromProjectGroup };
}

const NO_PROJECT_GROUP_OPTIONS: ProjectGroup[] = [];

/** Every project group (sorted by name), loaded when `enabled`, for the "add to project group" picker. */
export function useProjectGroupOptions(
  enabled: boolean
): AsyncFlags & { projectGroups: ProjectGroup[] } {
  const fetcher = useCallback(
    () =>
      projectGroupService.listProjectGroups({
        limit: PROJECT_GROUP_LIST_MAX,
        offset: 0,
        sort_by: 'group_name',
      }),
    []
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return {
    projectGroups: data?.projectGroups ?? NO_PROJECT_GROUP_OPTIONS,
    error,
    isLoading,
    isRefreshing,
    refetch,
  };
}

// Activity ----------------------------------------------------------------------

export interface UseProjectActivityReturn extends AsyncFlags {
  activities: ProjectActivityEntry[];
  /** Events in the window (real count, not the page length). */
  total: number;
  days: number;
}

/** The latest `GET /projects/{hash}/activity` entries. */
export function useProjectActivity(
  projectHash: string,
  { limit = 8, days = 30 }: { limit?: number; days?: number } = {}
): UseProjectActivityReturn {
  const fetcher = useCallback(
    () => projectService.getProjectActivity(projectHash, { limit, days }),
    [projectHash, limit, days]
  );
  const { data, error, isLoading, isRefreshing, refetch } =
    useAsyncData(fetcher);
  return {
    activities: data?.activities ?? NO_ACTIVITY,
    total: data?.pagination.total ?? 0,
    days: data?.days ?? days,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

// Administrators ------------------------------------------------------------------

/** api.auth's maximum page for group members. */
const ADMIN_GROUP_PAGE = 100;

export interface UseProjectAdministratorsReturn extends AsyncFlags {
  members: GroupMember[];
  total: number;
  pending: string | null;
  /** Root only (api.auth answers 403 to everyone else for `admin_…` groups). */
  addAdministrator: (userHash: string) => Promise<void>;
  removeAdministrator: (userHash: string) => Promise<void>;
}

/** Members of the project's `admin_…` user group, with root-only add/remove. */
export function useProjectAdministrators(
  adminGroupHash: string | null
): UseProjectAdministratorsReturn {
  const fetcher = useCallback(() => {
    if (!adminGroupHash)
      return Promise.reject(new Error('No administrator group was selected.'));
    return groupService.getGroupMembers(adminGroupHash, {
      limit: ADMIN_GROUP_PAGE,
      offset: 0,
    });
  }, [adminGroupHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    {
      enabled: Boolean(adminGroupHash),
    }
  );
  const [pending, setPending] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      userHash: string,
      action: (groupHash: string) => Promise<unknown>
    ): Promise<void> => {
      if (!adminGroupHash)
        throw new Error('No administrator group was selected.');
      setPending(userHash);
      try {
        await action(adminGroupHash);
        await refetch();
      } finally {
        setPending(null);
      }
    },
    [adminGroupHash, refetch]
  );

  const addAdministrator = useCallback(
    (userHash: string) =>
      mutate(userHash, (groupHash) =>
        groupService.addMemberToGroup(groupHash, { user_hash: userHash })
      ),
    [mutate]
  );
  const removeAdministrator = useCallback(
    (userHash: string) =>
      mutate(userHash, (groupHash) =>
        groupService.removeMemberFromGroup(groupHash, userHash)
      ),
    [mutate]
  );

  return {
    members: data?.members ?? NO_GROUP_MEMBERS,
    total: data?.total ?? 0,
    pending,
    addAdministrator,
    removeAdministrator,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

// Catalog -------------------------------------------------------------------------

export interface ProjectCatalog {
  roles: CatalogedRole[];
  permissionGroups: CatalogedPermissionGroup[];
}

export interface UseProjectCatalogReturn extends AsyncFlags {
  catalog: ProjectCatalog | null;
  /** Key of the entry being changed (`role:<hash>` / `group:<hash>`). */
  pending: string | null;
  addRole: (roleHash: string, metadata: CatalogMetadata) => Promise<void>;
  removeRole: (roleHash: string) => Promise<void>;
  addPermissionGroup: (
    groupHash: string,
    metadata: CatalogMetadata
  ) => Promise<void>;
  removePermissionGroup: (groupHash: string) => Promise<void>;
}

/**
 * The project's catalog: roles and permission groups suggested to operators.
 * UI metadata only; api.auth never uses it for authorization.
 */
export function useProjectCatalog(
  projectHash: string | null
): UseProjectCatalogReturn {
  const fetcher = useCallback(async (): Promise<ProjectCatalog> => {
    if (!projectHash) throw new Error('No project was selected.');
    const [roles, permissionGroups] = await Promise.all([
      globalRolesService.getProjectCatalogRoles(projectHash),
      permissionAssignmentsService.getProjectCatalogPermissionGroups(
        projectHash
      ),
    ]);
    return { roles, permissionGroups };
  }, [projectHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(projectHash) }
  );
  const [pending, setPending] = useState<string | null>(null);

  const mutate = useCallback(
    async (
      key: string,
      action: (hash: string) => Promise<void>
    ): Promise<void> => {
      if (!projectHash) throw new Error('No project was selected.');
      setPending(key);
      try {
        await action(projectHash);
        await refetch();
      } finally {
        setPending(null);
      }
    },
    [projectHash, refetch]
  );

  const addRole = useCallback(
    (roleHash: string, metadata: CatalogMetadata) =>
      mutate(`role:${roleHash}`, (hash) =>
        globalRolesService.addRoleToProjectCatalog(hash, roleHash, metadata)
      ),
    [mutate]
  );
  const removeRole = useCallback(
    (roleHash: string) =>
      mutate(`role:${roleHash}`, (hash) =>
        globalRolesService.removeRoleFromProjectCatalog(hash, roleHash)
      ),
    [mutate]
  );
  const addPermissionGroup = useCallback(
    (groupHash: string, metadata: CatalogMetadata) =>
      mutate(`group:${groupHash}`, (hash) =>
        permissionAssignmentsService.addPermissionGroupToProjectCatalog(
          hash,
          groupHash,
          metadata
        )
      ),
    [mutate]
  );
  const removePermissionGroup = useCallback(
    (groupHash: string) =>
      mutate(`group:${groupHash}`, (hash) =>
        permissionAssignmentsService.removePermissionGroupFromProjectCatalog(
          hash,
          groupHash
        )
      ),
    [mutate]
  );

  return {
    catalog: data,
    pending,
    addRole,
    removeRole,
    addPermissionGroup,
    removePermissionGroup,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

export interface CatalogOptions {
  roles: GlobalRole[];
  permissionGroups: GlobalPermissionGroup[];
}

/** Every global role and permission group (catalogue max 100 each), loaded when `enabled`. */
export function useCatalogOptions(
  enabled: boolean
): AsyncFlags & { options: CatalogOptions | null } {
  const fetcher = useCallback(async (): Promise<CatalogOptions> => {
    const [roles, permissionGroups] = await Promise.all([
      globalRolesService.getRoles(),
      globalRolesService.getPermissionGroups(),
    ]);
    return { roles, permissionGroups };
  }, []);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return { options: data, error, isLoading, isRefreshing, refetch };
}
