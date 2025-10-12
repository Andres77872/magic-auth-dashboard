import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface ViewIconProps extends Omit<IconProps, 'name'> {}

/**
 * View Icon - loads view.svg
 * Used for: View details, preview, visibility
 */
export function ViewIcon({ 
  size = 'md', 
  className = '',
  ...props
}: ViewIconProps): React.JSX.Element {
  return (
    <Icon
      name="view"
      size={size}
      className={`icon view-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default ViewIcon; 