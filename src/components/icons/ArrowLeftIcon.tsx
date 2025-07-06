import React from 'react';

export interface ArrowLeftIconProps {
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

export function ArrowLeftIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}: ArrowLeftIconProps): React.JSX.Element {
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
      className={`arrow-left-icon ${className}`}
      aria-label={ariaLabel || 'Arrow left'}
    >
      <polyline points="15,18 9,12 15,6"/>
    </svg>
  );
}

export default ArrowLeftIcon; 