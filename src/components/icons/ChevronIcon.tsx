import React from 'react';

export interface ChevronIconProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  'aria-label'?: string;
}

const sizeMap = {
  small: 16,
  medium: 20,
  large: 24,
} as const;

const rotationMap = {
  up: '180deg',
  down: '0deg',
  left: '90deg',
  right: '-90deg',
} as const;

export function ChevronIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  direction = 'down',
  'aria-label': ariaLabel,
}: ChevronIconProps): React.JSX.Element {
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  const rotation = rotationMap[direction];
  
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`chevron-icon ${className}`}
      style={{ transform: `rotate(${rotation})` }}
      aria-label={ariaLabel || `Chevron ${direction}`}
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

export default ChevronIcon; 