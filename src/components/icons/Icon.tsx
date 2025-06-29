import React from 'react';

export interface IconProps {
  name: string;
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

export function Icon({
  name,
  size = 'medium',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: IconProps): React.JSX.Element {
  const iconSize = typeof size === 'number' ? size : sizeMap[size];
  
  const iconClasses = [
    'icon',
    `icon-${name}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span 
      className={iconClasses}
      style={{ 
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: iconSize,
        height: iconSize,
        color,
      }}
      aria-label={ariaLabel}
      {...props}
    >
      {/* Icon content will be rendered by specific icon components */}
    </span>
  );
}

export default Icon; 