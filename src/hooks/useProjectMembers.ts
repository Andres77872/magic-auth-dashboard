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
}

/**
 * Hook for fetching project members.
 * 
 * Note: Direct member management (add/remove) is not available through this API.
 * Users gain project access through the Groups-of-Groups architecture:
 * User -> User Group -> Project Group -> Project
 * 
 * To manage project access, use the group management APIs instead.
 */
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

  return {
    members,
    isLoading,
    error,
    fetchMembers,
  };
}

export default useProjectMembers;
