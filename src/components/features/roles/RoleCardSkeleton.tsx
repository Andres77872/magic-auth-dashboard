import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/common';
import '../../../styles/components/role-card-skeleton.css';

interface RoleCardSkeletonProps {
  count?: number;
}

export function RoleCardSkeleton({ count = 3 }: RoleCardSkeletonProps): React.JSX.Element {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="role-card-skeleton">
          <CardHeader>
            <div className="skeleton-header">
              <div className="skeleton-icon"></div>
              <div className="skeleton-title-section">
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
              </div>
              <div className="skeleton-badge"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="skeleton-description"></div>
            <div className="skeleton-description short"></div>
            
            <div className="skeleton-stats">
              <div className="skeleton-stat">
                <div className="skeleton-stat-icon"></div>
                <div className="skeleton-stat-content">
                  <div className="skeleton-stat-value"></div>
                  <div className="skeleton-stat-label"></div>
                </div>
              </div>
              <div className="skeleton-stat">
                <div className="skeleton-stat-icon"></div>
                <div className="skeleton-stat-content">
                  <div className="skeleton-stat-value"></div>
                  <div className="skeleton-stat-label"></div>
                </div>
              </div>
            </div>

            <div className="skeleton-actions">
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
              <div className="skeleton-button-icon"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default RoleCardSkeleton;
