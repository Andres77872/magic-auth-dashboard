import { useState, useEffect, useCallback, useRef } from 'react';
import { auditService } from '@/services/audit.service';

/**
 * Return type for the useActivityTypes hook
 */
export interface UseActivityTypesReturn {
  activityTypes: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Module-level cache for activity types
let cachedActivityTypes: string[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for fetching available activity types with caching
 * 
 * Requirements: 2.1
 */
export function useActivityTypes(): UseActivityTypesReturn {
  const [activityTypes, setActivityTypes] = useState<string[]>(cachedActivityTypes || []);
  const [isLoading, setIsLoading] = useState(!cachedActivityTypes);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Check if cache is still valid
   */
  const isCacheValid = useCallback(() => {
    if (!cachedActivityTypes || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_DURATION;
  }, []);

  /**
   * Fetch activity types from the API
   */
  const fetchActivityTypes = useCallback(async (forceRefresh: boolean = false) => {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      setActivityTypes(cachedActivityTypes!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const types = await auditService.getActivityTypes();

      if (!isMountedRef.current) return;

      // Update cache
      cachedActivityTypes = types;
      cacheTimestamp = Date.now();

      setActivityTypes(types);
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch activity types');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isCacheValid]);

  /**
   * Force refetch activity types
   */
  const refetch = useCallback(async () => {
    await fetchActivityTypes(true);
  }, [fetchActivityTypes]);

  // Initial fetch
  useEffect(() => {
    fetchActivityTypes();
  }, [fetchActivityTypes]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    activityTypes,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Clear the activity types cache (useful for testing)
 */
export function clearActivityTypesCache(): void {
  cachedActivityTypes = null;
  cacheTimestamp = null;
}

export default useActivityTypes;
