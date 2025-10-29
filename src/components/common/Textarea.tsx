import React, { forwardRef, useEffect, useRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  fullWidth?: boolean;
  validationState?: 'success' | 'error' | 'warning' | null;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      success = false,
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
      ...props
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const finalValidationState = error ? 'error' : validationState;
    const charCount = value ? String(value).length : 0;

    // Auto-resize functionality
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!autoResize || !textarea) return;

      const adjustHeight = () => {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
        const minHeight = lineHeight * minRows;
        const maxHeight = lineHeight * maxRows;
        
        const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
        textarea.style.height = `${newHeight}px`;
      };

      adjustHeight();
      textarea.addEventListener('input', adjustHeight);
      
      return () => {
        textarea.removeEventListener('input', adjustHeight);
      };
    }, [autoResize, minRows, maxRows, value]);

    const wrapperClasses = [
      'textarea-wrapper',
      fullWidth ? 'textarea-full-width' : '',
      error ? 'textarea-error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const textareaClasses = [
      'textarea-control',
      finalValidationState ? `textarea-${finalValidationState}` : '',
      success && !error ? 'textarea-success' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={textareaId} className="textarea-label">
            {label}
            {props.required && <span className="textarea-required" aria-label="required">*</span>}
          </label>
        )}
        
        <div className="textarea-field">
          <textarea
            ref={(element) => {
              textareaRef.current = element;
              if (typeof ref === 'function') {
                ref(element);
              } else if (ref) {
                ref.current = element;
              }
            }}
            id={textareaId}
            className={textareaClasses}
            rows={autoResize ? minRows : props.rows || 3}
            value={value}
            aria-describedby={
              error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
            }
            aria-invalid={error ? 'true' : 'false'}
            aria-required={props.required}
            {...props}
          />
        </div>

        <div className="textarea-footer">
          <div className="textarea-messages">
            {error && (
              <div id={`${textareaId}-error`} className="validation-message validation-message-error" role="alert">
                {error}
              </div>
            )}
            
            {!error && success && (
              <div className="validation-message validation-message-success">
                Looks good!
              </div>
            )}
            
            {!error && !success && helperText && (
              <div id={`${textareaId}-helper`} className="textarea-helper-text">
                {helperText}
              </div>
            )}
          </div>

          {showCharCount && props.maxLength && (
            <div className="textarea-char-count" aria-live="polite">
              {charCount}/{props.maxLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 