import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

// Map priority levels to semantic Badge variants
type PriorityConfig = {
  level: string;
  variant: VariantProps<typeof Badge>['variant'];
};

function getPriorityConfig(priority: number): PriorityConfig {
  if (priority >= 900) {
    return { level: 'Critical', variant: 'subtleDestructive' };
  }
  if (priority >= 700) {
    return { level: 'High', variant: 'subtleWarning' };
  }
  if (priority >= 400) {
    return { level: 'Medium', variant: 'subtleInfo' };
  }
  return { level: 'Low', variant: 'subtle' };
}

interface PriorityBadgeProps {
  priority: number;
  showValue?: boolean;
  className?: string;
}

export function PriorityBadge({
  priority,
  showValue = true,
  className,
}: PriorityBadgeProps): React.JSX.Element {
  const config = getPriorityConfig(priority);

  return (
    <Badge variant={config.variant} className={className}>
      {config.level}
      {showValue && `: ${priority}`}
    </Badge>
  );
}

export default PriorityBadge;
