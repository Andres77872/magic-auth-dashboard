import React from 'react';
import { cn } from '@/lib/utils';

export type IconContainerVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'purple';

export type IconContainerSize = 'sm' | 'md' | 'lg' | 'xl';

const variantStyles: Record<IconContainerVariant, string> = {
  default: 'bg-muted-subtle text-muted-subtle-foreground',
  primary: 'bg-primary-subtle text-primary-subtle-foreground',
  success: 'bg-success-subtle text-success-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
  destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
  info: 'bg-info-subtle text-info-subtle-foreground',
  purple: 'bg-purple-subtle text-purple-subtle-foreground',
};

const sizeStyles: Record<IconContainerSize, string> = {
  sm: 'h-6 w-6 rounded-full',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-10 w-10 rounded-lg',
  xl: 'h-12 w-12 rounded-lg',
};

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: IconContainerVariant;
  size?: IconContainerSize;
  icon: React.ReactNode;
}

export function IconContainer({
  variant = 'default',
  size = 'md',
  icon,
  className,
  ...props
}: IconContainerProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      aria-hidden="true"
      {...props}
    >
      {icon}
    </div>
  );
}

export default IconContainer;
