import React from 'react';

export interface LockIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function LockIcon({ 
  size = 'medium', 
  className = '' 
}: LockIconProps): React.JSX.Element {
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
      className={`icon lock-icon ${className}`}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <circle cx="12" cy="16" r="1"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export default LockIcon; 