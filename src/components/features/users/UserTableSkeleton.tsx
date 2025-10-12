import React from 'react';

interface UserTableSkeletonProps {
  rows?: number;
}

export function UserTableSkeleton({ rows = 5 }: UserTableSkeletonProps): React.JSX.Element {
  return (
    <div className="user-table-skeleton">
      <div className="skeleton-header">
        {[...Array(7)].map((_, index) => (
          <div key={index} className="skeleton skeleton-title"></div>
        ))}
      </div>
      <div className="skeleton-body">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-row">
            {/* Checkbox */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-checkbox"></div>
            </div>
            {/* Avatar + Username */}
            <div className="skeleton-cell skeleton-cell-user">
              <div className="skeleton skeleton-avatar"></div>
              <div className="skeleton-cell-content">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text skeleton-text-sm"></div>
              </div>
            </div>
            {/* Email */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-text"></div>
            </div>
            {/* User Type */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-badge"></div>
            </div>
            {/* Groups */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-badge"></div>
            </div>
            {/* Projects */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-badge"></div>
            </div>
            {/* Status */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-badge"></div>
            </div>
            {/* Created At */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-text"></div>
            </div>
            {/* Actions */}
            <div className="skeleton-cell">
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserTableSkeleton;
