import React from 'react';

export interface LogoIconProps {
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
  className?: string;
  'aria-label'?: string;
}

const sizeMap = {
  small: 24,
  medium: 32,
  large: 48,
} as const;

export function LogoIcon({
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}: LogoIconProps): React.JSX.Element {
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
      className={`logo-icon ${className}`}
      aria-label={ariaLabel || 'Magic Auth Logo'}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="M21 15.5c-.5-1-1.5-2-3-2s-2.5 1-3 2"/>
      <path d="M9 17l3-3 3 3"/>
    </svg>
  );
}

export default LogoIcon; 