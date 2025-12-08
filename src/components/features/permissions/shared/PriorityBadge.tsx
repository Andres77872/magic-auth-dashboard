import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PriorityConfig {
  level: string;
  bg: string;
  text: string;
}

function getPriorityConfig(priority: number): PriorityConfig {
  if (priority >= 900) {
    return { level: 'Critical', bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' };
  }
  if (priority >= 700) {
    return { level: 'High', bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300' };
  }
  if (priority >= 400) {
    return { level: 'Medium', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' };
  }
  return { level: 'Low', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' };
}

interface PriorityBadgeProps {
  priority: number;
  showValue?: boolean;
  className?: string;
}

export function PriorityBadge({ priority, showValue = true, className }: PriorityBadgeProps): React.JSX.Element {
  const config = getPriorityConfig(priority);

  return (
    <Badge
      variant="secondary"
      className={cn(config.bg, config.text, 'border-0', className)}
    >
      {config.level}{showValue && `: ${priority}`}
    </Badge>
  );
}

export default PriorityBadge;
