import React from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  getUserTypeBadgeVariant,
  getUserTypeLabel,
} from '@/utils/component-utils';

export interface UserTypeBadgeProps extends Omit<
  BadgeProps,
  'variant' | 'children'
> {
  /** A `UserType`; unknown values render as-is with neutral styling. */
  userType: string | null | undefined;
}

/** The one place user types get their label and colour. */
export function UserTypeBadge({
  userType,
  size = 'sm',
  ...props
}: UserTypeBadgeProps): React.JSX.Element | null {
  if (!userType) return null;
  return (
    <Badge variant={getUserTypeBadgeVariant(userType)} size={size} {...props}>
      {getUserTypeLabel(userType)}
    </Badge>
  );
}

export default UserTypeBadge;
