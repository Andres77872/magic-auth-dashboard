import { useCallback, useState } from 'react';
import { groupService, GROUP_MEMBERS_PAGE_MAX } from '@/services/group.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { GroupMember } from '@/types/group.types';

export interface UseUsersByGroupOptions {
  /** Page size, capped at 100 by the backend. Defaults to 25. */
  limit?: number;
}

export interface UseUsersByGroupReturn {
  members: GroupMember[];
  /** Full member count. */
  total: number | undefined;
  offset: number;
  limit: number;
  setOffset: (offset: number) => void;
  setLimit: (limit: number) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** One page of a user group's active members (`GET /admin/user-groups/{hash}/members`, sorted by username). */
export function useUsersByGroup(
  groupHash: string | undefined,
  { limit: initialLimit = 25 }: UseUsersByGroupOptions = {}
): UseUsersByGroupReturn {
  const [limit, setLimitState] = useState(
    Math.min(initialLimit, GROUP_MEMBERS_PAGE_MAX)
  );
  const [offset, setOffsetState] = useState(0);

  const fetcher = useCallback(() => {
    if (!groupHash) return Promise.reject(new Error('Missing user group id.'));
    return groupService.getGroupMembers(groupHash, { limit, offset });
  }, [groupHash, limit, offset]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(groupHash) }
  );

  const setOffset = useCallback(
    (next: number) => setOffsetState(Math.max(0, next)),
    []
  );
  const setLimit = useCallback((next: number) => {
    setLimitState(Math.min(Math.max(1, next), GROUP_MEMBERS_PAGE_MAX));
    setOffsetState(0);
  }, []);

  return {
    members: data?.members ?? [],
    total: data?.total,
    offset,
    limit,
    setOffset,
    setLimit,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

export default useUsersByGroup;
