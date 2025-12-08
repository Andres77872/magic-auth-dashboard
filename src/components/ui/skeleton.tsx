import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const skeletonVariants = cva('rounded-md bg-primary/10', {
  variants: {
    variant: {
      text: 'h-4 w-full',
      title: 'h-6 w-3/4',
      avatar: 'h-10 w-10 rounded-full',
      'avatar-lg': 'h-16 w-16 rounded-full',
      button: 'h-9 w-24',
      card: 'h-32 w-full',
      rectangular: '',
      line: 'h-4 w-full',
    },
    animated: {
      true: 'animate-pulse',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'text',
    animated: true,
  },
});

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
  count?: number;
}

function Skeleton({
  className,
  variant,
  animated = true,
  width,
  height,
  count = 1,
  style,
  ...props
}: SkeletonProps) {
  const computedStyle: React.CSSProperties = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height }),
  };

  if (count === 1) {
    return (
      <div
        className={cn(skeletonVariants({ variant, animated }), className)}
        style={computedStyle}
        aria-busy="true"
        aria-live="polite"
        {...props}
      />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(skeletonVariants({ variant, animated }), className)}
          style={computedStyle}
          aria-busy="true"
          aria-live="polite"
          {...props}
        />
      ))}
    </div>
  );
}

export { Skeleton, skeletonVariants };
