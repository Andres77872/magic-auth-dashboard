import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  helperText?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, label, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[60px] w-full rounded-sm border border-input bg-card px-3 py-2 text-sm transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/40',
            className
          )}
          ref={ref}
          aria-invalid={hasError}
          {...props}
        />
        {error && <p className="text-sm text-destructive mt-1.5">{error}</p>}
        {!error && helperText && <p className="text-sm text-muted-foreground mt-1.5">{helperText}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
