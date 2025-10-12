import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: 'default' | 'large';
  className?: string;
}

/**
 * EmptyState Component
 * 
 * Modern empty state pattern for better UX when no data is available.
 * Provides visual feedback and guidance to users.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<InboxIcon />}
 *   title="No projects yet"
 *   description="Get started by creating your first project"
 *   action={<Button variant="primary">Create Project</Button>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  size = 'default',
  className = '',
}) => {
  const iconSizeClass = size === 'large' ? 'empty-state-icon-lg' : '';
  
  return (
    <div className={`empty-state-container ${className}`}>
      <div className={`empty-state-icon ${iconSizeClass}`} aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
