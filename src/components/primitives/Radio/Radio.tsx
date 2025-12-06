import React, { forwardRef, useId } from 'react';
import type { FormSize } from '../types';
import './Radio.css';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  size?: FormSize;
  label?: React.ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      value,
      checked = false,
      onChange,
      size = 'md',
      label,
      disabled = false,
      className = '',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    const handleChange = () => {
      if (onChange && !disabled) {
        onChange(value);
      }
    };

    const wrapperClasses = [
      'radio-wrapper',
      `radio-wrapper-${size}`,
      disabled && 'radio-wrapper-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const circleClasses = [
      'radio-circle',
      `radio-circle-${size}`,
      checked && 'radio-circle-checked',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <label className="radio-label">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="radio-input"
            {...props}
          />
          <span className={circleClasses} aria-hidden="true">
            {checked && <span className="radio-dot" />}
          </span>
          {label && <span className="radio-label-text">{label}</span>}
        </label>
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
