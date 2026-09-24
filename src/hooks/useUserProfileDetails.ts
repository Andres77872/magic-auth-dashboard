import { useCallback } from 'react';
import { userService } from '@/services/user.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import { ApiError } from '@/utils/error-handler';
import type { User } from '@/types/auth.types';

interface UseUserProfileDetailsReturn {
  user: User | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  /** The API reports unknown and deactivated accounts as not found. */
  notFound: boolean;
  refetch: () => Promise<void>;
}

const NOT_FOUND = 'USER_NOT_FOUND';

/**
 * A single user with group hierarchy and per-project permission details
 * (`GET /users/{hash}?include_group_hierarchy=true&include_permission_details=true`).
 * The response's top-level `permissions`/`groups`/`statistics` are always empty
 * server-side, so only `user` is used.
 */
export function useUserProfileDetails(
  userHash?: string
): UseUserProfileDetailsReturn {
  const fetcher = useCallback(async (): Promise<User> => {
    if (!userHash) throw new Error(NOT_FOUND);
    try {
      const res = await userService.getUserByHash(userHash, {
        include_group_hierarchy: true,
        include_permission_details: true,
      });
      if (!res.user) throw new Error(NOT_FOUND);
      return res.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404)
        throw new Error(NOT_FOUND, { cause: error });
      throw error;
    }
  }, [userHash]);

  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(userHash) }
  );
  const notFound = error === NOT_FOUND || !userHash;

  return {
    user: data,
    isLoading: Boolean(userHash) && isLoading,
    isRefreshing,
    error: notFound ? null : error,
    notFound,
    refetch,
  };
}

export default useUserProfileDetails;
