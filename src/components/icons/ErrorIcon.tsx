import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ErrorIconProps extends Omit<IconProps, 'name'> {}

/**
 * Error Icon - loads error.svg
 * Used for: Error states, validation failures, alerts
 */
export function ErrorIcon({ 
  size = 'md', 
  className = '',
  ...props
}: ErrorIconProps): React.JSX.Element {
  return (
    <Icon
      name="error"
      size={size}
      className={`icon error-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default ErrorIcon; 