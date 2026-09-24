import { useCallback, useSyncExternalStore } from 'react';

/** Subscribe to a CSS media query; `false` where matchMedia is unavailable. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia)
        return () => undefined;
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = (): boolean =>
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia(query).matches;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default useMediaQuery;
