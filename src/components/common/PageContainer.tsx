import React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  as?: 'div' | 'main' | 'section' | 'article';
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

/**
 * Page body wrapper. The dashboard layout already provides the page gutters,
 * so this only optionally narrows reading-width pages.
 */
export function PageContainer({
  children,
  className = '',
  maxWidth = 'full',
  as: Component = 'div',
}: PageContainerProps): React.JSX.Element {
  return (
    <Component
      className={cn('mx-auto w-full', maxWidthClasses[maxWidth], className)}
    >
      {children}
    </Component>
  );
}

export default PageContainer;
