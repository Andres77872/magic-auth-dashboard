import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'medium',
  message,
  className = '',
}: LoadingSpinnerProps): React.JSX.Element {
  const sizeClass = `spinner-${size}`;

  return (
    <div className={`loading-spinner ${className}`}>
      <div className={`spinner ${sizeClass}`}>
        <div className="spinner-circle"></div>
      </div>
      {message && (
        <p className="spinner-message">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner; 