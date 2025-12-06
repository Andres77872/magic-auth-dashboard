import React from 'react';
import { cn } from '@/utils/component-utils';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}) => {
  return (
    <div className={cn('empty-state', `empty-state--${size}`, className)}>
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && (
        <p className="empty-state__description">{description}</p>
      )}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
