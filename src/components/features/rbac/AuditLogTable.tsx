import React from 'react';

interface AuditLogTableProps {
  projectHash: string;
  filters: any;
  onPageChange: (offset: number) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  projectHash,
  filters,
  onPageChange
}) => {
  return (
    <div className="audit-log-table">
      <div className="table-placeholder">
        <h4>Audit Log</h4>
        <p>Audit log implementation coming soon...</p>
        <div className="mock-audit-entries">
          <div className="audit-entry">
            <span className="timestamp">2024-01-15 10:30:00</span>
            <span className="action">Permission Created</span>
            <span className="user">admin</span>
            <span className="target">view_users</span>
          </div>
          <div className="audit-entry">
            <span className="timestamp">2024-01-15 09:15:00</span>
            <span className="action">Role Updated</span>
            <span className="user">admin</span>
            <span className="target">Manager</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 