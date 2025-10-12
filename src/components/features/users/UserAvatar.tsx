import React from 'react';
import type { UserType } from '@/types/auth.types';

interface UserAvatarProps {
  username: string;
  userType?: UserType;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeClasses = {
  small: 'user-avatar-sm',
  medium: 'user-avatar-md',
  large: 'user-avatar-lg',
};

const typeColorClasses = {
  root: 'user-avatar-root',
  admin: 'user-avatar-admin',
  consumer: 'user-avatar-consumer',
};

export function UserAvatar({ 
  username, 
  userType, 
  size = 'medium',
  className = '' 
}: UserAvatarProps): React.JSX.Element {
  const initials = username
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || username.charAt(0).toUpperCase();

  const sizeClass = sizeClasses[size];
  const typeClass = userType ? typeColorClasses[userType] : '';

  return (
    <div 
      className={`user-avatar ${sizeClass} ${typeClass} ${className}`}
      title={username}
      aria-label={`Avatar for ${username}`}
    >
      <span className="user-avatar-initials">{initials}</span>
    </div>
  );
}

export default UserAvatar;
