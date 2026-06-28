/**
 * HealthStatusBadge — color-coded badge for any `/system/health` status string.
 *
 * Unlike the Patreon `StatusBadge`, this is not tied to `patreonStatusLabel`, so
 * it renders arbitrary/unknown statuses (which degrade to a neutral tone).
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { statusTone, toneClasses } from '@/lib/status-tone';

function statusLabel(status?: string): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

export function HealthStatusBadge({
  status,
  className,
}: {
  status?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <Badge
      variant="outline"
      size="sm"
      className={cn('capitalize', toneClasses(statusTone(status)), className)}
    >
      {statusLabel(status)}
    </Badge>
  );
}

export default HealthStatusBadge;
