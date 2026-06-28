/**
 * MetricTile — compact label + value tile for a single "hero" health signal.
 * Mirrors the Patreon `MetricCard` look, with an optional tone for emphasis.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { StatusTone } from '@/lib/status-tone';

const toneTextClass: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
  muted: 'text-foreground',
};

interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: StatusTone;
  hint?: string;
}

export function MetricTile({
  label,
  value,
  icon,
  tone = 'muted',
  hint,
}: MetricTileProps): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className={cn('text-xl font-semibold', toneTextClass[tone])}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default MetricTile;
