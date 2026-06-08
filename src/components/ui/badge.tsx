import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Meridian status pills are borderless quiet tints (saturated text on a faint
// tinted background). Solid semantic fills are not part of the language, so the
// semantic variants render as quiet tints — same look as their `subtle*` twins.
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-primary-subtle text-primary-subtle-foreground',
        secondary: 'bg-muted-subtle text-muted-subtle-foreground',
        destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
        error: 'bg-destructive-subtle text-destructive-subtle-foreground',
        success: 'bg-success-subtle text-success-subtle-foreground',
        warning: 'bg-warning-subtle text-warning-subtle-foreground',
        info: 'bg-info-subtle text-info-subtle-foreground',
        outline: 'border border-border text-foreground',
        // Subtle variants (kept for explicit callers; identical to semantic twins)
        subtle: 'bg-muted-subtle text-muted-subtle-foreground',
        subtlePrimary: 'bg-primary-subtle text-primary-subtle-foreground',
        subtleDestructive:
          'bg-destructive-subtle text-destructive-subtle-foreground',
        subtleSuccess: 'bg-success-subtle text-success-subtle-foreground',
        subtleWarning: 'bg-warning-subtle text-warning-subtle-foreground',
        subtleInfo: 'bg-info-subtle text-info-subtle-foreground',
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
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
