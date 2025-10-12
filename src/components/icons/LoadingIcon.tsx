import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface LoadingIconProps extends Omit<IconProps, 'name'> {}

/**
 * Loading Icon - loads loading.svg
 * Used for: Loading states, async operations
 */
export function LoadingIcon({ 
  size = 'md', 
  className = '',
  ...props
}: LoadingIconProps): React.JSX.Element {
  return (
    <Icon
      name="loading"
      size={size}
      className={`icon loading-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default LoadingIcon; 