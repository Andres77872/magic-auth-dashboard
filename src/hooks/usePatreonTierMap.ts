/**
 * usePatreonTierMap
 *
 * ROOT-only read hook for the configured Patreon tier map (no server pagination).
 */

import { useCallback, useEffect, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PatreonTierMapEntry } from '@/types/patreon.types';

interface UsePatreonTierMapReturn {
  entries: PatreonTierMapEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatreonTierMap(): UsePatreonTierMapReturn {
  const [entries, setEntries] = useState<PatreonTierMapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setEntries(await patreonService.getTierMap());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Patreon tier map');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async (): Promise<void> => {
      try {
        const data = await patreonService.getTierMap();
        if (active) setEntries(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load Patreon tier map');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, []);

  return { entries, isLoading, error, refetch };
}

export default usePatreonTierMap;
