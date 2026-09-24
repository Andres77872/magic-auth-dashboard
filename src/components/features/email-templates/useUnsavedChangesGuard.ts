/**
 * useUnsavedChangesGuard
 *
 * The app uses a component <BrowserRouter> (not a data router), so
 * react-router's `useBlocker` is unavailable. While `when` is true this hook:
 * - asks the browser to confirm reloads / tab closes (`beforeunload`);
 * - intercepts plain left-clicks on same-origin links (sidebar, breadcrumbs,
 *   menus) before react-router handles them, and parks the destination so the
 *   caller can ask for confirmation, then `proceed()` or `cancel()`.
 *
 * Not covered: the browser back/forward buttons and programmatic navigation.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface UnsavedChangesGuard {
  /** In-app destination waiting for confirmation, or `null`. */
  pendingPath: string | null;
  proceed: () => void;
  cancel: () => void;
}

export function useUnsavedChangesGuard(when: boolean): UnsavedChangesGuard {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const currentPath = useRef('');

  useEffect(() => {
    currentPath.current = `${location.pathname}${location.search}${location.hash}`;
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!when) return undefined;

    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      // Legacy browsers only show the prompt when returnValue is set.
      event.returnValue = '';
    };

    const onClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (
        (anchor.target && anchor.target !== '_self') ||
        anchor.hasAttribute('download')
      )
        return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const path = `${url.pathname}${url.search}${url.hash}`;
      if (path === currentPath.current) return;

      // Capture phase on document runs before React's root listener, so the
      // router never sees this click.
      event.preventDefault();
      event.stopPropagation();
      setPendingPath(path);
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onClick, true);
    return (): void => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onClick, true);
    };
  }, [when]);

  const proceed = useCallback((): void => {
    if (pendingPath === null) return;
    setPendingPath(null);
    void navigate(pendingPath);
  }, [navigate, pendingPath]);

  const cancel = useCallback((): void => setPendingPath(null), []);

  return { pendingPath, proceed, cancel };
}
