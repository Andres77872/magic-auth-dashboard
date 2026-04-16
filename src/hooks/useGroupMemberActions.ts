import { useCallback, useState } from 'react';
import { groupService } from '@/services';

interface UseGroupMemberActionsReturn {
  isLoading: boolean;
  error: string | null;
  bulkAddMembers: (userHashes: string[]) => Promise<void>;
  removeMember: (userHash: string) => Promise<void>;
}

export function useGroupMemberActions(
  groupHash?: string
): UseGroupMemberActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bulkAddMembers = useCallback(
    async (userHashes: string[]) => {
      if (!groupHash) {
        throw new Error('Group ID is required');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await groupService.bulkAddMembers(
          groupHash,
          userHashes
        );

        if (!response.success) {
          throw new Error(response.message || 'Failed to add members');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add members';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [groupHash]
  );

  const removeMember = useCallback(
    async (userHash: string) => {
      if (!groupHash) {
        throw new Error('Group ID is required');
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await groupService.removeMemberFromGroup(
          groupHash,
          userHash
        );

        if (!response.success) {
          throw new Error(response.message || 'Failed to remove member');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to remove member';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [groupHash]
  );

  return {
    isLoading,
    error,
    bulkAddMembers,
    removeMember,
  };
}

export default useGroupMemberActions;
