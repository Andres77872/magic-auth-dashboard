import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface CircleIconProps extends Omit<IconProps, 'name'> {}

/**
 * Circle Icon - loads circle.svg
 * Used for: Status indicators, bullets, decorative elements
 */
export function CircleIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: CircleIconProps): React.JSX.Element {
  return (
    <Icon
      name="circle"
      size={size}
      color={color}
      className={`circle-icon ${className}`}
      aria-label={ariaLabel || 'Circle'}
      {...props}
    />
  );
}

export default CircleIcon; 