/**
 * ChipList — renders a string array (e.g. `missing`, `degraded`,
 * `critical_mismatches`) as colored chips. An empty array reads as a calm
 * "None" rather than an error.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { toneClasses, type StatusTone } from '@/lib/status-tone';

export function ChipList({
  items,
  tone = 'warning',
  emptyLabel = 'None',
}: {
  items?: unknown[];
  tone?: StatusTone;
  emptyLabel?: string;
}): React.JSX.Element {
  const list = (items ?? []).map((item) => String(item));

  if (!list.length) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((item) => (
        <Badge key={item} variant="outline" size="sm" className={toneClasses(tone)}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

export default ChipList;
