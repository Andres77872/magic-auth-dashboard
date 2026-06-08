import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Meridian: cards sit flat with a 1px border — borders do the work, not shadows.
// `elevated` is kept as an API no-op so existing callers don't break.
const cardVariants = cva('rounded-lg border bg-card text-card-foreground', {
  variants: {
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    },
    elevated: {
      true: '',
      false: '',
    },
    interactive: {
      true: 'cursor-pointer transition-colors hover:border-input hover:bg-accent/30',
      false: '',
    },
  },
  defaultVariants: {
    padding: 'none',
    elevated: false,
    interactive: false,
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  title?: string;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, elevated, interactive, title, children, onClick, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ padding, elevated, interactive: interactive || !!onClick }), className)}
      onClick={onClick}
      tabIndex={interactive || onClick ? 0 : undefined}
      role={interactive || onClick ? 'button' : undefined}
      {...props}
    >
      {title && (
        <div className="flex flex-col space-y-1.5 p-5">
          <div className="text-[15px] font-semibold leading-none">{title}</div>
        </div>
      )}
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = React.HTMLAttributes<HTMLDivElement>;
export type CardDescriptionProps = React.HTMLAttributes<HTMLDivElement>;
export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-5', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-[15px] font-semibold leading-none', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
