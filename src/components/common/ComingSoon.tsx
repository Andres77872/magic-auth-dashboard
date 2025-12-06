import React from 'react';
import { ClockIcon, ArrowLeftIcon } from '@/components/icons';
import { Button, Card } from '../primitives';

interface ComingSoonProps {
  title: string;
  description: string;
  feature: string;
  backUrl?: string;
  backLabel?: string;
}

export function ComingSoon({
  title,
  description,
  feature,
  backUrl = '/dashboard',
  backLabel = 'Back to Dashboard',
}: ComingSoonProps): React.JSX.Element {
  return (
    <div className="coming-soon">
      <Card className="coming-soon__card" padding="lg">
        <div className="coming-soon__icon" aria-hidden="true">
          <ClockIcon size={48} />
        </div>
        
        <h1 className="coming-soon__title">{title}</h1>
        <p className="coming-soon__description">{description}</p>
        
        <div className="coming-soon__feature">
          <span className="coming-soon__feature-badge">Coming Soon</span>
          <p className="coming-soon__feature-text">
            {feature} functionality will be implemented in an upcoming milestone.
          </p>
        </div>
        
        <div className="coming-soon__actions">
          <Button
            variant="primary"
            size="md"
            onClick={() => window.location.href = backUrl}
          >
            <ArrowLeftIcon size={16} aria-hidden="true" />
            {backLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ComingSoon; 