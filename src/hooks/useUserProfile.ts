import { useState, useCallback } from 'react';
import { userService } from '@/services';
import type { User } from '@/types/auth.types';

interface UpdateProfileData {
  username?: string;
  email?: string;
  full_name?: string;
  phone?: string;
}

interface UseUserProfileReturn {
  profile: User | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  accessSummary: any | null;
  fetchAccessSummary: () => Promise<void>;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<User | null>(null);
  const [accessSummary, setAccessSummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getProfile();
      
      if (response.success && response.data) {
        setProfile(response.data as User);
      } else {
        setError(response.message || 'Failed to fetch user profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.updateProfile(data);
      
      if (response.success && response.user) {
        setProfile(response.user);
      } else {
        setError(response.message || 'Failed to update profile');
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAccessSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getUserAccessSummary();
      
      if (response.success && response.data) {
        setAccessSummary(response.data);
      } else {
        setError(response.message || 'Failed to fetch access summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    accessSummary,
    fetchAccessSummary,
  };
}

export default useUserProfile;
