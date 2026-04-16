import { useCallback, useEffect, useState } from 'react';
import { projectService } from '@/services';
import type {
  ProjectDetails,
  ProjectDetailsResponse,
  ProjectGroupInfo,
  ProjectStatistics,
  UserAccess,
} from '@/types/project.types';

interface UseProjectDetailsReturn {
  project: ProjectDetails | null;
  userAccess: UserAccess | null;
  statistics: ProjectStatistics | null;
  projectGroups: ProjectGroupInfo[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProjectState: (project: ProjectDetails) => void;
}

function mapProjectResponse(response: ProjectDetailsResponse): {
  project: ProjectDetails;
  userAccess: UserAccess | null;
  statistics: ProjectStatistics | null;
  projectGroups: ProjectGroupInfo[];
} {
  const getNumericStat = (
    value: number | string | undefined
  ): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && !Number.isNaN(Number(value)))
      return Number(value);
    return undefined;
  };

  return {
    project: {
      ...response.project,
      member_count: getNumericStat(response.statistics?.total_users),
      group_count: getNumericStat(response.statistics?.total_groups),
      access_level: response.user_access?.access_level,
      is_active: true,
    },
    userAccess: response.user_access ?? null,
    statistics: response.statistics ?? null,
    projectGroups: Array.isArray(response.project_groups)
      ? response.project_groups
      : [],
  };
}

export function useProjectDetails(
  projectHash?: string
): UseProjectDetailsReturn {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [statistics, setStatistics] = useState<ProjectStatistics | null>(null);
  const [projectGroups, setProjectGroups] = useState<ProjectGroupInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectHash) {
      setProject(null);
      setUserAccess(null);
      setStatistics(null);
      setProjectGroups([]);
      setError('Project ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await projectService.getProject(projectHash);

      if (response.success && response.project) {
        const mapped = mapProjectResponse(response);
        setProject(mapped.project);
        setUserAccess(mapped.userAccess);
        setStatistics(mapped.statistics);
        setProjectGroups(mapped.projectGroups);
      } else {
        setProject(null);
        setUserAccess(null);
        setStatistics(null);
        setProjectGroups([]);
        setError(response.message || 'Failed to load project data');
      }
    } catch (err) {
      setProject(null);
      setUserAccess(null);
      setStatistics(null);
      setProjectGroups([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load project. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [projectHash]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  return {
    project,
    userAccess,
    statistics,
    projectGroups,
    isLoading,
    error,
    refetch: fetchProject,
    updateProjectState: setProject,
  };
}

export default useProjectDetails;
