import { useCallback } from 'react';
import { groupService, BULK_MEMBERS_MAX } from '@/services/group.service';
import { userService } from '@/services/user.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { BulkAddMembersResult } from '@/types/group.types';

export interface UseGroupMemberActionsReturn {
  /**
   * Add users to the group. One user goes through `POST …/members` (a clear
   * error for that user); several go through the bulk route. Resolves with
   * per-user outcomes; the bulk route reports failures without an HTTP error.
   */
  addMembers: (userHashes: string[]) => Promise<BulkAddMembersResult>;
  removeMember: (userHash: string) => Promise<void>;
}

export function useGroupMemberActions(
  groupHash: string | undefined
): UseGroupMemberActionsReturn {
  const addMembers = useCallback(
    async (userHashes: string[]): Promise<BulkAddMembersResult> => {
      if (!groupHash) throw new Error('Missing user group id.');
      if (userHashes.length > BULK_MEMBERS_MAX) {
        throw new Error(
          `You can add up to ${BULK_MEMBERS_MAX} users at a time.`
        );
      }
      if (userHashes.length === 1) {
        const [userHash] = userHashes;
        try {
          await groupService.addMemberToGroup(groupHash, {
            user_hash: userHash,
          });
          return { requested: 1, succeeded: 1, failed: 0, failures: [] };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Could not add this user.';
          return {
            requested: 1,
            succeeded: 0,
            failed: 1,
            failures: [{ user_hash: userHash, username: null, message }],
          };
        }
      }
      return groupService.bulkAddMembers(groupHash, userHashes);
    },
    [groupHash]
  );

  const removeMember = useCallback(
    async (userHash: string): Promise<void> => {
      if (!groupHash) throw new Error('Missing user group id.');
      await groupService.removeMemberFromGroup(groupHash, userHash);
    },
    [groupHash]
  );

  return { addMembers, removeMember };
}

export interface MemberCandidate {
  user_hash: string;
  username: string;
  email: string | null;
  user_type: string;
}

export interface UseMemberCandidatesReturn {
  candidates: MemberCandidate[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Active users matching `search` (`GET /users/list`, 50 at a time) for the add-members picker. */
export function useMemberCandidates(
  search: string,
  enabled: boolean
): UseMemberCandidatesReturn {
  const fetcher = useCallback(async (): Promise<MemberCandidate[]> => {
    const res = await userService.getUsers({
      limit: 50,
      search: search.trim() || undefined,
      sort_by: 'username',
      sort_order: 'asc',
      include_group_info: false,
      include_project_access: false,
    });
    if (!Array.isArray(res.users))
      throw new Error(
        'Unexpected response from the server while loading users.'
      );
    return res.users.map((user) => ({
      user_hash: user.user_hash,
      username: user.username,
      email: user.email ?? null,
      user_type: user.user_type,
    }));
  }, [search]);
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    { enabled }
  );
  return { candidates: data ?? [], isLoading, isRefreshing, error, refetch };
}

export default useGroupMemberActions;
