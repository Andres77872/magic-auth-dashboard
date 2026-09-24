/**
 * Small presentational helpers shared by the Patreon admin views.
 */

import React from 'react';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';

function relative(value: string): string {
  const diffSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1000
  );
  // Near-future times (next retry, expiry) read better as "in 15m" than as a date.
  if (diffSeconds > 0 && diffSeconds < 24 * 60 * 60) {
    if (diffSeconds < 60) return 'in <1m';
    if (diffSeconds < 3600) return `in ${Math.round(diffSeconds / 60)}m`;
    return `in ${Math.round(diffSeconds / 3600)}h`;
  }
  return formatRelativeTime(value);
}

/** Relative time ("5m ago", "in 15m") with the absolute time on hover; "—" when empty. */
export function Timestamp({
  value,
  className,
}: {
  value: string | null | undefined;
  className?: string;
}): React.JSX.Element {
  if (!value) {
    return (
      <span className={className ?? 'text-sm text-muted-foreground'}>—</span>
    );
  }
  return (
    <time
      dateTime={value}
      title={formatDateTime(value)}
      className={className ?? 'text-sm text-muted-foreground'}
    >
      {relative(value)}
    </time>
  );
}
