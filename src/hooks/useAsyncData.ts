import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncDataOptions {
  /** Skip fetching (e.g. while unauthenticated or for a role that can't access it). */
  enabled?: boolean;
  /** Background refresh interval. Paused while the tab is hidden. */
  pollIntervalMs?: number;
}

export interface AsyncDataState<T> {
  data: T | null;
  error: string | null;
  /** True only until the first response arrives — use for skeletons. */
  isLoading: boolean;
  /** True while a background or manual refresh is in flight. */
  isRefreshing: boolean;
  updatedAt: Date | null;
  refetch: () => Promise<void>;
}

/**
 * Load data from a memoised fetcher, optionally polling. Keeps the previous
 * data on screen during refreshes so polling never flashes skeletons, and
 * ignores responses that arrive after a newer request or after unmount.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  { enabled = true, pollIntervalMs }: AsyncDataOptions = {}
): AsyncDataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [inFlight, setInFlight] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (): Promise<void> => {
    const id = ++requestId.current;
    setInFlight((n) => n + 1);
    try {
      const result = await fetcher();
      if (!mounted.current || id !== requestId.current) return;
      setData(result);
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return;
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while loading this data.'
      );
    } finally {
      if (mounted.current) {
        setInFlight((n) => Math.max(0, n - 1));
        if (id === requestId.current) setHasLoaded(true);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    const kickoff = window.setTimeout(() => void run(), 0);
    if (!pollIntervalMs) return () => window.clearTimeout(kickoff);

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void run();
    }, pollIntervalMs);
    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(interval);
    };
  }, [enabled, pollIntervalMs, run]);

  return {
    data,
    error,
    isLoading: enabled && !hasLoaded,
    isRefreshing: inFlight > 0 && hasLoaded,
    updatedAt,
    refetch: run,
  };
}

export default useAsyncData;
