import React from 'react';

export interface ArrowRightIconProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

const sizeMap = {
  small: 16,
  medium: 20,
  large: 24,
} as const;

export function ArrowRightIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}: ArrowRightIconProps): React.JSX.Element {
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
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
      className={`arrow-right-icon ${className}`}
      aria-label={ariaLabel || 'Arrow right'}
    >
      <polyline points="9,18 15,12 9,6"/>
    </svg>
  );
}

export default ArrowRightIcon; 