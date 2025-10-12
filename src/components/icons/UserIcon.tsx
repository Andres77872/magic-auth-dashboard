import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface UserIconProps extends Omit<IconProps, 'name'> {}

/**
 * User Icon - loads user.svg
 * Used for: User accounts, profiles, authentication
 */
export function UserIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: UserIconProps): React.JSX.Element {
  return (
    <Icon
      name="user"
      size={size}
      color={color}
      className={`user-icon ${className}`}
      aria-label={ariaLabel || 'User'}
      {...props}
    />
  );
}

export default UserIcon; 