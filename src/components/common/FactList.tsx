import React from 'react';
import { cn } from '@/lib/utils';

export interface Fact {
  label: string;
  value: React.ReactNode;
  /** Render the value in the mono face (ids, hashes, timestamps). */
  mono?: boolean;
}

export interface FactListProps {
  facts: Fact[];
  /** `rows` stacks label/value pairs; `grid` lays them out in two columns on wider panels. */
  layout?: 'rows' | 'grid';
  className?: string;
}

/** Label/value pairs for detail pages (a styled `<dl>`). */
export function FactList({
  facts,
  layout = 'rows',
  className,
}: FactListProps): React.JSX.Element {
  return (
    <dl
      className={cn(
        'm-0 text-[13px]',
        layout === 'grid'
          ? 'grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2'
          : 'divide-y divide-border',
        className
      )}
    >
      {facts.map((fact) => (
        <div
          key={fact.label}
          className={cn(
            'flex min-w-0 gap-4',
            layout === 'grid'
              ? 'flex-col gap-1'
              : 'items-center justify-between py-2.5 first:pt-0 last:pb-0'
          )}
        >
          <dt className="shrink-0 text-xs text-muted-foreground">
            {fact.label}
          </dt>
          <dd
            className={cn(
              'm-0 min-w-0 text-foreground',
              layout === 'rows' && 'text-right',
              fact.mono && 'font-mono text-xs'
            )}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default FactList;
