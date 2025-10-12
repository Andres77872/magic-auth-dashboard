import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ArrowUpIconProps extends Omit<IconProps, 'name'> {}

/**
 * Arrow Up Icon - loads arrow-up.svg
 * Used for: Upload actions, sorting
 */
export function ArrowUpIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ArrowUpIconProps): React.JSX.Element {
  return (
    <Icon
      name="arrow-up"
      size={size}
      color={color}
      className={`arrow-up-icon ${className}`}
      aria-label={ariaLabel || 'Arrow up'}
      {...props}
    />
  );
}

export default ArrowUpIcon; 