import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface LockIconProps extends Omit<IconProps, 'name'> {}

/**
 * Lock Icon - loads lock.svg
 * Used for: Locked states, security, authentication
 */
export function LockIcon({ 
  size = 'md', 
  className = '',
  ...props
}: LockIconProps): React.JSX.Element {
  return (
    <Icon
      name="lock"
      size={size}
      className={`icon lock-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default LockIcon; 