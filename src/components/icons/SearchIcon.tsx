import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface SearchIconProps extends Omit<IconProps, 'name'> {}

/**
 * Search Icon - loads search.svg
 * Used for: Search functionality, find features
 */
export function SearchIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: SearchIconProps): React.JSX.Element {
  return (
    <Icon
      name="search"
      size={size}
      color={color}
      className={`search-icon ${className}`}
      aria-label={ariaLabel || 'Search'}
      {...props}
    />
  );
}

export default SearchIcon; 