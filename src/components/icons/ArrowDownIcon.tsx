import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ArrowDownIconProps extends Omit<IconProps, 'name'> {}

/**
 * Arrow Down Icon - loads arrow-down.svg
 * Used for: Dropdown indicators, sorting descending
 */
export function ArrowDownIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ArrowDownIconProps): React.JSX.Element {
  return (
    <Icon
      name="arrow-down"
      size={size}
      color={color}
      className={`arrow-down-icon ${className}`}
      aria-label={ariaLabel || 'Arrow down'}
      {...props}
    />
  );
}

export default ArrowDownIcon; 