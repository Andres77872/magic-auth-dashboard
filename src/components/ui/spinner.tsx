import * as React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerSizeVariants = cva('', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const spinnerVariants = cva('animate-spin', {
  variants: {
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-12 w-12',
    },
    variant: {
      default: 'text-muted-foreground',
      primary: 'text-primary',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

type SpinnerType = 'default' | 'dots' | 'pulse';

export interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof spinnerVariants> {
  type?: SpinnerType;
  message?: string;
  fullScreen?: boolean;
  'aria-label'?: string;
}

const CircleSpinner = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement> & { size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null; variant?: 'default' | 'primary' | null }>(
  ({ className, size, variant, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
);
CircleSpinner.displayName = 'CircleSpinner';

const DotsSpinner = React.forwardRef<HTMLDivElement, { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null }>(
  ({ className, size }, ref) => {
    const dotSize = {
      xs: 'h-1 w-1',
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
      xl: 'h-3 w-3',
    }[size || 'md'];

    return (
      <div ref={ref} className={cn('flex items-center gap-1', className)}>
        <span className={cn(dotSize, 'animate-bounce rounded-full bg-current [animation-delay:-0.3s]')} />
        <span className={cn(dotSize, 'animate-bounce rounded-full bg-current [animation-delay:-0.15s]')} />
        <span className={cn(dotSize, 'animate-bounce rounded-full bg-current')} />
      </div>
    );
  }
);
DotsSpinner.displayName = 'DotsSpinner';

const PulseSpinner = React.forwardRef<HTMLDivElement, { className?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null }>(
  ({ className, size }, ref) => (
    <div ref={ref} className={cn(spinnerSizeVariants({ size }), 'relative', className)}>
      <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-75" />
      <span className="relative block h-full w-full rounded-full bg-current" />
    </div>
  )
);
PulseSpinner.displayName = 'PulseSpinner';

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, variant, type = 'default', message, fullScreen = false, 'aria-label': ariaLabel = 'Loading', ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-2',
          fullScreen && 'fixed inset-0 z-50 bg-background/80',
          className
        )}
        role="status"
        aria-label={ariaLabel}
        {...props}
      >
        {type === 'dots' && <DotsSpinner size={size} className={variant === 'primary' ? 'text-primary' : 'text-muted-foreground'} />}
        {type === 'pulse' && <PulseSpinner size={size} className={variant === 'primary' ? 'text-primary' : 'text-muted-foreground'} />}
        {type === 'default' && <CircleSpinner size={size} variant={variant} />}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    );

    return content;
  }
);
Spinner.displayName = 'Spinner';

export { Spinner, spinnerVariants, CircleSpinner, DotsSpinner, PulseSpinner };
