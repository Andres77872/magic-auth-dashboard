import React, { forwardRef, useId, useEffect, useRef, useCallback } from 'react';
import type { FormSize, ValidationState } from '../types';
import './Textarea.css';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: FormSize;
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  fullWidth?: boolean;
  validationState?: ValidationState;
  showCharCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      label,
      error,
      helperText,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      fullWidth = false,
      validationState = null,
      showCharCount = false,
      className = '',
      id,
      value,
      maxLength,
      required,
      disabled,
      rows,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const internalRef = useRef<HTMLTextAreaElement>(null);

    const finalValidationState = error ? 'error' : validationState;
    const charCount = value ? String(value).length : 0;

    const adjustHeight = useCallback(() => {
      const textarea = internalRef.current;
      if (!autoResize || !textarea) return;

      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 20;
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;

      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minRows, maxRows]);

    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const wrapperClasses = [
      'textarea-wrapper',
      `textarea-wrapper-${size}`,
      fullWidth && 'textarea-wrapper-full-width',
      disabled && 'textarea-wrapper-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const fieldClasses = [
      'textarea-field',
      finalValidationState && `textarea-field-${finalValidationState}`,
    ]
      .filter(Boolean)
      .join(' ');

    const textareaClasses = [
      'textarea-control',
      `textarea-control-${size}`,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={textareaId} className="textarea-label">
            {label}
            {required && <span className="textarea-required" aria-hidden="true">*</span>}
          </label>
        )}

        <div className={fieldClasses}>
          <textarea
            ref={(element) => {
              internalRef.current = element;
              if (typeof ref === 'function') {
                ref(element);
              } else if (ref) {
                ref.current = element;
              }
            }}
            id={textareaId}
            className={textareaClasses}
            rows={autoResize ? minRows : rows || minRows}
            value={value}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required}
            onInput={autoResize ? adjustHeight : undefined}
            {...props}
          />
        </div>

        <div className="textarea-footer">
          <div className="textarea-messages">
            {error && (
              <div id={errorId} className="textarea-message textarea-message-error" role="alert">
                {error}
              </div>
            )}

            {!error && helperText && (
              <div id={helperId} className="textarea-message textarea-message-helper">
                {helperText}
              </div>
            )}
          </div>

          {showCharCount && maxLength && (
            <div className="textarea-char-count" aria-live="polite">
              {charCount}/{maxLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
