import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground',
        error: 'border-transparent bg-destructive text-destructive-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        info: 'border-transparent bg-info text-info-foreground',
        outline: 'text-foreground',
        // Subtle variants for badges with light backgrounds
        subtle:
          'border-transparent bg-muted-subtle text-muted-subtle-foreground',
        subtlePrimary:
          'border-transparent bg-primary-subtle text-primary-subtle-foreground',
        subtleDestructive:
          'border-transparent bg-destructive-subtle text-destructive-subtle-foreground',
        subtleSuccess:
          'border-transparent bg-success-subtle text-success-subtle-foreground',
        subtleWarning:
          'border-transparent bg-warning-subtle text-warning-subtle-foreground',
        subtleInfo:
          'border-transparent bg-info-subtle text-info-subtle-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            (variant === 'success' || variant === 'subtleSuccess') &&
              'bg-success-foreground',
            (variant === 'error' ||
              variant === 'destructive' ||
              variant === 'subtleDestructive') &&
              'bg-destructive-foreground',
            (variant === 'warning' || variant === 'subtleWarning') &&
              'bg-warning-foreground',
            (variant === 'info' || variant === 'subtleInfo') &&
              'bg-info-foreground',
            (variant === 'primary' || variant === 'subtlePrimary') &&
              'bg-primary-foreground',
            (variant === 'secondary' || variant === 'subtle') &&
              'bg-secondary-foreground',
            (!variant || variant === 'outline') && 'bg-current'
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
