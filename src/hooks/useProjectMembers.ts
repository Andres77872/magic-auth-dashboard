import { useState, useCallback } from 'react';
import { projectService } from '@/services';
import type { PaginationParams } from '@/types/api.types';

interface ProjectMember {
  user_hash: string;
  username: string;
  email: string;
  role: string;
  added_at: string;
}

interface UseProjectMembersReturn {
  members: ProjectMember[];
  isLoading: boolean;
  error: string | null;
  fetchMembers: (projectHash: string, params?: PaginationParams) => Promise<void>;
  addMember: (projectHash: string, userHash: string) => Promise<void>;
  removeMember: (projectHash: string, userHash: string) => Promise<void>;
}

export function useProjectMembers(): UseProjectMembersReturn {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (projectHash: string, params: PaginationParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectService.getProjectMembers(projectHash, params);
      
      if (response.success) {
        setMembers((response as any).members || []);
      } else {
        setError(response.message || 'Failed to fetch project members');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addMember = useCallback(async (projectHash: string, userHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectService.addProjectMember(projectHash, userHash);
      
      if (response.success) {
        // Refresh the members list
        await fetchMembers(projectHash);
      } else {
        setError(response.message || 'Failed to add project member');
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

  const removeMember = useCallback(async (projectHash: string, userHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectService.removeProjectMember(projectHash, userHash);
      
      if (response.success) {
        // Remove from local state
        setMembers(prev => prev.filter(m => m.user_hash !== userHash));
      } else {
        setError(response.message || 'Failed to remove project member');
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

  return {
    members,
    isLoading,
    error,
    fetchMembers,
    addMember,
    removeMember,
  };
}

export default useProjectMembers;
