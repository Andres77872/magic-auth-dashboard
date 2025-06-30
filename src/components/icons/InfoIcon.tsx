import React from 'react';

export interface InfoIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function InfoIcon({ 
  size = 'medium', 
  className = '' 
}: InfoIconProps): React.JSX.Element {
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
      className={`icon info-icon ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="M12 8h.01"/>
    </svg>
  );
}

export default InfoIcon; 