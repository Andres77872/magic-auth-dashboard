/**
 * Run `onRefresh` whenever the page-level refresh counter changes (not on mount;
 * each tab already loads on mount).
 */

import { useEffect, useRef } from 'react';

export function useRefreshSignal(signal: number, onRefresh: () => void): void {
  const last = useRef(signal);
  const callback = useRef(onRefresh);

  useEffect(() => {
    callback.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (signal === last.current) return;
    last.current = signal;
    callback.current();
  }, [signal]);
}
