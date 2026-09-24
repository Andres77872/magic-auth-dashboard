/**
 * Naming conventions of the groups api.auth creates with every project:
 * one project group `default_<project id>` holding the project, and three
 * user groups `admin_<project id>`, `user_<project id>`, `readonly_<project id>`
 * that are granted it. `<project id>` is the internal project id, not the
 * public `proj-…` hash, so these names can't be mapped back to a project here.
 */

/** Roles that are auto-created as default user groups */
export const DEFAULT_GROUP_ROLES = ['admin', 'user', 'readonly'] as const;

/** Prefix of user groups that hold project admin assignments; only root may change them. */
export const PROJECT_ADMIN_GROUP_PREFIX = 'admin_';

/**
 * Check if a group name matches the default group naming pattern.
 * @param groupName - The group name to check
 * @param projectId - Optional project ID for stricter matching
 */
export function isDefaultUserGroup(
  groupName: string,
  projectId?: string
): boolean {
  const pattern = projectId
    ? new RegExp(`^(admin|user|readonly)_${escapeRegExp(projectId)}$`)
    : /^(admin|user|readonly)_.+$/;
  return pattern.test(groupName);
}

/** Whether a project group name matches the auto-created `default_<project id>` pattern. */
export function isDefaultProjectGroup(groupName: string): boolean {
  return /^default_.+$/.test(groupName);
}

/**
 * Get the role part of a default group name.
 * Returns null if the group is not a default group.
 */
export function getDefaultGroupRole(groupName: string): string | null {
  const match = groupName.match(/^(admin|user|readonly)_/);
  return match ? match[1] : null;
}

/**
 * Whether api.auth treats a user-group name as a project admin group
 * (`admin_…`). The backend compares names the way MySQL's
 * `utf8mb4_unicode_ci` collation does — ignoring case, accents, width and
 * surrounding spaces — so "Ádmin_x" counts too. Membership of such a group
 * makes users admins of the matching project, which is why only root may
 * change these groups (other callers get 403). This is a UX hint only.
 */
export function isProjectAdminGroupName(
  groupName: string | null | undefined
): boolean {
  const key = (groupName ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  return key.startsWith(PROJECT_ADMIN_GROUP_PREFIX);
}

/**
 * Generate the expected default group names for a project.
 */
export function getDefaultGroupsForProject(projectId: string): Array<{
  role: string;
  name: string;
  description: string;
}> {
  const descriptions: Record<string, string> = {
    admin: 'Project administrators',
    user: 'Regular users',
    readonly: 'Read-only users',
  };
  return DEFAULT_GROUP_ROLES.map((role) => ({
    role,
    name: `${role}_${projectId}`,
    description: descriptions[role],
  }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
