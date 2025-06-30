import React from 'react';

export interface EyeIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  isVisible?: boolean;
}

export function EyeIcon({ 
  size = 'medium', 
  className = '',
  isVisible = true
}: EyeIconProps): React.JSX.Element {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  };

  const iconSize = sizeMap[size];

  if (isVisible) {
    // Eye open (password visible)
    return (
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className={`icon eye-icon ${className}`}
        aria-hidden="true"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );
  } else {
    // Eye closed (password hidden)
    return (
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className={`icon eye-icon ${className}`}
        aria-hidden="true"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
}

export default EyeIcon; 