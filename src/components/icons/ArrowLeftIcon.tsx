import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ArrowLeftIconProps extends Omit<IconProps, 'name'> {}

/**
 * Arrow Left Icon - loads arrow-left.svg
 * Used for: Back navigation, previous actions
 */
export function ArrowLeftIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: ArrowLeftIconProps): React.JSX.Element {
  return (
    <Icon
      name="arrow-left"
      size={size}
      color={color}
      className={`arrow-left-icon ${className}`}
      aria-label={ariaLabel || 'Arrow left'}
      {...props}
    />
  );
}

export default ArrowLeftIcon; 