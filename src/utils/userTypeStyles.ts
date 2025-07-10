import { UserType } from '@/types/auth.types';

/**
 * Get CSS class name for user type badge styling (text color only)
 */
export function getUserTypeBadgeClass(userType?: UserType | string): string {
  if (!userType) {
    return 'user-type-badge-unknown';
  }

  const type = typeof userType === 'string' ? userType.toLowerCase() : userType;
  
  switch (type) {
    case UserType.ROOT:
    case 'root':
      return 'user-type-badge-root';
    case UserType.ADMIN:
    case 'admin':
      return 'user-type-badge-admin';
    case UserType.CONSUMER:
    case 'consumer':
      return 'user-type-badge-consumer';
    default:
      return 'user-type-badge-unknown';
  }
}

/**
 * Get CSS class name for user type badge with background styling
 */
export function getUserTypeBadgeBackgroundClass(userType?: UserType | string): string {
  if (!userType) {
    return 'user-type-badge-bg-unknown';
  }

  const type = typeof userType === 'string' ? userType.toLowerCase() : userType;
  
  switch (type) {
    case UserType.ROOT:
    case 'root':
      return 'user-type-badge-bg-root';
    case UserType.ADMIN:
    case 'admin':
      return 'user-type-badge-bg-admin';
    case UserType.CONSUMER:
    case 'consumer':
      return 'user-type-badge-bg-consumer';
    default:
      return 'user-type-badge-bg-unknown';
  }
}

/**
 * Get CSS class name for activity severity styling
 */
export function getSeverityClass(severity: 'critical' | 'warning' | 'info' | 'success'): string {
  switch (severity) {
    case 'critical':
      return 'severity-critical';
    case 'warning':
      return 'severity-warning';
    case 'info':
      return 'severity-info';
    case 'success':
      return 'severity-success';
    default:
      return 'severity-info';
  }
} 