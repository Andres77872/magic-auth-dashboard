/**
 * useBackNavigation Hook
 *
 * Returns a "go back" handler that prefers true browser-history back
 * (restoring the previous URL + scroll position) but safely falls back to a
 * provided route when there is no in-app history to return to.
 *
 * Detection uses react-router's `location.key`, which is the string
 * `'default'` only on the first entry of a browsing session (fresh tab,
 * deep link, or hard reload). Any in-app navigation produces a non-default
 * key, guaranteeing `navigate(-1)` lands on an in-app page rather than
 * escaping the application.
 */
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useBackNavigation(fallbackRoute: string): () => void {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.key && location.key !== 'default') {
      void navigate(-1);
    } else {
      void navigate(fallbackRoute);
    }
  }, [navigate, location.key, fallbackRoute]);
}

export default useBackNavigation;
