import { useState, useCallback } from 'react';
import { userService } from '@/services';
import type { User } from '@/types/auth.types';

interface ResetPasswordResult {
  success: boolean;
  message: string;
  expiresAt?: string;
}

interface UseUserActionsReturn {
  isLoading: boolean;
  error: string | null;
  deleteUser: (userHash: string) => Promise<void>;
  toggleUserStatus: (userHash: string, isActive: boolean) => Promise<User>;
  resetPassword: (userHash: string) => Promise<ResetPasswordResult>;
  changeUserType: (userHash: string, newType: string) => Promise<User>;
}

export function useUserActions(): UseUserActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteUser = useCallback(async (userHash: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.deleteUser(userHash);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleUserStatus = useCallback(async (userHash: string, isActive: boolean): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.toggleUserStatus(userHash, isActive);
      
      if (response.success) {
        // Backend returns {user_hash, is_active} - NOT a full User object
        // Refetch to get the updated User with all fields
        const userResponse = await userService.getUserByHash(userHash);
        if (userResponse.success && userResponse.user) {
          return userResponse.user;
        }
        throw new Error('Failed to fetch updated user details');
      } else {
        throw new Error(response.message || 'Failed to update user status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (userHash: string): Promise<ResetPasswordResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.resetUserPassword(userHash);
      
      if (response.success) {
        // Backend returns {success, message, user, reset_data: {expires_at, must_change_on_login}}
        // NO password is returned - password is delivered out-of-band
        return {
          success: true,
          message: 'Password reset successfully. User will be prompted to change on next login.',
          expiresAt: response.reset_data?.expires_at
        };
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeUserType = useCallback(async (userHash: string, newType: string): Promise<User> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.changeUserType(userHash, newType);
      
      if (response.success) {
        // Backend returns {user_hash, previous_type, new_type} - NOT a full User object
        // Refetch to get the updated User with all fields
        const userResponse = await userService.getUserByHash(userHash);
        if (userResponse.success && userResponse.user) {
          return userResponse.user;
        }
        throw new Error('Failed to fetch updated user details');
      } else {
        throw new Error(response.message || 'Failed to change user type');
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
    isLoading,
    error,
    deleteUser,
    toggleUserStatus,
    resetPassword,
    changeUserType,
  };
}

export default useUserActions;
