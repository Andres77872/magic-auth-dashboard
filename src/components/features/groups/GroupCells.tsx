import React from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';

interface NameCellProps {
  to: string;
  name: string;
  description?: string | null;
  /** Badges shown after the name. */
  badges?: React.ReactNode;
  /** Leading visual (avatar, icon). */
  leading?: React.ReactNode;
}

/**
 * Primary table cell: the entity name as a link (keyboard reachable; rows are
 * also clickable) with an optional one-line description underneath.
 */
export function NameCell({
  to,
  name,
  description,
  badges,
  leading,
}: NameCellProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {leading}
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to={to}
            data-no-row-click
            className="truncate rounded-sm text-[13px] font-medium text-foreground no-underline hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {name}
          </Link>
          {badges}
        </div>
        {description && (
          <p className="m-0 max-w-[56ch] truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/** Relative time with the absolute timestamp on hover. */
export function TimeCell({
  value,
}: {
  value: string | null | undefined;
}): React.JSX.Element {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <time
      dateTime={value}
      title={formatDateTime(value)}
      className="whitespace-nowrap text-muted-foreground"
    >
      {formatRelativeTime(value)}
    </time>
  );
}
