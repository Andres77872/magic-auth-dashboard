import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface CloseIconProps extends Omit<IconProps, 'name'> {}

/**
 * Close Icon - loads close.svg
 * Used for: Close modals, dismiss notifications, remove items
 */
export function CloseIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: CloseIconProps): React.JSX.Element {
  return (
    <Icon
      name="close"
      size={size}
      color={color}
      className={`close-icon ${className}`}
      aria-label={ariaLabel || 'Close'}
      {...props}
    />
  );
}

export default CloseIcon; 