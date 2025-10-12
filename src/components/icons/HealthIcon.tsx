import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface HealthIconProps extends Omit<IconProps, 'name'> {}

/**
 * Health Icon - loads health.svg
 * Used for: Health metrics, system status, monitoring
 */
export function HealthIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: HealthIconProps): React.JSX.Element {
  return (
    <Icon
      name="health"
      size={size}
      color={color}
      className={`health-icon ${className}`}
      aria-label={ariaLabel || 'Health'}
      {...props}
    />
  );
}

export default HealthIcon; 