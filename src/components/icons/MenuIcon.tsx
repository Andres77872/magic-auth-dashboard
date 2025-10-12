import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface MenuIconProps extends Omit<IconProps, 'name'> {
  // Inherits size from IconProps - supports both naming conventions
}

/**
 * Menu Icon - loads menu.svg
 * Used for: Mobile menu, navigation drawer, hamburger menu
 */
export function MenuIcon({ 
  size = 'md', 
  className = '',
  ...props
}: MenuIconProps): React.JSX.Element {
  return (
    <Icon
      name="menu"
      size={size}
      className={`icon menu-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default MenuIcon; 