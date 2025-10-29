import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Use refs to store current values to avoid recreating fetchProjects
  const limitRef = useRef(limit);
  const currentPageRef = useRef(currentPage);
  const filtersRef = useRef(filters);
  const sortByRef = useRef(sortBy);
  const sortOrderRef = useRef(sortOrder);

  // Keep refs in sync with state
  useEffect(() => {
    limitRef.current = limit;
    currentPageRef.current = currentPage;
    filtersRef.current = filters;
    sortByRef.current = sortBy;
    sortOrderRef.current = sortOrder;
  }, [limit, currentPage, filters, sortBy, sortOrder]);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ProjectListParams = {
        limit: limitRef.current,
        offset: (currentPageRef.current - 1) * limitRef.current,
        search: filtersRef.current.search,
        ...(sortByRef.current && { sort_by: sortByRef.current }),
        ...(sortByRef.current && { sort_order: sortOrderRef.current }),
      };

      const response = await projectService.getProjects(params);

      /**
       * The backend may return the project list in two different envelope formats:
       * 1. Direct list (legacy) – `{ success, message, projects, pagination, ... }`
       * 2. Wrapped inside a `data` property – `{ success, message, data: { projects, pagination, ... } }`
       *
       * To make the UI resilient to either variation, we normalise the response
       * by checking both locations before updating state.
       */
      const projectsPayload = (response as any).projects ?? (response as any).data?.projects;
      const paginationPayload = (response as any).pagination ?? (response as any).data?.pagination;

      if (response.success && Array.isArray(projectsPayload)) {
        setProjects(projectsPayload);
        if (paginationPayload) {
          setPagination(paginationPayload);
        }
      } else {
        setError(response.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Fetch on mount and when state changes
  useEffect(() => {
    fetchProjects();
  }, [currentPage, filters.search, sortBy, sortOrder]);

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