import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ArrowRightIconProps extends Omit<IconProps, 'name'> {}

/**
 * Arrow Right Icon - loads arrow-right.svg
 * Used for: Forward navigation, next actions
 */
export function ArrowRightIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ArrowRightIconProps): React.JSX.Element {
  return (
    <Icon
      name="arrow-right"
      size={size}
      color={color}
      className={`arrow-right-icon ${className}`}
      aria-label={ariaLabel || 'Arrow right'}
      {...props}
    />
  );
}

export default ArrowRightIcon; 