import { useState, useEffect, useCallback, useRef } from 'react';
import { projectGroupService } from '@/services';
import type { 
  ProjectGroup, 
  CreateProjectGroupRequest,
  ProjectGroupListResponse
} from '@/services/project-group.service';
import type { PaginationResponse, PaginationParams } from '@/types/api.types';

interface UseProjectGroupsFilters {
  search?: string;
}

interface UseProjectGroupsOptions {
  limit?: number;
  initialFilters?: UseProjectGroupsFilters;
}

interface UseProjectGroupsReturn {
  projectGroups: ProjectGroup[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchProjectGroups: (params?: Partial<PaginationParams>) => Promise<void>;
  setFilters: (filters: Partial<PaginationParams>) => void;
  createProjectGroup: (groupData: CreateProjectGroupRequest) => Promise<ProjectGroup>;
  updateProjectGroup: (groupHash: string, groupData: Partial<CreateProjectGroupRequest>) => Promise<ProjectGroup>;
  deleteProjectGroup: (groupHash: string) => Promise<void>;
  assignToProject: (groupHash: string, projectHash: string) => Promise<void>;
  removeFromProject: (groupHash: string, projectHash: string) => Promise<void>;
  filters: PaginationParams;
}

export function useProjectGroups(options: UseProjectGroupsOptions = {}): UseProjectGroupsReturn {
  const { limit = 20, initialFilters = {} } = options;

  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<PaginationParams>({
    limit,
    offset: 0,
    search: initialFilters.search || '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Use ref to store current filters to avoid recreating fetchProjectGroups on every filter change
  const filtersRef = useRef(filters);
  
  // Keep ref in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchProjectGroups = useCallback(async (params?: Partial<PaginationParams>) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = { ...filtersRef.current, ...params };
      const response: ProjectGroupListResponse = await projectGroupService.getProjectGroups(queryParams);
      
      if (response.success && response.project_groups) {
        setProjectGroups(response.project_groups);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Failed to fetch project groups');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProjectGroup = useCallback(async (groupData: CreateProjectGroupRequest): Promise<ProjectGroup> => {
    try {
      const response = await projectGroupService.createProjectGroup(groupData);
      if (response.success && response.project_group) {
        setProjectGroups(prev => [response.project_group, ...prev]);
        return response.project_group;
      } else {
        throw new Error(response.message || 'Failed to create project group');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const updateProjectGroup = useCallback(async (
    groupHash: string, 
    groupData: Partial<CreateProjectGroupRequest>
  ): Promise<ProjectGroup> => {
    try {
      const response = await projectGroupService.updateProjectGroup(groupHash, groupData);
      if (response.success && response.project_group) {
        setProjectGroups(prev => prev.map(group => 
          group.group_hash === groupHash ? response.project_group : group
        ));
        return response.project_group;
      } else {
        throw new Error(response.message || 'Failed to update project group');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteProjectGroup = useCallback(async (groupHash: string): Promise<void> => {
    try {
      const response = await projectGroupService.deleteProjectGroup(groupHash);
      if (response.success) {
        setProjectGroups(prev => prev.filter(group => group.group_hash !== groupHash));
      } else {
        throw new Error(response.message || 'Failed to delete project group');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const assignToProject = useCallback(async (groupHash: string, projectHash: string): Promise<void> => {
    try {
      const response = await projectGroupService.assignProjectToGroup(groupHash, projectHash);
      if (!response.success) {
        throw new Error(response.message || 'Failed to assign project to project group');
      }
      // Refresh project groups to get updated project_count
      fetchProjectGroups();
    } catch (error) {
      throw error;
    }
  }, [fetchProjectGroups]);

  const removeFromProject = useCallback(async (groupHash: string, projectHash: string): Promise<void> => {
    try {
      const response = await projectGroupService.removeProjectFromGroup(groupHash, projectHash);
      if (!response.success) {
        throw new Error(response.message || 'Failed to remove project from project group');
      }
      // Refresh project groups to get updated project_count
      fetchProjectGroups();
    } catch (error) {
      throw error;
    }
  }, [fetchProjectGroups]);

  const setFilters = useCallback((newFilters: Partial<PaginationParams>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  useEffect(() => {
    fetchProjectGroups();
  }, []);

  return {
    projectGroups,
    pagination,
    isLoading,
    error,
    fetchProjectGroups,
    setFilters,
    createProjectGroup,
    updateProjectGroup,
    deleteProjectGroup,
    assignToProject,
    removeFromProject,
    filters,
  };
} 