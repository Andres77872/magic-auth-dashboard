import React from 'react';
import { useApiStatus } from '@/hooks/useApiStatus';
import { cn } from '@/lib/utils';
import { API_CONFIG } from '@/utils/constants';

function apiHost(): string {
  try {
    return new URL(API_CONFIG.BASE_URL).host;
  } catch {
    return API_CONFIG.BASE_URL;
  }
}

/** Live reachability of the API from this browser (public `GET /system/ping`). */
export function ApiStatusPill(): React.JSX.Element {
  const { status, latencyMs } = useApiStatus();

  const label =
    status === 'checking'
      ? 'Checking the API…'
      : status === 'online'
        ? `API online${latencyMs === null ? '' : ` · ${latencyMs} ms`}`
        : 'API unreachable from this browser';

  return (
    <p
      role="status"
      className="m-0 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          status === 'online' && 'bg-success',
          status === 'offline' && 'bg-destructive',
          status === 'checking' && 'animate-pulse bg-muted-foreground'
        )}
      />
      <span className="text-foreground">{label}</span>{' '}
      <span className="hidden truncate font-mono text-[11px] sm:inline">
        {apiHost()}
      </span>
    </p>
  );
}

export default ApiStatusPill;
