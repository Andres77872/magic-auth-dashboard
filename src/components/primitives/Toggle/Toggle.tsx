import React, { forwardRef, useId } from 'react';
import type { FormSize } from '../types';
import './Toggle.css';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  size?: FormSize;
  label?: React.ReactNode;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      checked = false,
      onChange,
      size = 'md',
      label,
      disabled = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const toggleId = id || generatedId;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange && !disabled) {
        onChange(event.target.checked);
      }
    };

    const wrapperClasses = [
      'toggle-wrapper',
      `toggle-wrapper-${size}`,
      disabled && 'toggle-wrapper-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const trackClasses = [
      'toggle-track',
      `toggle-track-${size}`,
      checked && 'toggle-track-checked',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <label className="toggle-label">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={toggleId}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="toggle-input"
            aria-checked={checked}
            {...props}
          />
          <span className={trackClasses} aria-hidden="true">
            <span className="toggle-thumb" />
          </span>
          {label && <span className="toggle-label-text">{label}</span>}
        </label>
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
