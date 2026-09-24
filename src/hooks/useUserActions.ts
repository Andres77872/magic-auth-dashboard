import { useCallback, useState } from 'react';
import { userService } from '@/services/user.service';
import type { UserType } from '@/types/auth.types';
import type { ResetPasswordResponse } from '@/types/user.types';

export type UserActionKind =
  | 'deactivate'
  | 'delete'
  | 'hardDelete'
  | 'resetPassword'
  | 'changeType'
  | 'bulkDeactivate'
  | 'bulkDelete';

interface UseUserActionsReturn {
  /** The action currently in flight, if any. */
  pending: UserActionKind | null;
  isLoading: boolean;
  deactivateUser: (userHash: string) => Promise<void>;
  deleteUser: (userHash: string) => Promise<void>;
  hardDeleteUser: (userHash: string) => Promise<void>;
  resetPassword: (userHash: string) => Promise<ResetPasswordResponse>;
  changeUserType: (userHash: string, userType: UserType) => Promise<void>;
  bulkDeactivate: (
    userHashes: string[]
  ) => Promise<{ succeeded: number; failed: number }>;
  bulkDelete: (
    userHashes: string[]
  ) => Promise<{ succeeded: number; failed: number }>;
}

/**
 * Account mutations. Each call resolves only after the API confirms the
 * change and rejects with the backend's message otherwise; callers own the
 * toast and the refresh.
 */
export function useUserActions(): UseUserActionsReturn {
  const [pending, setPending] = useState<UserActionKind | null>(null);

  const run = useCallback(
    async <T>(kind: UserActionKind, action: () => Promise<T>): Promise<T> => {
      setPending(kind);
      try {
        return await action();
      } finally {
        setPending(null);
      }
    },
    []
  );

  const deactivateUser = useCallback(
    (userHash: string) =>
      run('deactivate', async () => {
        await userService.setUserActive(userHash, false);
      }),
    [run]
  );

  const deleteUser = useCallback(
    (userHash: string) =>
      run('delete', async () => {
        await userService.deleteUser(userHash);
      }),
    [run]
  );

  const hardDeleteUser = useCallback(
    (userHash: string) =>
      run('hardDelete', async () => {
        await userService.hardDeleteUser(userHash);
      }),
    [run]
  );

  const resetPassword = useCallback(
    (userHash: string) =>
      run('resetPassword', () => userService.resetUserPassword(userHash)),
    [run]
  );

  const changeUserType = useCallback(
    (userHash: string, userType: UserType) =>
      run('changeType', async () => {
        await userService.changeUserType(userHash, userType);
      }),
    [run]
  );

  const bulkDeactivate = useCallback(
    (userHashes: string[]) =>
      run('bulkDeactivate', async () => {
        const res = await userService.bulkDeactivateUsers(userHashes);
        return {
          succeeded: res.summary?.success_count ?? 0,
          failed: res.summary?.error_count ?? 0,
        };
      }),
    [run]
  );

  const bulkDelete = useCallback(
    (userHashes: string[]) =>
      run('bulkDelete', async () => {
        const res = await userService.bulkDeleteUsers(userHashes);
        return {
          succeeded: res.summary?.success_count ?? 0,
          failed: res.summary?.error_count ?? 0,
        };
      }),
    [run]
  );

  return {
    pending,
    isLoading: pending !== null,
    deactivateUser,
    deleteUser,
    hardDeleteUser,
    resetPassword,
    changeUserType,
    bulkDeactivate,
    bulkDelete,
  };
}

export default useUserActions;
