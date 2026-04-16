import React from 'react';
import { cn } from '@/lib/utils';
import type { UserType } from '@/types/auth.types';

interface UserAvatarProps {
  username: string;
  userType?: UserType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const typeColorStyles: Record<UserType, string> = {
  root: 'bg-destructive-subtle text-destructive-subtle-foreground',
  admin: 'bg-info-subtle text-info-subtle-foreground',
  consumer: 'bg-muted-subtle text-muted-subtle-foreground',
};

export function UserAvatar({
  username,
  userType,
  size = 'md',
  className = '',
}: UserAvatarProps): React.JSX.Element {
  const initials =
    username
      .split(' ')
      .map((name) => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || username.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold shadow-sm ring-1 ring-border/50',
        sizeStyles[size],
        userType ? typeColorStyles[userType] : 'bg-muted text-muted-foreground',
        className
      )}
      title={username}
      aria-label={`Avatar for ${username}`}
    >
      <span>{initials}</span>
    </div>
  );
}

export default UserAvatar;
