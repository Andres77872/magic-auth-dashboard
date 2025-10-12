import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface HorizontalLineIconProps extends Omit<IconProps, 'name'> {}

/**
 * Horizontal Line Icon - loads horizontal-line.svg
 * Used for: Dividers, separators, visual breaks
 */
export function HorizontalLineIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: HorizontalLineIconProps): React.JSX.Element {
  return (
    <Icon
      name="horizontal-line"
      size={size}
      color={color}
      className={`horizontal-line-icon ${className}`}
      aria-label={ariaLabel || 'Horizontal line'}
      {...props}
    />
  );
}

export default HorizontalLineIcon; 