import React, { useState } from 'react';
import { NotificationIcon } from '@/components/icons';

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
        <NotificationIcon size="md" />
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