import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ClockIconProps extends Omit<IconProps, 'name'> {}

/**
 * Clock Icon - loads clock.svg
 * Used for: Time indicators, timestamps, activity logs
 */
export function ClockIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ClockIconProps): React.JSX.Element {
  return (
    <Icon
      name="clock"
      size={size}
      color={color}
      className={`clock-icon ${className}`}
      aria-label={ariaLabel || 'Clock'}
      {...props}
    />
  );
}

export default ClockIcon; 