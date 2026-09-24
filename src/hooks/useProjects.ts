import { useCallback, useMemo, useState } from 'react';
import {
  PROJECT_LIST_MAX_LIMIT,
  projectService,
} from '@/services/project.service';
import { useAsyncData } from './useAsyncData';
import type {
  CreateProjectRequest,
  DeleteProjectResult,
  ProjectInfo,
  ProjectListResponse,
  ProjectSummary,
  UpdateProjectRequest,
} from '@/types/project.types';

export type ProjectSortKey = 'project_name' | 'access_level';
export type SortOrder = 'asc' | 'desc';

export interface UseProjectsOptions {
  /** Server-side search (name or description). Debounce before passing it in. */
  search?: string;
  /** Zero-based offset into the loaded list. */
  offset?: number;
  limit?: number;
  sortBy?: ProjectSortKey;
  sortOrder?: SortOrder;
  enabled?: boolean;
}

export interface UseProjectsReturn {
  /** The requested page of the (sorted) list. */
  projects: ProjectSummary[];
  /** Offset actually shown: clamped to the last page when the requested one is past the end. */
  offset: number;
  /** Number of projects loaded for this search. */
  total: number;
  /**
   * True when the API may hold more projects than were loaded (the window is
   * capped at the API maximum of 500). Ask the operator to narrow the search.
   */
  truncated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const collator = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

function sortProjects(
  projects: ProjectSummary[],
  sortBy: ProjectSortKey,
  sortOrder: SortOrder
): ProjectSummary[] {
  const direction = sortOrder === 'desc' ? -1 : 1;
  return [...projects].sort((a, b) => {
    const primary = collator.compare(a[sortBy], b[sortBy]);
    // Ties fall back to name order, always ascending.
    return primary !== 0
      ? primary * direction
      : collator.compare(a.project_name, b.project_name);
  });
}

/**
 * The projects the caller can see, paged and sorted in the browser.
 *
 * `GET /projects` cannot be paged reliably from the client for root callers:
 * their `pagination.total` is only the length of the returned page, `has_more`
 * is always false, `offset` is ignored while searching, and the route has no
 * sort parameters. So one window of up to 500 projects (the API maximum) is
 * loaded per search and sliced here. For admins `has_more` is accurate; for
 * root a full window means more projects may exist, which `truncated` reports.
 */
export function useProjects({
  search = '',
  offset = 0,
  limit = 25,
  sortBy = 'project_name',
  sortOrder = 'asc',
  enabled = true,
}: UseProjectsOptions = {}): UseProjectsReturn {
  const query = search.trim();
  const fetcher = useCallback(
    (): Promise<ProjectListResponse> =>
      projectService.getProjects({
        limit: PROJECT_LIST_MAX_LIMIT,
        offset: 0,
        search: query || undefined,
      }),
    [query]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );

  const sorted = useMemo(
    () => (data ? sortProjects(data.projects, sortBy, sortOrder) : []),
    [data, sortBy, sortOrder]
  );
  const shownOffset =
    sorted.length > 0 && offset >= sorted.length
      ? Math.floor((sorted.length - 1) / limit) * limit
      : offset;
  const projects = useMemo(
    () => sorted.slice(shownOffset, shownOffset + limit),
    [sorted, shownOffset, limit]
  );
  const truncated = data
    ? data.pagination.has_more || data.projects.length >= PROJECT_LIST_MAX_LIMIT
    : false;

  return {
    projects,
    offset: shownOffset,
    total: sorted.length,
    truncated,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

type ProjectMutation = 'create' | 'update' | 'delete';

export interface UseProjectMutationsReturn {
  /** The mutation in flight, if any. */
  pending: ProjectMutation | null;
  /** Root only. Creates the project group and `admin_`/`user_`/`readonly_` user groups too. */
  createProject: (data: CreateProjectRequest) => Promise<ProjectInfo>;
  updateProject: (
    projectHash: string,
    data: UpdateProjectRequest
  ) => Promise<ProjectInfo>;
  deleteProject: (projectHash: string) => Promise<DeleteProjectResult>;
}

/** Project writes. Each call resolves only after the API confirms it and rethrows API errors. */
export function useProjectMutations(): UseProjectMutationsReturn {
  const [pending, setPending] = useState<ProjectMutation | null>(null);

  const run = useCallback(
    async <T>(kind: ProjectMutation, action: () => Promise<T>): Promise<T> => {
      setPending(kind);
      try {
        return await action();
      } finally {
        setPending(null);
      }
    },
    []
  );

  const createProject = useCallback(
    (data: CreateProjectRequest) =>
      run('create', () => projectService.createProject(data)),
    [run]
  );
  const updateProject = useCallback(
    (projectHash: string, data: UpdateProjectRequest) =>
      run('update', () => projectService.updateProject(projectHash, data)),
    [run]
  );
  const deleteProject = useCallback(
    (projectHash: string) =>
      run('delete', () => projectService.deleteProject(projectHash)),
    [run]
  );

  return { pending, createProject, updateProject, deleteProject };
}

export default useProjects;
