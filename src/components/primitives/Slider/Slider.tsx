import React, { forwardRef, useId } from 'react';
import type { FormSize } from '../types';
import './Slider.css';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  size?: FormSize;
  showValue?: boolean;
  label?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value = 0,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      size = 'md',
      showValue = false,
      label,
      disabled = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const sliderId = id || generatedId;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange && !disabled) {
        onChange(Number(event.target.value));
      }
    };

    const percentage = ((value - min) / (max - min)) * 100;

    const wrapperClasses = [
      'slider-wrapper',
      `slider-wrapper-${size}`,
      disabled && 'slider-wrapper-disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {(label || showValue) && (
          <div className="slider-header">
            {label && (
              <label htmlFor={sliderId} className="slider-label">
                {label}
              </label>
            )}
            {showValue && (
              <span className="slider-value" aria-live="polite">
                {value}
              </span>
            )}
          </div>
        )}

        <div className="slider-track-container">
          <input
            ref={ref}
            type="range"
            id={sliderId}
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            disabled={disabled}
            className="slider-input"
            style={{ '--slider-progress': `${percentage}%` } as React.CSSProperties}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;
