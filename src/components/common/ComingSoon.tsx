import React from 'react';

interface ComingSoonProps {
  title: string;
  description: string;
  feature: string;
}

export function ComingSoon({ title, description, feature }: ComingSoonProps): React.JSX.Element {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        
        <h1>{title}</h1>
        <p className="description">{description}</p>
        
        <div className="feature-info">
          <h3>Coming Soon</h3>
          <p>{feature} functionality will be implemented in an upcoming milestone.</p>
        </div>
        
        <div className="back-link">
          <a href="/dashboard" className="btn btn-primary">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default ComingSoon; 