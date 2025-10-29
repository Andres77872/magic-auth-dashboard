import React from 'react';
import type { ReactNode } from 'react';
import { Card } from './Card';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// DATAVIEWCARD COMPONENT
// ============================================================================

/**
 * DataViewCard - Reusable card component for grid views in DataView
 * 
 * Provides a consistent structure for displaying items in grid view:
 * - Header with title, subtitle, and badges
 * - Content area with description and custom content
 * - Stats section for key metrics
 * - Footer with actions
 * 
 * @example
 * ```tsx
 * <DataViewCard
 *   title="Project Name"
 *   subtitle="Active"
 *   description="Project description"
 *   badges={[<Badge variant="success">Active</Badge>]}
 *   stats={[
 *     { label: 'Members', value: '12' },
 *     { label: 'Tasks', value: '45' }
 *   ]}
 *   actions={<Button>View Details</Button>}
 * />
 * ```
 */
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
  const cardClasses = [
    'data-view-card',
    onClick ? 'data-view-card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card 
      className={cardClasses}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {/* Header Section */}
      {(title || subtitle || badges?.length || icon) && (
        <div className="data-view-card-header">
          {icon && <div className="data-view-card-icon">{icon}</div>}
          
          <div className="data-view-card-header-content">
            {title && (
              <h3 className="data-view-card-title">{title}</h3>
            )}
            
            {subtitle && (
              <p className="data-view-card-subtitle">{subtitle}</p>
            )}
          </div>

          {badges && badges.length > 0 && (
            <div className="data-view-card-badges">
              {badges.map((badge, index) => (
                <div key={index}>{badge}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="data-view-card-description">{description}</p>
      )}

      {/* Custom Content */}
      {children && (
        <div className="data-view-card-content">{children}</div>
      )}

      {/* Stats Section */}
      {stats && stats.length > 0 && (
        <div className="data-view-card-stats">
          {stats.map((stat, index) => (
            <div key={index} className="data-view-card-stat">
              <span className="data-view-card-stat-label">{stat.label}</span>
              <div className="data-view-card-stat-value">{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer with Actions */}
      {(actions || footer) && (
        <div className="data-view-card-footer">
          {footer || actions}
        </div>
      )}
    </Card>
  );
}

export default DataViewCard;

