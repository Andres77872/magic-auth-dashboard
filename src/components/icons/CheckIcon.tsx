import React from 'react';

export interface CheckIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function CheckIcon({ 
  size = 'medium', 
  className = '' 
}: CheckIconProps): React.JSX.Element {
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
      className={`icon check-icon ${className}`}
      aria-hidden="true"
    >
      <path d="M9 12l2 2 4-4"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  );
}

export default CheckIcon; 