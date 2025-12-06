import React, { forwardRef } from 'react';
import type { Size, ButtonVariant } from '../types';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
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
      type = 'button',
      ...props
    },
    ref
  ) => {
    const classes = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth && 'btn-full-width',
      loading && 'btn-loading',
      disabled && 'btn-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="btn-spinner" aria-hidden="true">
            <span className="btn-spinner-circle" />
          </span>
        )}
        {!loading && leftIcon && (
          <span className="btn-icon btn-icon-left" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children && <span className="btn-content">{children}</span>}
        {!loading && rightIcon && (
          <span className="btn-icon btn-icon-right" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
