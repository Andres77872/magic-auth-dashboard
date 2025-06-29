import React, { forwardRef, useState, useEffect, useRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

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
    }, [autoResize, minRows, maxRows, props.value]);

    const wrapperClasses = [
      'textarea-wrapper',
      fullWidth ? 'textarea-full-width' : '',
      error ? 'textarea-error' : '',
      focused ? 'textarea-focused' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={textareaId} className="textarea-label">
            {label}
            {props.required && <span className="textarea-required">*</span>}
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
            className="textarea-control"
            rows={autoResize ? minRows : props.rows || 3}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            aria-describedby={
              error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
            }
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
        </div>

        {error && (
          <div id={`${textareaId}-error`} className="textarea-error-text" role="alert">
            {error}
          </div>
        )}
        
        {!error && helperText && (
          <div id={`${textareaId}-helper`} className="textarea-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 