/**
 * usePatreonEntitlementHistory
 *
 * ROOT-only read of one user's entitlement transitions, newest first. Only
 * fetches while a non-null userHash is supplied (used by the detail drawer).
 */

import { useCallback, useEffect, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PatreonHistoryItem } from '@/types/patreon.types';

interface UsePatreonEntitlementHistoryReturn {
  items: PatreonHistoryItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatreonEntitlementHistory(
  userHash: string | null
): UsePatreonEntitlementHistoryReturn {
  const [items, setItems] = useState<PatreonHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userHash) return;
    setIsLoading(true);
    setError(null);
    try {
      setItems(await patreonService.getEntitlementHistory(userHash));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load entitlement history'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userHash]);

  useEffect(() => {
    if (!userHash) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await patreonService.getEntitlementHistory(userHash);
        if (active) setItems(data);
      } catch (err) {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load entitlement history'
          );
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [userHash]);

  return { items, isLoading, error, refetch };
}

export default usePatreonEntitlementHistory;
