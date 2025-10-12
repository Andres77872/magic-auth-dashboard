import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface CheckIconProps extends Omit<IconProps, 'name'> {}

/**
 * Check Icon - loads check.svg
 * Used for: Confirmations, completed states, success indicators
 */
export function CheckIcon({ 
  size = 'md', 
  className = '',
  ...props
}: CheckIconProps): React.JSX.Element {
  return (
    <Icon
      name="check"
      size={size}
      className={`icon check-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default CheckIcon; 