import type { UserType } from '@/types/auth.types';

export {
  formatCount,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  truncateHash,
} from './formatters';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'purple';

/**
 * Single source of truth for user-type colour: root is the rare, most
 * privileged tier (violet), admins are the accent (azure), consumers are
 * neutral. Keep in sync with UserTypeBadge and UserAvatar.
 */
export const getUserTypeBadgeVariant = (userType: string): BadgeVariant => {
  switch (userType) {
    case 'root':
      return 'purple';
    case 'admin':
      return 'info';
    default:
      return 'secondary';
  }
};

export const USER_TYPE_LABELS: Record<UserType, string> = {
  root: 'Root',
  admin: 'Admin',
  consumer: 'Consumer',
};

export const getUserTypeLabel = (userType: string): string =>
  USER_TYPE_LABELS[userType as UserType] ?? userType;

export const getStatusBadgeVariant = (isActive: boolean): BadgeVariant =>
  isActive ? 'success' : 'secondary';
