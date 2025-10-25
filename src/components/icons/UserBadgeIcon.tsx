import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface UserBadgeIconProps extends Omit<IconProps, 'name'> {
  size?: number;       // Size in pixels (default: 20)
  color?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * UserBadge Icon - loads user-badge.svg
 * Used for: Role management, user role assignments, access levels
 * 
 * A user icon with a badge containing a star, representing role assignments
 * and permission levels.
 */
export function UserBadgeIcon({
  size = 20,
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: UserBadgeIconProps): React.JSX.Element {
  return (
    <Icon
      name="user-badge"
      size={size}
      color={color}
      className={`user-badge-icon ${className}`}
      aria-label={ariaLabel || 'User Badge'}
      {...props}
    />
  );
}

export default UserBadgeIcon;
