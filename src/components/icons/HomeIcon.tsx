import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface HomeIconProps extends Omit<IconProps, 'name'> {}

/**
 * Home Icon - loads home.svg
 * Used for: Home navigation, main page link
 */
export function HomeIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: HomeIconProps): React.JSX.Element {
  return (
    <Icon
      name="home"
      size={size}
      color={color}
      className={`home-icon ${className}`}
      aria-label={ariaLabel || 'Home'}
      {...props}
    />
  );
}

export default HomeIcon; 