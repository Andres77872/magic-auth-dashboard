import { useCallback, useState } from 'react';
import { useAsyncData } from '@/hooks/useAsyncData';
import { projectService } from '@/services/project.service';
import { userService } from '@/services/user.service';
import type { ComboboxOption } from './EntityCombobox';

/** `GET /projects` returns 10 rows by default; 500 is its maximum page size. */
const PROJECT_OPTIONS_LIMIT = 500;
const USER_OPTIONS_LIMIT = 20;

export interface PickerOptionsState {
  options: ComboboxOption[];
  isLoading: boolean;
  error: string | null;
  /** True when the page limit was reached, so some entities may be missing. */
  truncated: boolean;
}

/**
 * Projects the caller can see (root: all active projects; admin: the projects
 * they administer), as combobox options filtered locally.
 */
export function useProjectOptions(enabled = true): PickerOptionsState {
  const fetcher = useCallback(async (): Promise<ComboboxOption[]> => {
    const response = await projectService.getProjects({
      limit: PROJECT_OPTIONS_LIMIT,
    });
    return response.projects.map((project) => ({
      value: project.project_hash,
      label: project.project_name,
      description: project.project_description || undefined,
    }));
  }, []);
  const { data, isLoading, error } = useAsyncData(fetcher, { enabled });
  const options = data ?? [];
  return {
    options,
    isLoading,
    error,
    truncated: options.length >= PROJECT_OPTIONS_LIMIT,
  };
}

/**
 * Users matching a server-side search (`GET /users/list?search=`), for owner
 * pickers. Call `search(query)` from the combobox's `onSearchChange`.
 */
export function useUserOptions(
  enabled = true
): PickerOptionsState & { search: (query: string) => void } {
  const [query, setQuery] = useState('');
  const fetcher = useCallback(async (): Promise<ComboboxOption[]> => {
    const response = await userService.getUsers({
      search: query || undefined,
      limit: USER_OPTIONS_LIMIT,
    });
    return response.users.map((user) => ({
      value: user.user_hash,
      label: user.username,
      description: user.email
        ? `${user.email} · ${user.user_type}`
        : user.user_type,
    }));
  }, [query]);
  const { data, isLoading, isRefreshing, error } = useAsyncData(fetcher, {
    enabled,
  });
  const options = data ?? [];
  return {
    options,
    isLoading: isLoading || isRefreshing,
    error,
    truncated: options.length >= USER_OPTIONS_LIMIT,
    search: setQuery,
  };
}
