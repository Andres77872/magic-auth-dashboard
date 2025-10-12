import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'subtle' | 'dots' | 'pulse';
  message?: string;
  showMessage?: boolean;
  centered?: boolean;
  fullScreen?: boolean;
  className?: string;
  'aria-label'?: string;
}

// Map legacy size names to new convention
const sizeMap: Record<string, string> = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  message,
  showMessage = true,
  centered = false,
  fullScreen = false,
  className = '',
  'aria-label': ariaLabel,
}: LoadingSpinnerProps): React.JSX.Element {
  // Normalize size to new convention
  const normalizedSize = sizeMap[size] || size;
  
  const baseClass = 'magic-loading-spinner';
  const sizeClass = `${baseClass}--${normalizedSize}`;
  const variantClass = `${baseClass}--${variant}`;
  const centeredClass = centered ? `${baseClass}--centered` : '';
  const fullScreenClass = fullScreen ? `${baseClass}--fullscreen` : '';

  const containerClasses = [
    baseClass,
    sizeClass,
    variantClass,
    centeredClass,
    fullScreenClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`${baseClass}__dots`} role="status" aria-label={ariaLabel || 'Loading'}>
            <div className={`${baseClass}__dot`}></div>
            <div className={`${baseClass}__dot`}></div>
            <div className={`${baseClass}__dot`}></div>
          </div>
        );
      case 'pulse':
        return (
          <div className={`${baseClass}__pulse`} role="status" aria-label={ariaLabel || 'Loading'}>
            <div className={`${baseClass}__pulse-circle`}></div>
          </div>
        );
      default:
        return (
          <div className={`${baseClass}__spinner`} role="status" aria-label={ariaLabel || 'Loading'}>
            <div className={`${baseClass}__circle`}></div>
          </div>
        );
    }
  };

  return (
    <div className={containerClasses}>
      {renderSpinner()}
      {message && showMessage && (
        <div className={`${baseClass}__message`} aria-live="polite">
          {message}
        </div>
      )}
    </div>
  );
}

export default LoadingSpinner; 