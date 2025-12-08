import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  general: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  admin: { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-700 dark:text-red-300' },
  api: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  data: { bg: 'bg-green-100 dark:bg-green-950', text: 'text-green-700 dark:text-green-300' },
  content: { bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
  testing: { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300' },
};

interface CategoryBadgeProps {
  category: string | null | undefined;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps): React.JSX.Element {
  const normalizedCategory = (category || 'general').toLowerCase();
  const colors = CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.general;

  return (
    <Badge
      variant="secondary"
      className={cn(colors.bg, colors.text, 'border-0', className)}
    >
      {normalizedCategory}
    </Badge>
  );
}

export default CategoryBadge;
