import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface SmileyIconProps extends Omit<IconProps, 'name'> {}

/**
 * Smiley Icon - loads smiley.svg
 * Used for: Positive feedback, empty states, success messages
 */
export function SmileyIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: SmileyIconProps): React.JSX.Element {
  return (
    <Icon
      name="smiley"
      size={size}
      color={color}
      className={`smiley-icon ${className}`}
      aria-label={ariaLabel || 'Smiley face'}
      {...props}
    />
  );
}

export default SmileyIcon; 