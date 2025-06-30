import React from 'react';

export interface ClockIconProps {
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

export function ClockIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}: ClockIconProps): React.JSX.Element {
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
      className={`clock-icon ${className}`}
      aria-label={ariaLabel || 'Clock'}
    >
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}

export default ClockIcon; 