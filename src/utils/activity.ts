/**
 * Presentation helpers for activity-log entries (`GET /admin/activity`).
 * Activity types come from api.auth's `ActivityType` enum; unknown future
 * types fall back to a humanised label so nothing renders blank.
 */

export type ActivityCategory =
  | 'auth'
  | 'user'
  | 'project'
  | 'group'
  | 'access'
  | 'bulk'
  | 'email'
  | 'oauth'
  | 'patreon'
  | 'billing'
  | 'system';

export type ActivityTone = 'default' | 'success' | 'warning' | 'destructive';

const LABELS: Record<string, string> = {
  user_login: 'Signed in',
  user_logout: 'Signed out',
  user_registration: 'Registered',
  user_update: 'User updated',
  user_status_change: 'User status changed',
  user_password_reset: 'Password reset',
  user_type_changed: 'User type changed',
  project_creation: 'Project created',
  project_update: 'Project updated',
  project_delete: 'Project deleted',
  project_member_add: 'Project member added',
  project_member_remove: 'Project member removed',
  project_member_removed: 'Project member removed',
  project_ownership_transferred: 'Project ownership transferred',
  project_archived: 'Project archived',
  project_unarchived: 'Project restored',
  group_creation: 'Group created',
  group_update: 'Group updated',
  group_delete: 'Group deleted',
  user_group_assign: 'Added to group',
  user_group_remove: 'Removed from group',
  permission_grant: 'Permission granted',
  permission_revoke: 'Permission revoked',
  role_removed: 'Role removed',
  bulk_role_assignment: 'Bulk role assignment',
  bulk_group_assignment: 'Bulk group assignment',
  bulk_user_update: 'Bulk user update',
  bulk_user_delete: 'Bulk user deletion',
  admin_action: 'Admin action',
  system_event: 'System event',
  auth_email_login: 'Signed in by email link',
  password_reset_requested: 'Password reset requested',
  password_reset_consumed: 'Password reset completed',
  admin_password_reset_requested: 'Password reset sent by admin',
  password_changed: 'Password changed',
  user_email_added: 'Email added',
  user_email_activated: 'Email verified',
  user_email_removed: 'Email removed',
  user_email_primary_changed: 'Primary email changed',
  google_oauth_login_succeeded: 'Signed in with Google',
  google_oauth_login_denied: 'Google sign-in denied',
  google_oauth_external_account_linked: 'Google account linked',
  google_oauth_external_account_unlinked: 'Google account unlinked',
  patreon_linked: 'Patreon linked',
  patreon_unlinked: 'Patreon unlinked',
  patreon_entitlement_changed: 'Patreon entitlement changed',
  billing_checkout_created: 'Checkout started',
  billing_status_changed: 'Billing status changed',
};

const NEGATIVE_MARKERS = [
  'failed',
  'rejected',
  'denied',
  'bounced',
  'complained',
  'dead_lettered',
  'mismatch',
  'miss',
];
const DESTRUCTIVE_TYPES = new Set([
  'project_delete',
  'group_delete',
  'bulk_user_delete',
  'permission_revoke',
  'role_removed',
]);

function humanize(type: string): string {
  const text = type.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getActivityLabel(type: string): string {
  return LABELS[type] ?? humanize(type);
}

export function getActivityCategory(type: string): ActivityCategory {
  if (
    type === 'user_login' ||
    type === 'user_logout' ||
    type.startsWith('auth_') ||
    type.startsWith('password_') ||
    type === 'user_registration'
  )
    return 'auth';
  if (type.startsWith('google_oauth') || type.includes('oauth')) return 'oauth';
  if (type.startsWith('patreon_')) return 'patreon';
  if (type.startsWith('billing_') || type.startsWith('stripe_'))
    return 'billing';
  if (type.startsWith('email_') || type.startsWith('user_email_'))
    return 'email';
  if (type.startsWith('bulk_')) return 'bulk';
  if (type.startsWith('project_')) return 'project';
  if (type.startsWith('group_') || type.startsWith('user_group_'))
    return 'group';
  if (type.startsWith('permission_') || type.startsWith('role_'))
    return 'access';
  if (type.startsWith('user_') || type === 'admin_password_reset_requested')
    return 'user';
  return 'system';
}

export function getActivityTone(type: string): ActivityTone {
  if (NEGATIVE_MARKERS.some((marker) => type.includes(marker)))
    return 'warning';
  if (DESTRUCTIVE_TYPES.has(type)) return 'destructive';
  if (
    type.endsWith('_succeeded') ||
    type.endsWith('_completed') ||
    type.endsWith('_activated')
  )
    return 'success';
  return 'default';
}

/** Short free-text summary from the loosely-typed `details` column, if any. */
export function getActivitySummary(details: unknown): string | null {
  if (!details) return null;
  if (typeof details === 'string') {
    const text = details.trim();
    if (!text) return null;
    // Some rows store JSON as text.
    if (text.startsWith('{')) {
      try {
        return getActivitySummary(JSON.parse(text) as unknown);
      } catch {
        return text;
      }
    }
    return text;
  }
  if (typeof details === 'object' && !Array.isArray(details)) {
    const record = details as Record<string, unknown>;
    for (const key of [
      'message',
      'description',
      'action',
      'operation',
      'reason',
    ]) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }
  return null;
}
