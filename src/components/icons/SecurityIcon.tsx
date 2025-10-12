import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface SecurityIconProps extends Omit<IconProps, 'name'> {}

/**
 * Security Icon - loads security.svg
 * Used for: Security features, protection, shield
 */
export function SecurityIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: SecurityIconProps): React.JSX.Element {
  return (
    <Icon
      name="security"
      size={size}
      color={color}
      className={`security-icon ${className}`}
      aria-label={ariaLabel || 'Security'}
      {...props}
    />
  );
}

export default SecurityIcon; 