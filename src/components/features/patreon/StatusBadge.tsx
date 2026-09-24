/**
 * StatusBadge — Patreon status pill using the design system's semantic badge
 * tints (the same quiet pills Billing and OAuth use).
 */

import React from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { StatusTone } from '@/lib/status-tone';
import { patreonStatusLabel } from '@/types/patreon.types';
import { statusTone } from './patreon-status-tone';

const TONE_VARIANT: Record<StatusTone, NonNullable<BadgeProps['variant']>> = {
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  info: 'info',
  muted: 'secondary',
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status?: string | null;
  /** Override the displayed text; the tone still follows `status`. */
  label?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <Badge
      variant={TONE_VARIANT[statusTone(status ?? undefined)]}
      className={className}
    >
      {label ?? patreonStatusLabel(status)}
    </Badge>
  );
}

export default StatusBadge;
