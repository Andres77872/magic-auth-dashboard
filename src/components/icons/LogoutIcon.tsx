import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface LogoutIconProps extends Omit<IconProps, 'name'> {}

/**
 * Logout Icon - loads logout.svg
 * Used for: Logout action, sign out
 */
export function LogoutIcon({ 
  size = 'md', 
  className = '',
  ...props
}: LogoutIconProps): React.JSX.Element {
  return (
    <Icon
      name="logout"
      size={size}
      className={`icon logout-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default LogoutIcon; 