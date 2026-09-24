import React from 'react';
import { CopyableId } from '@/components/common/CopyableId';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/utils/formatters';

/** Placeholder for a group details page while it loads. */
export function GroupDetailsSkeleton({
  statCount,
}: {
  statCount: number;
}): React.JSX.Element {
  return (
    <div aria-busy="true" aria-label="Loading group">
      <div className="mb-6 flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: statCount }).map((_, index) => (
          <Skeleton key={index} className="h-[92px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="mb-4 h-8 w-80 max-w-full" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}

/** Tinted tile used as the detail page's header icon. */
export function GroupIconTile({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground [&_svg]:h-5 [&_svg]:w-5">
      {children}
    </span>
  );
}

/** Identifier and creation date under the page title. */
export function GroupFacts({
  groupHash,
  createdAt,
}: {
  groupHash: string;
  createdAt: string | null;
}): React.JSX.Element {
  return (
    <dl className="m-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <dt>ID</dt>
        <dd className="m-0">
          <CopyableId id={groupHash} label="Group ID" />
        </dd>
      </div>
      <div className="flex items-center gap-2">
        <dt>Created</dt>
        <dd className="m-0 text-foreground" title={formatDateTime(createdAt)}>
          {formatDate(createdAt)}
        </dd>
      </div>
    </dl>
  );
}
