import React from 'react';

export interface HorizontalLineIconProps {
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

export function HorizontalLineIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}: HorizontalLineIconProps): React.JSX.Element {
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
      className={`horizontal-line-icon ${className}`}
      aria-label={ariaLabel || 'Horizontal line'}
    >
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

export default HorizontalLineIcon; 