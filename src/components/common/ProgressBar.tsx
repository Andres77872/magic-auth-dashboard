import React from 'react';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  max = 100,
  indeterminate = false,
  className = '',
  label,
  showLabel = false,
}) => {
  const percentage = indeterminate ? 0 : Math.min(Math.max((value / max) * 100, 0), 100);

  const containerClass = `progress-bar ${indeterminate ? 'progress-bar-indeterminate' : ''} ${className}`.trim();

  return (
    <div className="progress-bar-wrapper">
      {(label || showLabel) && (
        <div className="progress-bar-label">
          {label || `${Math.round(percentage)}%`}
        </div>
      )}
      <div className={containerClass} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className="progress-bar-fill"
          style={{ width: indeterminate ? '30%' : `${percentage}%` }}
        />
      </div>
    </div>
  );
};

ProgressBar.displayName = 'ProgressBar';
