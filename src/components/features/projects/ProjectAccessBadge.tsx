import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ProjectAccessLevel } from '@/types/project.types';

const LABELS: Record<ProjectAccessLevel, { label: string; title: string }> = {
  admin_access: {
    label: 'Admin access',
    title: 'You administer this project (root, or an admin assigned to it).',
  },
  group_access: {
    label: 'Group access',
    title:
      'You reach this project through your user groups but do not administer it.',
  },
};

/**
 * The caller's access to a project, as reported by api.auth. Unknown values
 * (a future backend level) render neutrally instead of breaking the page.
 */
export function ProjectAccessBadge({
  accessLevel,
}: {
  accessLevel: ProjectAccessLevel;
}): React.JSX.Element {
  const known = (
    LABELS as Partial<Record<string, { label: string; title: string }>>
  )[accessLevel];
  const { label, title } = known ?? {
    label: String(accessLevel).replace(/_/g, ' '),
    title: 'Access level reported by the API',
  };
  return (
    <Badge
      variant={accessLevel === 'admin_access' ? 'info' : 'secondary'}
      size="sm"
      title={title}
    >
      {label}
    </Badge>
  );
}

export default ProjectAccessBadge;
