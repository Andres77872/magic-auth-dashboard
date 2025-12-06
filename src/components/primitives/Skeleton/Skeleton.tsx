import { forwardRef } from 'react';
import type { SkeletonVariant } from '../types';
import './Skeleton.css';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  count?: number;
  animated?: boolean;
  className?: string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      count = 1,
      animated = true,
      className = '',
    },
    ref
  ) => {
    const classes = [
      'skeleton',
      `skeleton-${variant}`,
      animated && 'skeleton-animated',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    if (count === 1) {
      return (
        <div
          ref={ref}
          className={classes}
          style={style}
          aria-busy="true"
          aria-live="polite"
        />
      );
    }

    return (
      <div ref={ref} className="skeleton-group">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={classes}
            style={style}
            aria-busy="true"
            aria-live="polite"
          />
        ))}
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

export default Skeleton;
