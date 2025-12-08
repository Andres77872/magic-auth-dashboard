import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import type { FormSize, Orientation } from '../types';

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
      <div 
        ref={ref} 
        className={cn(
          'flex flex-col gap-1.5',
          disabled && 'opacity-50',
          error && 'text-destructive',
          className
        )} 
        role="radiogroup" 
        aria-labelledby={label ? `${groupId}-label` : undefined}
      >
        {label && (
          <div id={`${groupId}-label`} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
          </div>
        )}

        <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap')}>
          {enhancedChildren}
        </div>

        {error && (
          <div id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </div>
        )}
      </div>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export default RadioGroup;
