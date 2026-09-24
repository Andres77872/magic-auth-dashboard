import type { UserType } from '@/types/auth.types';

export interface UserCapabilities {
  canEdit: boolean;
  canChangeType: boolean;
  canResetPassword: boolean;
  canDeactivate: boolean;
  canDelete: boolean;
  canHardDelete: boolean;
  canManageAccess: boolean;
  /** Why destructive actions are unavailable, for tooltips/copy. */
  reason?: string;
}

interface Actor {
  userType: UserType | null;
  userHash: string | undefined;
}

interface Target {
  user_hash: string;
  user_type: string;
  is_active?: boolean;
}

/**
 * What the signed-in operator may do to a user. Mirrors api.auth's rules so
 * the UI only offers actions that can succeed — the backend still enforces
 * them (admins are further limited to users in their projects).
 *
 * - Nobody can deactivate, delete or retype their own account.
 * - Only root can change user types, hard-delete, or act on root accounts.
 * - Password resets are not available for root accounts.
 * - Inactive accounts can't be changed further (the API can't find them).
 */
export function getUserCapabilities(
  actor: Actor,
  target: Target
): UserCapabilities {
  const isRoot = actor.userType === 'root';
  const isAdmin = actor.userType === 'admin';
  const isSelf = !!actor.userHash && actor.userHash === target.user_hash;
  const targetIsRoot = target.user_type === 'root';
  const isActive = target.is_active !== false;
  const canActOnTarget = isRoot || (isAdmin && !targetIsRoot);

  if (!isActive) {
    return {
      canEdit: false,
      canChangeType: false,
      canResetPassword: false,
      canDeactivate: false,
      canDelete: false,
      canHardDelete: isRoot && !isSelf,
      canManageAccess: false,
      reason:
        'This account is deactivated. The API cannot modify or reactivate it.',
    };
  }

  return {
    canEdit: canActOnTarget,
    canChangeType: isRoot && !isSelf,
    canResetPassword: canActOnTarget && !targetIsRoot,
    canDeactivate: canActOnTarget && !isSelf,
    canDelete: canActOnTarget && !isSelf,
    canHardDelete: isRoot && !isSelf,
    canManageAccess: canActOnTarget,
    reason: isSelf
      ? 'You cannot deactivate or delete your own account.'
      : targetIsRoot && !isRoot
        ? 'Only root can manage root accounts.'
        : undefined,
  };
}
