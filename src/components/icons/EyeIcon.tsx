import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface EyeIconProps extends Omit<IconProps, 'name'> {
  isVisible?: boolean;
}

/**
 * Eye Icon - loads eye-open.svg or eye-closed.svg
 * Used for: Password visibility toggle, view/hide content
 * Supports two states: open (visible) and closed (hidden)
 */
export function EyeIcon({ 
  size = 'md', 
  className = '',
  isVisible = true,
  ...props
}: EyeIconProps): React.JSX.Element {
  const iconName = isVisible ? 'eye-open' : 'eye-closed';
  
  return (
    <Icon
      name={iconName}
      size={size}
      className={`icon eye-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default EyeIcon; 