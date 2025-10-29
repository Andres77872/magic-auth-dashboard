import { useState, useEffect, useCallback, useRef } from 'react';
import { groupService } from '@/services';
import type { UserGroup, GroupListParams, GroupFormData } from '@/types/group.types';
import type { PaginationResponse } from '@/types/api.types';

interface UseGroupsFilters {
  search?: string;
}

interface UseGroupsOptions {
  limit?: number;
  initialFilters?: UseGroupsFilters;
}

interface UseGroupsReturn {
  groups: UserGroup[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchGroups: (params?: Partial<GroupListParams>) => Promise<void>;
  setFilters: (filters: Partial<GroupListParams>) => void;
  createGroup: (groupData: GroupFormData) => Promise<UserGroup>;
  updateGroup: (groupHash: string, groupData: GroupFormData) => Promise<UserGroup>;
  deleteGroup: (groupHash: string) => Promise<void>;
  filters: GroupListParams;
}

export function useGroups(options: UseGroupsOptions = {}): UseGroupsReturn {
  const { limit = 20, initialFilters = {} } = options;

  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<GroupListParams>({
    limit,
    offset: 0,
    search: initialFilters.search || '',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Use ref to store current filters to avoid recreating fetchGroups on every filter change
  const filtersRef = useRef(filters);
  const isFetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  
  // Keep ref in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchGroups = useCallback(async (params?: Partial<GroupListParams>) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = { ...filtersRef.current, ...params };
      const response = await groupService.getGroups(queryParams);
      
      if (response.success && response.user_groups) {
        setGroups(response.user_groups);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Failed to fetch groups');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  const createGroup = useCallback(async (groupData: GroupFormData): Promise<UserGroup> => {
    try {
      const response = await groupService.createGroup(groupData);
      if (response.success && response.user_group) {
        setGroups(prev => [response.user_group, ...prev]);
        return response.user_group;
      } else {
        throw new Error(response.message || 'Failed to create group');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const updateGroup = useCallback(async (groupHash: string, groupData: GroupFormData): Promise<UserGroup> => {
    try {
      const response = await groupService.updateGroup(groupHash, groupData);
      if (response.success && response.user_group) {
        setGroups(prev => prev.map(group => 
          group.group_hash === groupHash ? response.user_group : group
        ));
        return response.user_group;
      } else {
        throw new Error(response.message || 'Failed to update group');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const deleteGroup = useCallback(async (groupHash: string): Promise<void> => {
    try {
      const response = await groupService.deleteGroup(groupHash);
      if (response.success) {
        setGroups(prev => prev.filter(group => group.group_hash !== groupHash));
      } else {
        throw new Error(response.message || 'Failed to delete group');
      }
    } catch (error) {
      throw error;
    }
  }, []);

  const setFilters = useCallback((newFilters: Partial<GroupListParams>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Fetch only once on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchGroups();
    }
  }, [fetchGroups]);

  return {
    groups,
    pagination,
    isLoading,
    error,
    fetchGroups,
    setFilters,
    createGroup,
    updateGroup,
    deleteGroup,
    filters,
  };
} 