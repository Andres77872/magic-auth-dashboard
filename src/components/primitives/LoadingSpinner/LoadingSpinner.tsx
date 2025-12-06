import { forwardRef } from 'react';
import type { Size, SpinnerVariant } from '../types';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  size?: Size;
  variant?: SpinnerVariant;
  message?: string;
  fullScreen?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const LoadingSpinner = forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      size = 'md',
      variant = 'default',
      message,
      fullScreen = false,
      className = '',
      'aria-label': ariaLabel = 'Loading',
    },
    ref
  ) => {
    const classes = [
      'spinner',
      `spinner-${size}`,
      `spinner-${variant}`,
      fullScreen && 'spinner-fullscreen',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const renderSpinner = () => {
      switch (variant) {
        case 'dots':
          return (
            <div className="spinner-dots" role="status" aria-label={ariaLabel}>
              <span className="spinner-dot" />
              <span className="spinner-dot" />
              <span className="spinner-dot" />
            </div>
          );
        case 'pulse':
          return (
            <div className="spinner-pulse" role="status" aria-label={ariaLabel}>
              <span className="spinner-pulse-circle" />
            </div>
          );
        default:
          return (
            <div className="spinner-circle-container" role="status" aria-label={ariaLabel}>
              <span className="spinner-circle" />
            </div>
          );
      }
    };

    return (
      <div ref={ref} className={classes}>
        {renderSpinner()}
        {message && (
          <p className="spinner-message" aria-live="polite">
            {message}
          </p>
        )}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
