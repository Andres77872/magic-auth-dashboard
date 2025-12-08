import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import type { FormSize } from '../types';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  value: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  size?: FormSize;
  label?: React.ReactNode;
}

const sizeStyles: Record<FormSize, { circle: string; dot: string; text: string }> = {
  sm: { circle: 'h-4 w-4', dot: 'h-2 w-2', text: 'text-xs' },
  md: { circle: 'h-5 w-5', dot: 'h-2.5 w-2.5', text: 'text-sm' },
  lg: { circle: 'h-6 w-6', dot: 'h-3 w-3', text: 'text-base' },
};

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

    const styles = sizeStyles[size];

    return (
      <div className={cn('flex items-center', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={name}
            value={value}
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <span 
            className={cn(
              'flex items-center justify-center rounded-full border-2 transition-colors',
              styles.circle,
              checked 
                ? 'border-primary bg-primary' 
                : 'border-input bg-background hover:border-ring'
            )} 
            aria-hidden="true"
          >
            {checked && (
              <span className={cn('rounded-full bg-primary-foreground', styles.dot)} />
            )}
          </span>
          {label && <span className={cn('text-foreground', styles.text)}>{label}</span>}
        </label>
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
