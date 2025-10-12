import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface RefreshIconProps extends Omit<IconProps, 'name'> {}

/**
 * Refresh Icon - loads refresh.svg
 * Used for: Reload, refresh data, sync
 */
export function RefreshIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: RefreshIconProps): React.JSX.Element {
  return (
    <Icon
      name="refresh"
      size={size}
      color={color}
      className={`refresh-icon ${className}`}
      aria-label={ariaLabel || 'Refresh'}
      {...props}
    />
  );
}

export default RefreshIcon; 