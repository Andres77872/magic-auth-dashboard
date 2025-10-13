import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '@/services';
import { cache, generateCacheKey } from '@/utils/cache';
import type { UserListParams } from '@/types/user.types';
import type { User } from '@/types/auth.types';
import type { PaginationResponse } from '@/types/api.types';

interface UseUsersFilters {
  search?: string;
  userType?: string;
  isActive?: boolean;
}

interface UseUsersOptions {
  limit?: number;
  initialFilters?: UseUsersFilters;
}

interface UseUsersReturn {
  users: User[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  setFilters: (filters: UseUsersFilters) => void;
  setPage: (page: number) => void;
  setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  filters: UseUsersFilters;
  currentPage: number;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
}

/**
 * Optimized users hook with caching and optimistic rendering
 * Eliminates blink effect by showing cached data while fetching
 */
export function useUsersOptimized(options: UseUsersOptions = {}): UseUsersReturn {
  const { limit = 10, initialFilters = {} } = options;

  const [filters, setFiltersState] = useState<UseUsersFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Generate cache key based on current params
  const getCacheKey = useCallback(() => {
    return generateCacheKey('users', {
      limit,
      offset: (currentPage - 1) * limit,
      search: filters.search,
      userType: filters.userType,
      isActive: filters.isActive,
      sortBy,
      sortOrder,
    });
  }, [limit, currentPage, filters, sortBy, sortOrder]);

  // Check for cached data immediately
  const cacheKey = getCacheKey();
  const cachedData = cache.get<{ users: User[]; pagination: PaginationResponse | null }>(cacheKey);
  const staleData = cache.getStale<{ users: User[]; pagination: PaginationResponse | null }>(cacheKey);

  const [users, setUsers] = useState<User[]>(cachedData?.users || staleData?.users || []);
  const [pagination, setPagination] = useState<PaginationResponse | null>(
    cachedData?.pagination || staleData?.pagination || null
  );
  const [isLoading, setIsLoading] = useState(!cachedData && !staleData);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchUsers = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    const hasExistingData = users.length > 0;

    try {
      // Set appropriate loading state
      if (hasExistingData) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params: UserListParams = {
        limit,
        offset: (currentPage - 1) * limit,
        search: filters.search,
        user_type: filters.userType as any,
        is_active: filters.isActive,
        ...(sortBy && { sort_by: sortBy }),
        ...(sortBy && { sort_order: sortOrder }),
      };

      const response = await userService.getUsers(params);

      if (mountedRef.current) {
        if (response.success && response.users) {
          setUsers(response.users);
          if (response.pagination) {
            setPagination(response.pagination);
          }

          // Cache the result
          const cacheData = {
            users: response.users,
            pagination: response.pagination || null,
          };
          cache.set(cacheKey, cacheData, 2 * 60 * 1000); // 2 minute cache
        } else {
          setError(response.message || 'Failed to fetch users');
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
      fetchingRef.current = false;
    }
  }, [limit, currentPage, filters.search, filters.userType, filters.isActive, sortBy, sortOrder, cacheKey, users.length]);

  const setFilters = useCallback((newFilters: UseUsersFilters) => {
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
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    users,
    pagination,
    isLoading,
    isRefetching,
    error,
    fetchUsers,
    setFilters,
    setPage,
    setSort,
    filters,
    currentPage,
    sortBy,
    sortOrder,
  };
}
