import React from 'react';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';

/** Stops clicks inside a cell (links, menus — including portalled menu items) from opening the row. */
export function NoRowClick({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      data-no-row-click
      onClick={(event) => event.stopPropagation()}
      className="inline-flex max-w-full"
    >
      {children}
    </div>
  );
}

export function RelativeTime({
  value,
  empty,
}: {
  value: string | null;
  empty: string;
}): React.JSX.Element {
  if (!value) return <span className="text-muted-foreground">{empty}</span>;
  return (
    <time
      dateTime={value}
      title={formatDateTime(value)}
      className="text-muted-foreground"
    >
      {formatRelativeTime(value)}
    </time>
  );
}
