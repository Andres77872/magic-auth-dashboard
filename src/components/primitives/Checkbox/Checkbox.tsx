import React, { forwardRef, useId, useRef, useEffect } from 'react';
import type { FormSize } from '../types';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  checked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  size?: FormSize;
  label?: React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked = false,
      indeterminate = false,
      onChange,
      size = 'md',
      label,
      error,
      disabled = false,
      className = '',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;
    const internalRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange && !disabled) {
        onChange(event.target.checked);
      }
    };

    const wrapperClasses = [
      'checkbox-wrapper',
      `checkbox-wrapper-${size}`,
      disabled && 'checkbox-wrapper-disabled',
      error && 'checkbox-wrapper-error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const boxClasses = [
      'checkbox-box',
      `checkbox-box-${size}`,
      checked && 'checkbox-box-checked',
      indeterminate && 'checkbox-box-indeterminate',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <label className="checkbox-label">
          <input
            ref={(element) => {
              internalRef.current = element;
              if (typeof ref === 'function') {
                ref(element);
              } else if (ref) {
                ref.current = element;
              }
            }}
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="checkbox-input"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <span className={boxClasses} aria-hidden="true">
            {checked && !indeterminate && (
              <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {indeterminate && (
              <svg className="checkbox-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14" strokeLinecap="round" />
              </svg>
            )}
          </span>
          {label && <span className="checkbox-label-text">{label}</span>}
        </label>
        {error && (
          <span id={errorId} className="checkbox-error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
