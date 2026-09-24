import React from 'react';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  isDefaultProjectGroup,
  isDefaultUserGroup,
  isProjectAdminGroupName,
} from '@/utils/default-groups';

export type GroupKind = 'user' | 'project';

/** Quiet marker for groups api.auth creates with every project. Renders nothing for other groups. */
export function DefaultGroupBadge({
  kind,
  name,
}: {
  kind: GroupKind;
  name: string;
}): React.JSX.Element | null {
  const isDefault =
    kind === 'user' ? isDefaultUserGroup(name) : isDefaultProjectGroup(name);
  if (!isDefault) return null;
  return (
    <Badge
      variant="secondary"
      size="sm"
      title="Created automatically with a project"
    >
      Project default
    </Badge>
  );
}

/**
 * Marks `admin_…` user groups (membership makes users admins of the matching
 * project). Shows a lock for operators who can't change them.
 */
export function AdminGroupBadge({
  name,
  canManage,
}: {
  name: string;
  canManage: boolean;
}): React.JSX.Element | null {
  if (!isProjectAdminGroupName(name)) return null;
  return (
    <Badge
      variant="warning"
      size="sm"
      title={
        canManage
          ? 'Members administer the matching project'
          : 'Only root users can change this group'
      }
    >
      {!canManage && <Lock className="h-3 w-3" aria-hidden="true" />}
      Admin group
    </Badge>
  );
}

/** One-line explanation shown to non-root operators on an `admin_…` group they can view but not change. */
export function RootOnlyNotice({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground',
        className
      )}
    >
      <Lock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        Only root users can change{' '}
        <span className="font-mono text-foreground">admin_…</span> groups: their
        members administer a project. You can view this group, but not edit it
        or its members and project groups.
      </span>
    </p>
  );
}
