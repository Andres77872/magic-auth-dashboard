import { useState, useEffect, useCallback } from 'react';
import { projectService } from '@/services';
import type { ProjectListParams, ProjectDetails } from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';

interface UseProjectsFilters {
  search?: string;
}

interface UseProjectsOptions {
  limit?: number;
  initialFilters?: UseProjectsFilters;
}

interface UseProjectsReturn {
  projects: ProjectDetails[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  setFilters: (filters: UseProjectsFilters) => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  filters: UseProjectsFilters;
  currentPage: number;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
}

export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { limit = 10, initialFilters = {} } = options;

  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<UseProjectsFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ProjectListParams = {
        limit,
        offset: (currentPage - 1) * limit,
        search: filters.search,
        ...(sortBy && { sort_by: sortBy }),
        ...(sortBy && { sort_order: sortOrder }),
      };

      const response = await projectService.getProjects(params);
      
      if (response.success && response.projects) {
        setProjects(response.projects);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [limit, currentPage, filters.search, sortBy, sortOrder]);

  const setFilters = useCallback((newFilters: UseProjectsFilters) => {
    setFiltersState(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setSort = useCallback((newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    pagination,
    isLoading,
    error,
    fetchProjects,
    setFilters,
    setPage,
    setSort,
    filters,
    currentPage,
    sortBy,
    sortOrder,
  };
} 