import React from 'react';

export interface SkeletonProps {
  variant?: 'text' | 'title' | 'subtitle' | 'avatar' | 'avatar-lg' | 'button' | 'card' | 'line';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}) => {
  const skeletonClass = `skeleton skeleton-${variant} ${className}`.trim();
  
  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  if (count === 1) {
    return <div className={skeletonClass} style={style} aria-busy="true" aria-live="polite" />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} style={style} aria-busy="true" aria-live="polite" />
      ))}
    </>
  );
};

Skeleton.displayName = 'Skeleton';
