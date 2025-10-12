import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface LogoIconProps extends Omit<IconProps, 'name'> {}

/**
 * Logo Icon - loads logo.svg
 * Used for: Application branding, header logo
 */
export function LogoIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: LogoIconProps): React.JSX.Element {
  
  return (
    <Icon
      name="logo"
      size={size}
      color={color}
      className={`logo-icon ${className}`}
      aria-label={ariaLabel || 'Magic Auth Logo'}
      {...props}
    />
  );
}

export default LogoIcon; 