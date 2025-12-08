import { useState, useEffect, useCallback } from 'react';
import { userService } from '@/services';
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

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { limit = 10, initialFilters = {} } = options;

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<UseUsersFilters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: UserListParams = {
        limit,
        offset: (currentPage - 1) * limit,
        search: filters.search,
        user_type_filter: filters.userType as any,
        include_inactive: filters.isActive === false ? true : filters.isActive === true ? false : undefined,
        ...(sortBy && { sort_by: sortBy }),
        ...(sortBy && { sort_order: sortOrder }),
      };

      const response = await userService.getUsers(params);
      
      if (response.success && response.users) {
        setUsers(response.users);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [limit, currentPage, filters.search, filters.userType, filters.isActive, sortBy, sortOrder]);

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

  return {
    users,
    pagination,
    isLoading,
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