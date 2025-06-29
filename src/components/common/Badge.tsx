import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'medium',
  dot = false,
  className = '',
}: BadgeProps): React.JSX.Element {
  const badgeClasses = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    dot ? 'badge-dot' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {dot && <span className="badge-dot-indicator" />}
      {children}
    </span>
  );
}

export default Badge; 