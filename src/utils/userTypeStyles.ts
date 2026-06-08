import { UserType } from '@/types/auth.types';

/**
 * Tailwind text-color utility for a user-type label (Meridian semantic tokens).
 */
export function getUserTypeBadgeClass(userType?: UserType | string): string {
  const type = typeof userType === 'string' ? userType.toLowerCase() : userType;

  switch (type) {
    case UserType.ROOT:
    case 'root':
      return 'text-primary-subtle-foreground';
    case UserType.ADMIN:
    case 'admin':
      return 'text-info-subtle-foreground';
    case UserType.CONSUMER:
    case 'consumer':
      return 'text-muted-subtle-foreground';
    default:
      return 'text-muted-subtle-foreground';
  }
}

/**
 * Tailwind quiet-tint badge utilities (bg + text) for a user type.
 */
export function getUserTypeBadgeBackgroundClass(userType?: UserType | string): string {
  const type = typeof userType === 'string' ? userType.toLowerCase() : userType;

  switch (type) {
    case UserType.ROOT:
    case 'root':
      return 'bg-primary-subtle text-primary-subtle-foreground';
    case UserType.ADMIN:
    case 'admin':
      return 'bg-info-subtle text-info-subtle-foreground';
    case UserType.CONSUMER:
    case 'consumer':
      return 'bg-muted-subtle text-muted-subtle-foreground';
    default:
      return 'bg-muted-subtle text-muted-subtle-foreground';
  }
}

/**
 * Tailwind text-color utility for an activity severity (Meridian semantic tokens).
 */
export function getSeverityClass(
  severity: 'critical' | 'warning' | 'info' | 'success'
): string {
  switch (severity) {
    case 'critical':
      return 'text-destructive';
    case 'warning':
      return 'text-warning';
    case 'success':
      return 'text-success';
    case 'info':
    default:
      return 'text-info';
  }
}
