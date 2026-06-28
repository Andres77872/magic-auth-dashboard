/**
 * StatusBadge — shared color-coded status badge for Patreon management views.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { patreonStatusLabel } from '@/types/patreon.types';
import { statusTone, toneClasses } from './patreon-status-tone';

export function StatusBadge({ status }: { status?: string }): React.JSX.Element {
  return (
    <Badge variant="outline" className={cn('capitalize', toneClasses(statusTone(status)))}>
      {patreonStatusLabel(status)}
    </Badge>
  );
}

export default StatusBadge;
