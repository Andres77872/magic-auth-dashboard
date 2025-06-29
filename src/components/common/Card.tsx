import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  border?: boolean;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 'medium',
  shadow = true,
  border = true,
  hover = false,
  className = '',
  onClick,
}: CardProps): React.JSX.Element {
  const cardClasses = [
    'card',
    `card-padding-${padding}`,
    shadow ? 'card-shadow' : '',
    border ? 'card-border' : '',
    hover ? 'card-hover' : '',
    onClick ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
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

export default Card; 