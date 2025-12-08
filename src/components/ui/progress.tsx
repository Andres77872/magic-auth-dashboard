import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressVariants = cva('h-full w-full flex-1 transition-all', {
  variants: {
    variant: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      destructive: 'bg-destructive',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

const trackSizeVariants = cva('relative w-full overflow-hidden rounded-full bg-primary/20', {
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface ProgressProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'>,
    VariantProps<typeof progressVariants> {
  value?: number;
  indeterminate?: boolean;
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value = 0, variant, size, indeterminate = false, showLabel = false, label, ...props }, ref) => {
    const percentage = Math.min(Math.max(value, 0), 100);

    return (
      <div className={cn('w-full', className)}>
        {(label || showLabel) && (
          <div className="mb-1 flex items-center justify-between text-sm">
            {label && <span className="text-muted-foreground">{label}</span>}
            {showLabel && !indeterminate && (
              <span className="text-muted-foreground">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(trackSizeVariants({ size }))}
          value={indeterminate ? undefined : percentage}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              progressVariants({ variant, size }),
              'rounded-full',
              indeterminate && 'animate-progress-indeterminate'
            )}
            style={indeterminate ? undefined : { transform: `translateX(-${100 - percentage}%)` }}
          />
        </ProgressPrimitive.Root>
      </div>
    );
  }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress, progressVariants };
