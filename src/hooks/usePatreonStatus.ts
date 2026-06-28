/**
 * usePatreonStatus
 *
 * ROOT-only read hook for the Patreon operations dashboard.
 */

import { useCallback, useEffect, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PatreonAdminStatus } from '@/types/patreon.types';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface UsePatreonStatusReturn {
  status: PatreonAdminStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatreonStatus(options?: { autoFetch?: boolean }): UsePatreonStatusReturn {
  const autoFetch = options?.autoFetch ?? true;
  const [status, setStatus] = useState<PatreonAdminStatus | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStatus(await patreonService.getStatus());
    } catch (err) {
      setError(errorMessage(err, 'Failed to load Patreon status'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const data = await patreonService.getStatus();
        if (active) setStatus(data);
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load Patreon status'));
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [autoFetch]);

  return { status, isLoading, error, refetch };
}

export default usePatreonStatus;
