/** Roles that are auto-created as default user groups */
export const DEFAULT_GROUP_ROLES = ['admin', 'user', 'readonly'] as const;

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
    ? new RegExp(`^(admin|user|readonly)_${projectId}$`)
    : /^(admin|user|readonly)_.+$/;
  return pattern.test(groupName);
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
