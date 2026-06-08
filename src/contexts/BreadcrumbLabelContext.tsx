/**
 * BreadcrumbLabelContext
 *
 * Lets detail pages publish a human-friendly label (e.g. a username or
 * project name) for the current entity, which the layout's <Breadcrumbs />
 * renders in place of the raw URL hash ("Users › 12345678…" → "Users › John Doe").
 *
 * The app uses <BrowserRouter> + <Routes> (component routes), so react-router's
 * data-router `useMatches`/`handle` APIs are unavailable — a small context is
 * the simplest way for a page rendered into <Outlet /> to communicate up to the
 * breadcrumb trail in the header.
 *
 * The label is reset to null on every pathname change so a stale name never
 * bleeds onto the next page during the gap before its data loads.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';


interface BreadcrumbLabelContextValue {
  label: string | null;
  setLabel: (label: string | null) => void;
}

// Default to a no-op so consumers (e.g. <Breadcrumbs />) render fine without a
// provider — they simply fall back to the URL hash for the leaf label.
const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue>({
  label: null,
  setLabel: () => {},
});

export function BreadcrumbLabelProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [label, setLabel] = useState<string | null>(null);
  const location = useLocation();

  // Clear the label whenever the path changes so the previous entity's name
  // doesn't flash on the next page before its own label is set. Uses the
  // "adjust state during render" pattern rather than an effect.
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setLabel(null);
  }

  const value = useMemo(() => ({ label, setLabel }), [label]);

  return (
    <BreadcrumbLabelContext.Provider value={value}>
      {children}
    </BreadcrumbLabelContext.Provider>
  );
}

/** Read the current breadcrumb entity label (used by <Breadcrumbs />). */
export function useBreadcrumbLabel(): BreadcrumbLabelContextValue {
  return useContext(BreadcrumbLabelContext);
}

/**
 * Convenience hook for detail pages: publishes `label` for the current route
 * and clears it on unmount. Pass the entity name once available (it can be
 * undefined/null while data loads — the breadcrumb falls back to the hash).
 */
export function useSetBreadcrumbLabel(
  label: string | null | undefined
): void {
  const { setLabel } = useBreadcrumbLabel();
  useEffect(() => {
    setLabel(label ?? null);
    return () => setLabel(null);
  }, [label, setLabel]);
}

export default BreadcrumbLabelContext;
