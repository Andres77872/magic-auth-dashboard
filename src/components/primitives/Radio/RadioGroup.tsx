import React, { forwardRef, useId } from 'react';
import type { FormSize, Orientation } from '../types';
import './Radio.css';

export interface RadioGroupProps {
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  size?: FormSize;
  orientation?: Orientation;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value,
      onChange,
      name,
      size = 'md',
      orientation = 'vertical',
      label,
      error,
      disabled = false,
      required = false,
      className = '',
      children,
    },
    ref
  ) => {
    const generatedId = useId();
    const groupId = name || generatedId;
    const errorId = `${groupId}-error`;

    const wrapperClasses = [
      'radio-group',
      `radio-group-${orientation}`,
      disabled && 'radio-group-disabled',
      error && 'radio-group-error',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Clone children to pass down props
    interface RadioChildProps {
      name?: string;
      size?: FormSize;
      checked?: boolean;
      onChange?: (value: string) => void;
      disabled?: boolean;
      value?: string;
    }

    const enhancedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement<RadioChildProps>(child)) {
        return React.cloneElement(child, {
          name: groupId,
          size,
          checked: child.props.value === value,
          onChange,
          disabled: disabled || child.props.disabled,
        });
      }
      return child;
    });

    return (
      <div ref={ref} className={wrapperClasses} role="radiogroup" aria-labelledby={label ? `${groupId}-label` : undefined}>
        {label && (
          <div id={`${groupId}-label`} className="radio-group-label">
            {label}
            {required && <span className="radio-group-required" aria-hidden="true">*</span>}
          </div>
        )}

        <div className="radio-group-options">
          {enhancedChildren}
        </div>

        {error && (
          <div id={errorId} className="radio-group-error-message" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup;
