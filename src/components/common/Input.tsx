import React, { forwardRef, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  validationState?: 'success' | 'error' | 'warning' | null;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success = false,
      helperText,
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      validationState = null,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const finalValidationState = error ? 'error' : validationState;

    const wrapperClasses = [
      'input-wrapper',
      fullWidth ? 'input-full-width' : '',
      error ? 'input-error' : '',
      focused ? 'input-focused' : '',
      isLoading ? 'input-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      'input-control',
      finalValidationState ? `validation-${finalValidationState}` : '',
      success ? 'validation-success' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}
        
        <div className="input-field">
          {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          
          {isLoading && (
            <span className="input-icon input-icon-right">
              <LoadingSpinner size="xs" />
            </span>
          )}
          {!isLoading && rightIcon && (
            <span className="input-icon input-icon-right">{rightIcon}</span>
          )}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="validation-message validation-message-error" role="alert">
            {error}
          </div>
        )}
        
        {!error && success && (
          <div className="validation-message validation-message-success">
            Looks good!
          </div>
        )}
        
        {!error && helperText && (
          <div id={`${inputId}-helper`} className="input-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 