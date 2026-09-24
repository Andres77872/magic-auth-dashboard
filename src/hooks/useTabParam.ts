import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps a page's active tab in the URL (`?tab=`), so tabs are shareable and
 * survive back/forward. Unknown or disallowed values fall back to the default.
 * Changing tab preserves every other query parameter and pushes a history entry.
 */
export function useTabParam<T extends string>(
  validTabs: readonly T[],
  defaultTab: T,
  paramName = 'tab'
): [T, (tab: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(paramName);
  const activeTab =
    raw !== null && (validTabs as readonly string[]).includes(raw)
      ? (raw as T)
      : defaultTab;

  const setTab = useCallback(
    (tab: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(paramName, tab);
        return next;
      });
    },
    [paramName, setSearchParams]
  );

  return [activeTab, setTab];
}

export default useTabParam;
