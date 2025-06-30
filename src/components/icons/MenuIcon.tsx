import React from 'react';

export interface MenuIconProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function MenuIcon({ 
  size = 'medium', 
  className = '' 
}: MenuIconProps): React.JSX.Element {
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
      className={`icon menu-icon ${className}`}
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

export default MenuIcon; 