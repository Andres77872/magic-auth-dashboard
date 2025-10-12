import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface DashboardIconProps extends Omit<IconProps, 'name'> {}

/**
 * Dashboard Icon - loads dashboard.svg
 * Used for: Dashboard navigation, overview pages
 */
export function DashboardIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: DashboardIconProps): React.JSX.Element {
  return (
    <Icon
      name="dashboard"
      size={size}
      color={color}
      className={`dashboard-icon ${className}`}
      aria-label={ariaLabel || 'Dashboard'}
      {...props}
    />
  );
}

export default DashboardIcon; 