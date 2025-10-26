import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Standardized page header component used across all pages
 * Provides consistent layout for page titles, descriptions, and actions
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  badge,
  children,
  className = '',
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className={`page-header ${className}`.trim()}>
      <div className="page-header-content">
        <div className="page-header-text">
          <div className="page-header-title-row">
            {icon && <span className="page-header-icon" aria-hidden="true">{icon}</span>}
            <h1 className="page-header-title">{title}</h1>
            {badge && <span className="page-header-badge">{badge}</span>}
          </div>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {children && <div className="page-header-extra">{children}</div>}
    </div>
  );
}

export default PageHeader;

