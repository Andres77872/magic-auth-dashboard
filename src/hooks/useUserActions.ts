import { useState, useCallback } from 'react';
import { userService } from '@/services';
import type { User } from '@/types/auth.types';

interface UseUserActionsReturn {
  isLoading: boolean;
  error: string | null;
  deleteUser: (userHash: string) => Promise<void>;
  toggleUserStatus: (userHash: string, isActive: boolean) => Promise<User>;
  resetPassword: (userHash: string) => Promise<{ new_password: string }>;
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
      
      if (response.success && response.data) {
        return response.data as User;
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

  const resetPassword = useCallback(async (userHash: string): Promise<{ new_password: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.resetUserPassword(userHash);
      
      if (response.success && response.data) {
        return response.data as { new_password: string };
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
      
      if (response.success && response.data) {
        return response.data as User;
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
