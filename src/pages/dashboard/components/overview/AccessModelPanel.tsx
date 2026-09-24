import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  FolderKanban,
  KeyRound,
  Layers,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { AdminDashboardStats } from '@/types/dashboard.types';

interface AccessModelPanelProps {
  stats: AdminDashboardStats | null;
  isLoading: boolean;
}

interface Node {
  label: string;
  count?: number;
  href: string;
  icon: typeof User;
}

function Chain({
  nodes,
  isLoading,
}: {
  nodes: Node[];
  isLoading: boolean;
}): React.JSX.Element {
  return (
    <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <li key={node.label} className="flex items-center gap-1.5">
            <Link
              to={node.href}
              className="flex items-center gap-2 rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-[13px] text-foreground no-underline transition-colors hover:border-input hover:bg-accent"
            >
              <Icon
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              <span>{node.label}</span>
              {node.count !== undefined &&
                (isLoading ? (
                  <Skeleton className="h-3.5 w-5" />
                ) : (
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {formatNumber(node.count)}
                  </span>
                ))}
            </Link>
            {index < nodes.length - 1 && (
              <ChevronRight
                className="h-3.5 w-3.5 text-muted-foreground/60"
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Explains how access is granted, using live counts: users reach projects
 * through user groups and project groups, and gain permissions through a
 * global role or permission-group assignments.
 */
export function AccessModelPanel({
  stats,
  isLoading,
}: AccessModelPanelProps): React.JSX.Element {
  const totals = stats?.totals;
  return (
    <Panel
      title="How access works"
      description="Every grant follows one of these two paths"
    >
      <div className="space-y-4">
        <div>
          <p className="m-0 mb-2 text-xs font-medium text-muted-foreground">
            Project access
          </p>
          <Chain
            isLoading={isLoading}
            nodes={[
              {
                label: 'Users',
                count: totals?.users,
                href: ROUTES.USERS,
                icon: User,
              },
              {
                label: 'User groups',
                count: totals?.user_groups,
                href: ROUTES.GROUPS,
                icon: Users,
              },
              {
                label: 'Project groups',
                count: totals?.project_groups,
                href: `${ROUTES.GROUPS}?tab=project-groups`,
                icon: Layers,
              },
              {
                label: 'Projects',
                count: totals?.projects,
                href: ROUTES.PROJECTS,
                icon: FolderKanban,
              },
            ]}
          />
        </div>
        <div>
          <p className="m-0 mb-2 text-xs font-medium text-muted-foreground">
            Permissions
          </p>
          <Chain
            isLoading={isLoading}
            nodes={[
              {
                label: 'Global role',
                href: `${ROUTES.PERMISSIONS}?tab=roles`,
                icon: ShieldCheck,
              },
              {
                label: 'Permission groups',
                href: `${ROUTES.PERMISSIONS}?tab=permission-groups`,
                icon: Layers,
              },
              {
                label: 'Permissions',
                href: `${ROUTES.PERMISSIONS}?tab=permissions`,
                icon: KeyRound,
              },
            ]}
          />
          <p className="m-0 mt-2 text-xs text-muted-foreground">
            Permission groups can also be assigned to a user group or directly
            to a user. Only the global role is embedded in a consumer&apos;s
            access token.
          </p>
        </div>
      </div>
    </Panel>
  );
}

export default AccessModelPanel;
