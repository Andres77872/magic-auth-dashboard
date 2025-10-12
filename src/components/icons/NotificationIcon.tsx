import React from 'react';
import { Icon, type IconProps } from './Icon';

export interface NotificationIconProps extends Omit<IconProps, 'name'> {}

/**
 * Notification Icon - loads notification.svg
 * Used for: Notifications, alerts, bell icon
 */
export function NotificationIcon({
  size = 'md',
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  ...props
}: NotificationIconProps): React.JSX.Element {
  return (
    <Icon
      name="notification"
      size={size}
      color={color}
      className={`notification-icon ${className}`}
      aria-label={ariaLabel || 'Notifications'}
      {...props}
    />
  );
}

export default NotificationIcon; 