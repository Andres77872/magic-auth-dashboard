import { useState, useEffect, useCallback } from 'react';
import { groupService } from '@/services';
import type { GroupMember } from '@/types/group.types';

interface UseUsersByGroupReturn {
  users: GroupMember[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUsersByGroup(groupHash?: string): UseUsersByGroupReturn {
  const [users, setUsers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroupMembers = useCallback(async () => {
    if (!groupHash) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: any = await groupService.getGroupMembers(groupHash);
      
      if (response.success) {
        // API returns members as a top-level array field, NOT in data
        // Try multiple possible locations based on API structure
        let membersData = [];
        
        // API returns members as a top-level array field per documentation
        if (Array.isArray(response.members)) {
          membersData = response.members;
        } else if (Array.isArray(response.data)) {
          membersData = response.data;
        }
        
        setUsers(membersData);
      } else {
        setError(response.message || 'Failed to fetch group members');
        setUsers([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupHash]);

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  return {
    users,
    isLoading,
    error,
    refetch: fetchGroupMembers,
  };
}
