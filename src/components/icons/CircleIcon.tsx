import React from 'react';

export interface CircleIconProps {
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

export function CircleIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}: CircleIconProps): React.JSX.Element {
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
      className={`circle-icon ${className}`}
      aria-label={ariaLabel || 'Circle'}
    >
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
}

export default CircleIcon; 