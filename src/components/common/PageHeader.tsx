import React from 'react';
import { cn } from '@/utils/component-utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

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
    <header className={cn('page-header', className)}>
      <div className="page-header__content">
        <div className="page-header__text">
          <div className="page-header__title-row">
            {icon && <span className="page-header__icon" aria-hidden="true">{icon}</span>}
            <h1 className="page-header__title">{title}</h1>
            {badge && <span className="page-header__badge">{badge}</span>}
          </div>
          {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
      {children && <div className="page-header__extra">{children}</div>}
    </header>
  );
}

export default PageHeader;

