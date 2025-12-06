import React from 'react';
import type { ReactNode } from 'react';
import { Card } from '../primitives';
import { cn } from '@/utils/component-utils';

export interface DataViewCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  badges?: ReactNode[];
  stats?: Array<{
    label: string;
    value: ReactNode;
  }>;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DataViewCard({
  title,
  subtitle,
  description,
  icon,
  badges,
  stats,
  actions,
  footer,
  children,
  onClick,
  className = '',
}: DataViewCardProps): React.JSX.Element {
  return (
    <Card 
      className={cn('data-view-card', className)}
      onClick={onClick}
      interactive={!!onClick}
      padding="md"
      elevated
    >
      {(title || subtitle || badges?.length || icon) && (
        <div className="data-view-card__header">
          {icon && <div className="data-view-card__icon" aria-hidden="true">{icon}</div>}
          
          <div className="data-view-card__header-content">
            {title && <h3 className="data-view-card__title">{title}</h3>}
            {subtitle && <p className="data-view-card__subtitle">{subtitle}</p>}
          </div>

          {badges && badges.length > 0 && (
            <div className="data-view-card__badges">
              {badges.map((badge, index) => (
                <span key={index}>{badge}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {description && (
        <p className="data-view-card__description">{description}</p>
      )}

      {children && (
        <div className="data-view-card__content">{children}</div>
      )}

      {stats && stats.length > 0 && (
        <div className="data-view-card__stats">
          {stats.map((stat, index) => (
            <div key={stat.label || index} className="data-view-card__stat">
              <span className="data-view-card__stat-label">{stat.label}</span>
              <div className="data-view-card__stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {(actions || footer) && (
        <div className="data-view-card__footer">
          {footer || actions}
        </div>
      )}
    </Card>
  );
}

export default DataViewCard;

