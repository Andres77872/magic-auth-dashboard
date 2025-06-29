import React, { useState } from 'react';

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          <div className="notification-content">
            <p className="no-notifications">No new notifications</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell; 