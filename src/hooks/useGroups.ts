import { useCallback, useState } from 'react';
import { groupService } from '@/services/group.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type {
  GroupFormData,
  GroupSortField,
  UpdatedGroup,
  UserGroup,
} from '@/types/group.types';

/** Delay before a typed search is sent to the server. */
export const GROUP_SEARCH_DEBOUNCE_MS = 300;

export interface GroupListSort {
  field: GroupSortField;
  order: 'asc' | 'desc';
}

export interface GroupListQuery {
  /** Text in the search box (sent to the server after a short pause). */
  searchInput: string;
  setSearchInput: (value: string) => void;
  /** The search currently applied to the results. */
  search: string;
  sort: GroupListSort;
  setSort: (sort: GroupListSort) => void;
  offset: number;
  setOffset: (offset: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
}

/**
 * Search/sort/pagination state shared by the group lists. Changing the search,
 * sort or page size returns to the first page.
 */
export function useGroupListQuery(
  initialLimit: number,
  initialSort: GroupListSort
): GroupListQuery {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(
    searchInput.trim(),
    GROUP_SEARCH_DEBOUNCE_MS
  );
  const [sort, setSortState] = useState(initialSort);
  const [limit, setLimitState] = useState(initialLimit);
  // The offset belongs to the search it was chosen for; a new search starts at 0.
  const [page, setPage] = useState({ search, offset: 0 });
  const offset = page.search === search ? page.offset : 0;

  const setOffset = useCallback(
    (next: number) => setPage({ search, offset: Math.max(0, next) }),
    [search]
  );
  const setSort = useCallback(
    (next: GroupListSort) => {
      setSortState(next);
      setPage({ search, offset: 0 });
    },
    [search]
  );
  const setLimit = useCallback(
    (next: number) => {
      setLimitState(next);
      setPage({ search, offset: 0 });
    },
    [search]
  );

  return {
    searchInput,
    setSearchInput,
    search,
    sort,
    setSort,
    offset,
    setOffset,
    limit,
    setLimit,
  };
}

export interface UseGroupsOptions {
  /** Page size (1–1000). Defaults to 25. */
  limit?: number;
  enabled?: boolean;
}

export interface UseGroupsReturn extends GroupListQuery {
  groups: UserGroup[];
  /**
   * Total active groups, or `undefined` while a search is active: the backend
   * count ignores `search`, so it can't describe the matches.
   */
  total: number | undefined;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Server-paginated list of user groups (`GET /admin/user-groups`). */
export function useGroups({
  limit: initialLimit = 25,
  enabled = true,
}: UseGroupsOptions = {}): UseGroupsReturn {
  const query = useGroupListQuery(initialLimit, {
    field: 'group_name',
    order: 'asc',
  });
  const { search, sort, offset, limit } = query;

  const fetcher = useCallback(
    () =>
      groupService.listGroups({
        limit,
        offset,
        search: search || undefined,
        sort_by: sort.field,
        sort_order: sort.order,
      }),
    [limit, offset, search, sort.field, sort.order]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );

  return {
    ...query,
    groups: data?.groups ?? [],
    total: search || data?.total == null ? undefined : data.total,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}

export interface UserGroupMutations {
  createGroup: (data: GroupFormData) => Promise<UserGroup>;
  updateGroup: (
    groupHash: string,
    data: GroupFormData
  ) => Promise<UpdatedGroup>;
  deleteGroup: (groupHash: string) => Promise<void>;
}

/**
 * Create, edit and delete user groups. Each call resolves only after the API
 * confirms; failures reject with the backend message (e.g. 403 when a non-root
 * operator touches an `admin_…` group, 409 for a taken name).
 */
export function useUserGroupMutations(): UserGroupMutations {
  const createGroup = useCallback(
    (data: GroupFormData) => groupService.createUserGroup(data),
    []
  );
  const updateGroup = useCallback(
    (groupHash: string, data: GroupFormData) =>
      groupService.updateGroup(groupHash, data),
    []
  );
  const deleteGroup = useCallback(
    (groupHash: string) => groupService.deleteGroup(groupHash),
    []
  );
  return { createGroup, updateGroup, deleteGroup };
}

export default useGroups;
