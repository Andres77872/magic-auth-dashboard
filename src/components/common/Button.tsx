import React, { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';
    const variantClasses = `btn-${variant}`;
    const sizeClasses = `btn-${size}`;
    const fullWidthClasses = fullWidth ? 'w-full' : '';
    const loadingClasses = loading ? 'is-loading' : '';

    const buttonClasses = [
      baseClasses,
      variantClasses,
      sizeClasses,
      fullWidthClasses,
      loadingClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <LoadingSpinner size="xs" aria-hidden="true" />}
        {!loading && leftIcon && <span className="btn-icon-left" aria-hidden="true">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!loading && rightIcon && <span className="btn-icon-right" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button; 