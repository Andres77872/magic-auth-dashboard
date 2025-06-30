import React from 'react';
import { ClockIcon } from '@/components/icons';

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
          <ClockIcon size={64} />
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