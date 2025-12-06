import { forwardRef } from 'react';
import type { FormSize, ProgressVariant } from '../types';
import './ProgressBar.css';

export interface ProgressBarProps {
  value?: number;
  size?: FormSize;
  variant?: ProgressVariant;
  indeterminate?: boolean;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      value = 0,
      size = 'md',
      variant = 'primary',
      indeterminate = false,
      showLabel = false,
      label,
      className = '',
    },
    ref
  ) => {
    const percentage = Math.min(Math.max(value, 0), 100);

    const classes = [
      'progress',
      `progress-${size}`,
      `progress-${variant}`,
      indeterminate && 'progress-indeterminate',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes}>
        {(label || showLabel) && (
          <div className="progress-header">
            {label && <span className="progress-label">{label}</span>}
            {showLabel && !indeterminate && (
              <span className="progress-value">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-fill"
            style={{ width: indeterminate ? undefined : `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
