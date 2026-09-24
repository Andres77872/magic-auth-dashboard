import { useCallback } from 'react';
import { projectGroupService } from '@/services/project-group.service';
import { runGroupBatch } from '@/services/group.service';
import { projectService } from '@/services/project.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useGroupListQuery, type GroupListQuery } from '@/hooks/useGroups';
import type {
  AssignedProject,
  GroupBatchResult,
  GroupFormData,
  ProjectGroup,
  ProjectGroupDetails,
  UpdatedGroup,
} from '@/types/group.types';

export interface UseProjectGroupsOptions {
  /** Page size (1–1000). Defaults to 25. */
  limit?: number;
  enabled?: boolean;
}

export interface UseProjectGroupsReturn extends GroupListQuery {
  projectGroups: ProjectGroup[];
  /** Matching groups; the backend applies `search` to this count. */
  total: number | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Server-paginated list of project groups (`GET /admin/project-groups`). */
export function useProjectGroups({
  limit: initialLimit = 25,
  enabled = true,
}: UseProjectGroupsOptions = {}): UseProjectGroupsReturn {
  const query = useGroupListQuery(initialLimit, {
    field: 'group_name',
    order: 'asc',
  });
  const { search, sort, offset, limit } = query;

  const fetcher = useCallback(
    () =>
      projectGroupService.listProjectGroups({
        limit,
        offset,
        search: search || undefined,
        sort_by: sort.field,
        sort_order: sort.order,
      }),
    [limit, offset, search, sort.field, sort.order]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );

  return {
    ...query,
    projectGroups: data?.projectGroups ?? [],
    total: data?.total,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

export interface ProjectGroupMutations {
  createProjectGroup: (data: GroupFormData) => Promise<ProjectGroup>;
  updateProjectGroup: (
    groupHash: string,
    data: GroupFormData
  ) => Promise<UpdatedGroup>;
  deleteProjectGroup: (groupHash: string) => Promise<void>;
  /** One request per project; every project is attempted. */
  addProjects: (
    groupHash: string,
    projectHashes: string[]
  ) => Promise<GroupBatchResult>;
  removeProject: (groupHash: string, projectHash: string) => Promise<void>;
}

/** Project-group writes. Each call resolves only after the API confirms. */
export function useProjectGroupMutations(): ProjectGroupMutations {
  const createProjectGroup = useCallback(
    (data: GroupFormData) => projectGroupService.createProjectGroup(data),
    []
  );
  const updateProjectGroup = useCallback(
    (groupHash: string, data: GroupFormData) =>
      projectGroupService.updateProjectGroup(groupHash, data),
    []
  );
  const deleteProjectGroup = useCallback(
    (groupHash: string) => projectGroupService.deleteProjectGroup(groupHash),
    []
  );
  const addProjects = useCallback(
    (groupHash: string, projectHashes: string[]) =>
      runGroupBatch(projectHashes, (projectHash) =>
        projectGroupService.assignProjectToGroup(groupHash, projectHash)
      ),
    []
  );
  const removeProject = useCallback(
    async (groupHash: string, projectHash: string): Promise<void> => {
      await projectGroupService.removeProjectFromGroup(groupHash, projectHash);
    },
    []
  );
  return {
    createProjectGroup,
    updateProjectGroup,
    deleteProjectGroup,
    addProjects,
    removeProject,
  };
}

export interface UseProjectGroupDetailsReturn {
  details: ProjectGroupDetails | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** `GET /admin/project-groups/{hash}`: the group and its projects. */
export function useProjectGroupDetails(
  groupHash: string | undefined
): UseProjectGroupDetailsReturn {
  const fetcher = useCallback((): Promise<ProjectGroupDetails> => {
    if (!groupHash)
      return Promise.reject(new Error('Missing project group id.'));
    return projectGroupService.getProjectGroup(groupHash);
  }, [groupHash]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(groupHash) }
  );
  return { details: data, isLoading, isRefreshing, error, refetch };
}

export interface UseProjectCandidatesReturn {
  projects: AssignedProject[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Projects the operator can see (`GET /projects`, up to 500), for adding to a
 * project group. Root sees every active project; admins only their assigned ones.
 */
export function useProjectCandidates(
  search: string,
  enabled: boolean
): UseProjectCandidatesReturn {
  const fetcher = useCallback(async (): Promise<AssignedProject[]> => {
    const res = await projectService.getProjects({
      limit: 500,
      search: search.trim() || undefined,
    });
    if (!Array.isArray(res.projects))
      throw new Error(
        'Unexpected response from the server while loading projects.'
      );
    return res.projects.map((project) => ({
      project_hash: project.project_hash,
      project_name: project.project_name,
      project_description: project.project_description ?? null,
    }));
  }, [search]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return { projects: data ?? [], isLoading, isRefreshing, error, refetch };
}

export default useProjectGroups;
