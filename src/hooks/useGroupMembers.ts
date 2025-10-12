import { useState, useCallback } from 'react';
import { groupService } from '@/services';
import type { PaginationParams } from '@/types/api.types';

interface GroupMember {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  added_at: string;
}

interface UseGroupMembersReturn {
  members: GroupMember[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: (groupHash: string, params?: PaginationParams) => Promise<void>;
  addMember: (groupHash: string, userHash: string) => Promise<void>;
  removeMember: (groupHash: string, userHash: string) => Promise<void>;
  bulkAddMembers: (groupHash: string, userHashes: string[]) => Promise<void>;
}

export function useGroupMembers(): UseGroupMembersReturn {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (groupHash: string, params: PaginationParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await groupService.getGroupMembers(groupHash, params);
      
      if (response.success && response.data) {
        setMembers(Array.isArray(response.data) ? response.data : []);
      } else {
        setError(response.message || 'Failed to fetch group members');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMember = useCallback(async (groupHash: string, userHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await groupService.addMemberToGroup(groupHash, { user_hash: userHash });
      
      if (response.success) {
        // Refresh the members list
        await fetchMembers(groupHash);
      } else {
        setError(response.message || 'Failed to add group member');
        throw new Error(response.message || 'Failed to add member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMembers]);

  const removeMember = useCallback(async (groupHash: string, userHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await groupService.removeMemberFromGroup(groupHash, userHash);
      
      if (response.success) {
        // Remove from local state
        setMembers(prev => prev.filter(m => m.user_hash !== userHash));
      } else {
        setError(response.message || 'Failed to remove group member');
        throw new Error(response.message || 'Failed to remove member');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkAddMembers = useCallback(async (groupHash: string, userHashes: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await groupService.bulkAddMembers(groupHash, userHashes);
      
      if (response.success) {
        // Refresh the members list
        await fetchMembers(groupHash);
      } else {
        setError(response.message || 'Failed to bulk add members');
        throw new Error(response.message || 'Failed to bulk add members');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchMembers]);

  return {
    members,
    isLoading,
    error,
    fetchMembers,
    addMember,
    removeMember,
    bulkAddMembers,
  };
}

export default useGroupMembers;
