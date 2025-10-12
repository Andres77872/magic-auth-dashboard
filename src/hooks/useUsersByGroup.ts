import { useState, useEffect, useCallback } from 'react';
import { groupService } from '@/services';
import type { User } from '@/types/auth.types';

interface UseUsersByGroupReturn {
  users: User[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUsersByGroup(groupHash?: string): UseUsersByGroupReturn {
  const [users, setUsers] = useState<User[]>([]);
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
      console.log('getGroupMembers FULL response:', response);
      console.log('Response keys:', Object.keys(response));
      
      if (response.success) {
        // API returns members as a top-level array field, NOT in data
        // Try multiple possible locations based on API structure
        let membersData = [];
        
        if (Array.isArray(response.members)) {
          membersData = response.members;
        } else if (Array.isArray(response.data)) {
          membersData = response.data;
        } else if (response.user_groups) {
          // Sometimes the response might be nested differently
          membersData = response.user_groups;
        }
        
        console.log('Members data extracted:', membersData);
        console.log('Is array?', Array.isArray(membersData));
        console.log('Length:', membersData.length);
        
        setUsers(membersData);
      } else {
        console.error('API returned success=false:', response.message);
        setError(response.message || 'Failed to fetch group members');
        setUsers([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setUsers([]);
      console.error('Error fetching group members:', err);
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
