import React from 'react';

export interface MoreIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function MoreIcon({ 
  size = 'medium', 
  className = '' 
}: MoreIconProps): React.JSX.Element {
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
      className={`icon more-icon ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  );
}

export default MoreIcon; 