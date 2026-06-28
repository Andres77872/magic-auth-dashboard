/**
 * usePatreonEntitlement
 *
 * ROOT-only detail hook for a single user's Patreon entitlement. Only fetches
 * when a non-null userHash is supplied (used by the detail drawer).
 */

import { useCallback, useEffect, useState } from 'react';
import { patreonService } from '@/services/patreon.service';
import type { PatreonEntitlementDetail } from '@/types/patreon.types';

interface UsePatreonEntitlementReturn {
  detail: PatreonEntitlementDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePatreonEntitlement(userHash: string | null): UsePatreonEntitlementReturn {
  const [detail, setDetail] = useState<PatreonEntitlementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userHash) return;
    setIsLoading(true);
    setError(null);
    try {
      setDetail(await patreonService.getEntitlement(userHash));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entitlement detail');
    } finally {
      setIsLoading(false);
    }
  }, [userHash]);

  useEffect(() => {
    if (!userHash) return undefined;
    let active = true;
    // All state updates live inside the async callback so the effect body itself
    // performs no synchronous setState.
    void (async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await patreonService.getEntitlement(userHash);
        if (active) setDetail(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load entitlement detail');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [userHash]);

  return { detail, isLoading, error, refetch };
}

export default usePatreonEntitlement;
