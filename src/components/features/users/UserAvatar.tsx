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

const typeColorStyles = {
  root: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  consumer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function UserAvatar({ 
  username, 
  userType, 
  size = 'md',
  className = '' 
}: UserAvatarProps): React.JSX.Element {
  const initials = username
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || username.charAt(0).toUpperCase();

  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-full font-medium',
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
