import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface PlusIconProps extends Omit<IconProps, 'name'> {}

/**
 * Plus Icon - loads plus.svg
 * Used for: Add new items, create actions
 */
export function PlusIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: PlusIconProps): React.JSX.Element {
  return (
    <Icon
      name="plus"
      size={size}
      color={color}
      className={`plus-icon ${className}`}
      aria-label={ariaLabel || 'Plus'}
      {...props}
    />
  );
}

export default PlusIcon; 