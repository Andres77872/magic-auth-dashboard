import { useCallback } from 'react';
import { userService } from '@/services/user.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { UserListParams, UserListResponse } from '@/types/user.types';
import type { User, UserType } from '@/types/auth.types';
import type { PaginationResponse } from '@/types/api.types';

export interface UseUsersOptions {
  limit?: number;
  offset?: number;
  search?: string;
  userType?: UserType;
  /** Include deactivated accounts (the API hides them by default). */
  includeInactive?: boolean;
  sortBy?: UserListParams['sort_by'];
  sortOrder?: UserListParams['sort_order'];
  enabled?: boolean;
}

export interface UseUsersReturn {
  users: User[];
  pagination: PaginationResponse | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Alias of `refetch`, kept for older callers. */
  fetchUsers: () => Promise<void>;
}

/** One page of `GET /users/list` for the given filters. */
export function useUsers({
  limit = 25,
  offset = 0,
  search,
  userType,
  includeInactive = false,
  sortBy,
  sortOrder,
  enabled = true,
}: UseUsersOptions = {}): UseUsersReturn {
  const fetcher = useCallback(
    (): Promise<UserListResponse> =>
      userService.getUsers({
        limit,
        offset,
        search: search?.trim() || undefined,
        user_type_filter: userType,
        include_inactive: includeInactive,
        sort_by: sortBy,
        sort_order: sortBy ? sortOrder : undefined,
      }),
    [limit, offset, search, userType, includeInactive, sortBy, sortOrder]
  );

  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );

  return {
    users: data?.users ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isRefreshing,
    error,
    refetch,
    fetchUsers: refetch,
  };
}

export default useUsers;
