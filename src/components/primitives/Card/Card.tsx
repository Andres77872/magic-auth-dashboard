import React, { forwardRef } from 'react';
import type { CardPadding } from '../types';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  padding?: CardPadding;
  elevated?: boolean;
  interactive?: boolean;
  as?: 'div' | 'article' | 'section';
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLElement, CardProps>(
  (
    {
      padding = 'md',
      elevated = false,
      interactive = false,
      as: Component = 'div',
      children,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const classes = [
      'card',
      `card-padding-${padding}`,
      elevated && 'card-elevated',
      (interactive || onClick) && 'card-interactive',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={classes}
        onClick={onClick}
        tabIndex={interactive || onClick ? 0 : undefined}
        role={interactive || onClick ? 'button' : undefined}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`card-header ${className}`.trim()} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = '', ...props }, ref) => (
    <h3 ref={ref} className={`card-title ${className}`.trim()} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={`card-content ${className}`.trim()} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export default Card;
