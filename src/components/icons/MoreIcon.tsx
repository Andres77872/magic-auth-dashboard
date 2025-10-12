import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface MoreIconProps extends Omit<IconProps, 'name'> {}

/**
 * More Icon - loads more.svg
 * Used for: Additional options menu, overflow menu
 */
export function MoreIcon({ 
  size = 'md', 
  className = '',
  ...props
}: MoreIconProps): React.JSX.Element {
  return (
    <Icon
      name="more"
      size={size}
      className={`icon more-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default MoreIcon; 