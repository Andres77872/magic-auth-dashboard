import { useCallback, useEffect, useState } from 'react';
import { groupService } from '@/services';
import type {
  GroupDetailsResponse,
  GroupFormData,
  UserGroup,
} from '@/types/group.types';

interface GroupStatistics {
  total_members: number;
  total_projects: number;
}

interface UseGroupDetailsReturn {
  group: UserGroup | null;
  statistics: GroupStatistics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateGroup: (data: GroupFormData) => Promise<UserGroup>;
}

function mapGroupResponse(response: GroupDetailsResponse): {
  group: UserGroup;
  statistics: GroupStatistics | null;
} {
  return {
    group: response.user_group,
    statistics: response.statistics
      ? {
          total_members: response.statistics.total_members,
          total_projects: response.statistics.total_projects,
        }
      : null,
  };
}

export function useGroupDetails(groupHash?: string): UseGroupDetailsReturn {
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [statistics, setStatistics] = useState<GroupStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupHash) {
      setGroup(null);
      setStatistics(null);
      setError('Group ID is required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await groupService.getGroup(groupHash);

      if (response.success && response.user_group) {
        const mapped = mapGroupResponse(response);
        setGroup(mapped.group);
        setStatistics(mapped.statistics);
      } else {
        setGroup(null);
        setStatistics(null);
        setError(response.message || 'Failed to fetch group');
      }
    } catch (err) {
      setGroup(null);
      setStatistics(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch group');
    } finally {
      setIsLoading(false);
    }
  }, [groupHash]);

  const updateGroup = useCallback(
    async (data: GroupFormData): Promise<UserGroup> => {
      if (!groupHash) {
        throw new Error('Group ID is required');
      }

      const response = await groupService.updateGroup(groupHash, data);

      if (response.success && response.user_group) {
        setGroup(response.user_group);
        return response.user_group;
      }

      throw new Error(response.message || 'Failed to update group');
    },
    [groupHash]
  );

  useEffect(() => {
    void fetchGroup();
  }, [fetchGroup]);

  return {
    group,
    statistics,
    isLoading,
    error,
    refetch: fetchGroup,
    updateGroup,
  };
}

export default useGroupDetails;
