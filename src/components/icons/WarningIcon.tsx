import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface WarningIconProps extends Omit<IconProps, 'name'> {}

/**
 * Warning Icon - loads warning.svg
 * Used for: Warning messages, caution, alerts
 */
export function WarningIcon({ 
  size = 'md', 
  className = '',
  ...props
}: WarningIconProps): React.JSX.Element {
  return (
    <Icon
      name="warning"
      size={size}
      className={`icon warning-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default WarningIcon; 