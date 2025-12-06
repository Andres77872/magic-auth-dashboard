import React, { forwardRef, useId } from 'react';
import type { FormSize, ValidationState } from '../types';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: FormSize;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  validationState?: ValidationState;
  showCharCount?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      label,
      error,
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
      maxLength,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    const finalValidationState = error ? 'error' : validationState;
    const charCount = value ? String(value).length : 0;

    const wrapperClasses = [
      'input-wrapper',
      `input-wrapper-${size}`,
      fullWidth && 'input-wrapper-full-width',
      disabled && 'input-wrapper-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const fieldClasses = [
      'input-field',
      finalValidationState && `input-field-${finalValidationState}`,
      leftIcon && 'input-field-has-left-icon',
      (rightIcon || loading) && 'input-field-has-right-icon',
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      'input-control',
      `input-control-${size}`,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {required && <span className="input-required" aria-hidden="true">*</span>}
          </label>
        )}

        <div className={fieldClasses}>
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
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required}
            {...props}
          />

          {loading && (
            <span className="input-icon input-icon-right">
              <span className="input-spinner" aria-label="Loading" />
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
              <div id={errorId} className="input-message input-message-error" role="alert">
                {error}
              </div>
            )}

            {!error && helperText && (
              <div id={helperId} className="input-message input-message-helper">
                {helperText}
              </div>
            )}
          </div>

          {showCharCount && maxLength && (
            <div className="input-char-count" aria-live="polite">
              {charCount}/{maxLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
