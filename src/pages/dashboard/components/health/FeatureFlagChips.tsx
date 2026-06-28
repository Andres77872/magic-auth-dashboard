/**
 * FeatureFlagChips — renders an object of booleans (e.g. `feature_flags` or
 * Stripe `capabilities`) as a wrap of enabled/disabled chips.
 */

import React from 'react';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toneClasses } from '@/lib/status-tone';
import { humanizeKey } from '@/lib/health-format';

export function FeatureFlagChips({
  flags,
}: {
  flags?: Record<string, unknown>;
}): React.JSX.Element | null {
  const entries = Object.entries(flags ?? {}).filter(
    ([, value]) => typeof value === 'boolean'
  );

  if (!entries.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, enabled]) => (
        <Badge
          key={key}
          variant="outline"
          size="sm"
          className={cn(enabled ? toneClasses('success') : toneClasses('muted'))}
        >
          {enabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {humanizeKey(key)}
        </Badge>
      ))}
    </div>
  );
}

export default FeatureFlagChips;
