import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { UserType } from '@/types/auth.types';

interface UserAvatarProps {
  username: string;
  /** Kept for API compatibility; the tint is derived from the name. */
  userType?: UserType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { size: 'md', className: '' },
  md: { size: 'lg', className: '' },
  lg: { size: 'xl', className: 'h-14 w-14 text-lg' },
} as const;

/**
 * Deterministic monogram avatar (Meridian): the same username always gets the
 * same tint, so people are recognisable across tables and detail pages.
 */
export function UserAvatar({
  username,
  size = 'md',
  className = '',
}: UserAvatarProps): React.JSX.Element {
  const mapped = sizeMap[size];
  return (
    <Avatar
      name={username}
      size={mapped.size}
      className={cn(mapped.className, className)}
      title={username}
    />
  );
}

export default UserAvatar;
