/**
 * useResyncPatreon
 *
 * ROOT-only action hook to enqueue a manual Patreon resync (per-user or full sweep).
 * Throws when the backend declines the request so callers can surface a toast.
 */

import { useCallback, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PatreonResyncRequest, PatreonResyncResult } from '@/types/patreon.types';

interface UseResyncPatreonReturn {
  resync: (request: PatreonResyncRequest) => Promise<PatreonResyncResult>;
  isResyncing: boolean;
  error: string | null;
}

export function useResyncPatreon(): UseResyncPatreonReturn {
  const [isResyncing, setIsResyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resync = useCallback(async (request: PatreonResyncRequest): Promise<PatreonResyncResult> => {
    setIsResyncing(true);
    setError(null);
    try {
      const result = await patreonService.resync(request);
      if (!result.accepted) {
        throw new Error(result.message || `Resync not accepted (${result.status})`);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enqueue Patreon resync';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsResyncing(false);
    }
  }, []);

  return { resync, isResyncing, error };
}

export default useResyncPatreon;
