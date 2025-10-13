import { useState, useEffect, useCallback, useRef } from 'react';
import { cache } from '@/utils/cache';

export interface OptimisticQueryOptions<T> {
  queryKey: string;
  queryFn: () => Promise<T>;
  cacheTTL?: number;
  staleWhileRevalidate?: boolean; // Show stale data while fetching fresh
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

export interface OptimisticQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isRefetching: boolean;
  isStale: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Optimistic data fetching hook that eliminates blink effect
 * - Returns cached data immediately
 * - Fetches fresh data in background
 * - Smoothly updates when fresh data arrives
 */
export function useOptimisticQuery<T>(
  options: OptimisticQueryOptions<T>
): OptimisticQueryResult<T> {
  const {
    queryKey,
    queryFn,
    cacheTTL = 5 * 60 * 1000,
    staleWhileRevalidate = true,
    onSuccess,
    onError,
    enabled = true,
  } = options;

  // Check for cached data immediately
  const cachedData = cache.get<T>(queryKey);
  const staleData = cache.getStale<T>(queryKey);

  const [data, setData] = useState<T | null>(cachedData || staleData);
  const [isLoading, setIsLoading] = useState(!cachedData && !staleData);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isStale, setIsStale] = useState(!!staleData && !cachedData);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if component is mounted
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (fetchingRef.current || !enabled) return;
    
    fetchingRef.current = true;
    const hasExistingData = data !== null;

    try {
      // Set appropriate loading state
      if (hasExistingData) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const freshData = await queryFn();

      if (mountedRef.current) {
        setData(freshData);
        setIsStale(false);
        cache.set(queryKey, freshData, cacheTTL);
        onSuccess?.(freshData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Query failed');
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
      fetchingRef.current = false;
    }
  }, [queryKey, queryFn, cacheTTL, data, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.clear(queryKey);
    setIsStale(true);
  }, [queryKey]);

  // Initial fetch or refetch when enabled changes
  useEffect(() => {
    if (enabled) {
      // If we have cached data, skip initial loading
      if (cachedData) {
        setData(cachedData);
        setIsLoading(false);
        setIsStale(false);
      } 
      // If stale-while-revalidate and we have stale data, show it
      else if (staleWhileRevalidate && staleData) {
        setData(staleData);
        setIsLoading(false);
        setIsStale(true);
        fetchData(); // Fetch fresh data in background
      } 
      // No data, fetch fresh
      else {
        fetchData();
      }
    }
  }, [enabled, queryKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    isRefetching,
    isStale,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Optimistic mutation hook with automatic cache invalidation
 */
export interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateQueries?: string[]; // Query keys to invalidate
}

export interface OptimisticMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
}

export function useOptimisticMutation<TData, TVariables>(
  options: OptimisticMutationOptions<TData, TVariables>
): OptimisticMutationResult<TData, TVariables> {
  const {
    mutationFn,
    onSuccess,
    onError,
    invalidateQueries = [],
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      
      // Invalidate related queries
      invalidateQueries.forEach(key => {
        cache.clear(key);
      });

      onSuccess?.(result, variables);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Mutation failed');
      setError(error);
      onError?.(error, variables);
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, onSuccess, onError, invalidateQueries]);

  return {
    mutate,
    isLoading,
    error,
    data,
  };
}
