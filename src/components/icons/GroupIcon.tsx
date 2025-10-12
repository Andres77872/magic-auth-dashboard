import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface GroupIconProps extends Omit<IconProps, 'name'> {}

/**
 * Group Icon - loads group.svg
 * Used for: User groups, teams, collections
 */
export function GroupIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: GroupIconProps): React.JSX.Element {
  return (
    <Icon
      name="group"
      size={size}
      color={color}
      className={`group-icon ${className}`}
      aria-label={ariaLabel || 'Group'}
      {...props}
    />
  );
}

export default GroupIcon; 