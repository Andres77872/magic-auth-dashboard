import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'flex w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 text-xs',
        md: 'h-9',
        lg: 'h-10 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  showCharCount?: boolean;
  validationState?: 'success' | 'error' | 'warning' | null;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      helperText,
      label,
      leftIcon,
      rightIcon,
      loading = false,
      fullWidth = false,
      showCharCount = false,
      validationState,
      size,
      id,
      value,
      maxLength,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error || validationState === 'error';
    const charCount = value ? String(value).length : 0;

    return (
      <div className={cn('w-full', !fullWidth && 'max-w-md')}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{leftIcon}</div>
          )}
          <input
            type={type}
            id={inputId}
            value={value}
            maxLength={maxLength}
            className={cn(
              inputVariants({ size }),
              leftIcon && 'pl-10',
              (rightIcon || loading) && 'pr-10',
              hasError && 'border-destructive focus-visible:ring-destructive',
              validationState === 'success' && 'border-success focus-visible:ring-success',
              validationState === 'warning' && 'border-warning focus-visible:ring-warning',
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
          {!loading && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{rightIcon}</div>
          )}
        </div>
        <div className="flex justify-between mt-1.5">
          <div>
            {error && (
              <p id={`${inputId}-error`} className="text-sm text-destructive">
                {error}
              </p>
            )}
            {!error && helperText && (
              <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
                {helperText}
              </p>
            )}
          </div>
          {showCharCount && maxLength && (
            <span className="text-xs text-muted-foreground">
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
