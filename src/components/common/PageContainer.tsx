import React from 'react';
import { cn } from '@/utils/component-utils';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  as?: 'div' | 'main' | 'section' | 'article';
}

export function PageContainer({
  children,
  className = '',
  maxWidth = 'full',
  as: Component = 'div',
}: PageContainerProps): React.JSX.Element {
  return (
    <Component className={cn('page-container', `page-container--${maxWidth}`, className)}>
      {children}
    </Component>
  );
}

export default PageContainer;

