import React, { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  validationState?: 'success' | 'error' | 'warning' | null;
  showCharCount?: boolean;
  maxLength?: number;
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
      loading = false,
      fullWidth = false,
      validationState = null,
      showCharCount = false,
      className = '',
      id,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const finalValidationState = error ? 'error' : validationState;
    const charCount = value ? String(value).length : 0;

    const wrapperClasses = [
      'input-wrapper',
      fullWidth ? 'input-full-width' : '',
      error ? 'input-error' : '',
      loading ? 'input-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      'input-control',
      finalValidationState ? `input-${finalValidationState}` : '',
      success && !error ? 'input-success' : '',
      leftIcon ? 'input-with-left-icon' : '',
      rightIcon || loading ? 'input-with-right-icon' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="input-required" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="input-field">
          {leftIcon && (
            <span className="input-icon input-icon-left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            value={value}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            aria-invalid={error ? 'true' : 'false'}
            aria-required={props.required}
            {...props}
          />
          
          {loading && (
            <span className="input-icon input-icon-right">
              <LoadingSpinner size="xs" aria-label="Loading" />
            </span>
          )}
          {!loading && rightIcon && (
            <span className="input-icon input-icon-right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>

        <div className="input-footer">
          <div className="input-messages">
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
            
            {!error && !success && helperText && (
              <div id={`${inputId}-helper`} className="input-helper-text">
                {helperText}
              </div>
            )}
          </div>

          {showCharCount && props.maxLength && (
            <div className="input-char-count" aria-live="polite">
              {charCount}/{props.maxLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 