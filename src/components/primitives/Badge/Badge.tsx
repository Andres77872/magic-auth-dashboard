import React, { forwardRef } from 'react';
import type { FormSize, BadgeVariant } from '../types';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: FormSize;
  dot?: boolean;
  children: React.ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      dot = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = [
      'badge',
      `badge-${variant}`,
      `badge-${size}`,
      dot && 'badge-with-dot',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} {...props}>
        {dot && <span className="badge-dot" aria-hidden="true" />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
