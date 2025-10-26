import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Standardized page container with consistent spacing and max-width
 * Wrap all page content with this component for consistent layout
 */
export function PageContainer({
  children,
  className = '',
  maxWidth = 'full',
}: PageContainerProps): React.JSX.Element {
  const containerClasses = [
    'page-container',
    `page-container-${maxWidth}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

export default PageContainer;

