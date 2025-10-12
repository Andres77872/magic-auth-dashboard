import React, { type CSSProperties } from 'react';
import { Icon, type IconProps } from './Icon';

export interface ChevronIconProps extends Omit<IconProps, 'name'> {
  direction?: 'up' | 'down' | 'left' | 'right';
}

const rotationMap = {
  up: '180deg',
  down: '0deg',
  left: '90deg',
  right: '-90deg',
} as const;

/**
 * Chevron Icon - loads chevron.svg
 * Used for: Expandable sections, dropdowns, navigation
 * Supports directional rotation: up, down, left, right
 */
export function ChevronIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  direction = 'down',
  'aria-label': ariaLabel,
  style,
  ...props
}: ChevronIconProps): React.JSX.Element {
  const rotation = rotationMap[direction];
  
  const combinedStyle: CSSProperties = {
    transform: `rotate(${rotation})`,
    ...style,
  };
  
  return (
    <Icon
      name="chevron"
      size={size}
      color={color}
      className={`chevron-icon ${className}`}
      style={combinedStyle}
      aria-label={ariaLabel || `Chevron ${direction}`}
      {...props}
    />
  );
}

export default ChevronIcon; 