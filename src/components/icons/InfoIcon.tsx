import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface InfoIconProps extends Omit<IconProps, 'name'> {}

/**
 * Info Icon - loads info.svg
 * Used for: Information tooltips, help messages
 */
export function InfoIcon({ 
  size = 'md', 
  className = '',
  ...props
}: InfoIconProps): React.JSX.Element {
  return (
    <Icon
      name="info"
      size={size}
      className={`icon info-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export default InfoIcon; 