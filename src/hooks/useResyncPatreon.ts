/**
 * useResyncPatreon
 *
 * ROOT-only action hook to enqueue a manual Patreon resync (per-user or full sweep).
 * Returns the server's decision: `accepted: false` (sync disabled, user not
 * linked, …) is a normal outcome for the caller to present, not an exception.
 * Transport/validation failures still throw.
 */

import { useCallback, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type {
  PatreonResyncRequest,
  PatreonResyncResult,
} from '@/types/patreon.types';

interface UseResyncPatreonReturn {
  resync: (request: PatreonResyncRequest) => Promise<PatreonResyncResult>;
  isResyncing: boolean;
  error: string | null;
}

export function useResyncPatreon(): UseResyncPatreonReturn {
  const [isResyncing, setIsResyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resync = useCallback(
    async (request: PatreonResyncRequest): Promise<PatreonResyncResult> => {
      setIsResyncing(true);
      setError(null);
      try {
        return await patreonService.resync(request);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to enqueue Patreon resync';
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setIsResyncing(false);
      }
    },
    []
  );

  return { resync, isResyncing, error };
}

export default useResyncPatreon;
