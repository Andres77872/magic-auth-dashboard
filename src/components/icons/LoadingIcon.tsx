import React from 'react';

export interface LoadingIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LoadingIcon({ 
  size = 'medium', 
  className = '' 
}: LoadingIconProps): React.JSX.Element {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const iconSize = sizeMap[size];

  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      className={`icon loading-icon ${className}`}
      aria-hidden="true"
    >
      <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5c0-1.66 4.03-3 9-3s9 1.34 9 3"/>
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
    </svg>
  );
}

export default LoadingIcon; 