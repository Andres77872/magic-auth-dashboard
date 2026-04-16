import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

// Map categories to semantic Badge variants
const CATEGORY_VARIANTS: Record<string, VariantProps<typeof Badge>['variant']> =
  {
    general: 'subtle',
    admin: 'subtleDestructive',
    api: 'subtleInfo',
    data: 'subtleSuccess',
    content: 'subtlePrimary',
    testing: 'subtleWarning',
  };

interface CategoryBadgeProps {
  category: string | null | undefined;
  className?: string;
}

export function CategoryBadge({
  category,
  className,
}: CategoryBadgeProps): React.JSX.Element {
  const normalizedCategory = (category || 'general').toLowerCase();
  const variant = CATEGORY_VARIANTS[normalizedCategory] || 'subtle';

  return (
    <Badge variant={variant} className={className}>
      {normalizedCategory}
    </Badge>
  );
}

export default CategoryBadge;
