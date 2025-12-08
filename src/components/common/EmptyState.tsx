import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    container: 'py-6',
    icon: '[&>svg]:h-6 [&>svg]:w-6',
    title: 'text-sm',
    description: 'text-xs',
  },
  md: {
    container: 'py-12',
    icon: '[&>svg]:h-8 [&>svg]:w-8',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: '[&>svg]:h-12 [&>svg]:w-12',
    title: 'text-xl',
    description: 'text-base',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}) => {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      <div className={cn('mb-4 text-muted-foreground', sizes.icon)} aria-hidden="true">
        {icon}
      </div>
      <h3 className={cn('font-semibold', sizes.title)}>{title}</h3>
      {description && (
        <p className={cn('mt-1 text-muted-foreground max-w-sm', sizes.description)}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
