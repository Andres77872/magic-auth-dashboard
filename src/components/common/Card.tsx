import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  clickable?: boolean;
  className?: string;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
}

export function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 'md',
  elevated = false,
  clickable = false,
  className = '',
  onClick,
  role,
  tabIndex,
}: CardProps): React.JSX.Element {
  const cardClasses = [
    'card',
    padding !== 'md' ? `card-padding-${padding}` : '',
    elevated ? 'card-elevated' : '',
    (clickable || onClick) ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const CardWrapper = (clickable || onClick) ? 'button' : 'div';

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      type={(clickable || onClick) ? 'button' : undefined}
      role={role}
      tabIndex={(clickable || onClick) ? (tabIndex ?? 0) : undefined}
      aria-label={title || undefined}
    >
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
    </CardWrapper>
  );
}

// Composable Card sub-components
export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps): React.JSX.Element {
  return <div className={`card-header ${className}`.trim()}>{children}</div>;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps): React.JSX.Element {
  return <h3 className={`card-title ${className}`.trim()}>{children}</h3>;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps): React.JSX.Element {
  return <div className={`card-content ${className}`.trim()}>{children}</div>;
}

export default Card; 