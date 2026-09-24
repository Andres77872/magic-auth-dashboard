import React from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, Info } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { CopyableId } from '@/components/common/CopyableId';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  ProjectGroupInfo,
  ProjectInfo,
  ProjectUserAccess,
} from '@/types/project.types';
import { ProjectAccessBadge } from './ProjectAccessBadge';
import { ProjectActivityPanel } from './ProjectActivityPanel';
import { ProjectAdministratorsPanel } from './ProjectAdministratorsPanel';

interface ProjectOverviewTabProps {
  project: ProjectInfo;
  userAccess: ProjectUserAccess;
  projectGroups: ProjectGroupInfo[];
  /** Root or an assigned admin (can read the project's user groups). */
  canManage: boolean;
  /** Only root may change the project's `admin_…` group. */
  isRoot: boolean;
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3 py-2.5 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

/** Facts about the project, where it sits in the access chain, who administers it and what happened recently. */
export function ProjectOverviewTab({
  project,
  userAccess,
  projectGroups,
  canManage,
  isRoot,
}: ProjectOverviewTabProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {!canManage && (
        <div className="flex gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-[13px] text-muted-foreground">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-info"
            aria-hidden="true"
          />
          <p className="m-0">
            You reach this project through your user groups but don&apos;t
            administer it. Members, groups, sign-in and settings are available
            to root users and the project&apos;s administrators.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Details">
            <dl className="m-0 divide-y divide-border">
              <Fact label="Project hash">
                <CopyableId id={project.project_hash} label="Project hash" />
              </Fact>
              <Fact label="Created">
                {formatDateTime(project.created_at, 'Not reported')}
              </Fact>
              {project.updated_at && (
                <Fact label="Last updated">
                  {formatDateTime(project.updated_at)}
                </Fact>
              )}
              <Fact label="Your access">
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectAccessBadge accessLevel={userAccess.access_level} />
                  <span className="text-xs text-muted-foreground">
                    {userAccess.access_level === 'admin_access'
                      ? isRoot
                        ? 'Root users administer every project.'
                        : 'You are one of its administrators.'
                      : 'Through your user groups.'}
                  </span>
                </div>
              </Fact>
            </dl>
          </Panel>

          <ProjectActivityPanel projectHash={project.project_hash} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Project groups"
            description="User groups granted one of these groups can sign in to the project."
            padding="none"
          >
            {projectGroups.length === 0 ? (
              <EmptyState
                icon={<FolderTree />}
                title="Not in any project group"
                description="No user group can reach this project until it is added to a project group."
                size="sm"
              />
            ) : (
              <ul className="m-0 list-none divide-y divide-border px-5 py-1">
                {projectGroups.map((group) => (
                  <li key={group.group_hash} className="py-2.5">
                    <Link
                      to={`${ROUTES.PROJECT_GROUPS}/${encodeURIComponent(group.group_hash)}`}
                      className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
                    >
                      {group.group_name}
                    </Link>
                    {group.description && (
                      <p className="m-0 truncate text-xs text-muted-foreground">
                        {group.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {canManage && (
            <ProjectAdministratorsPanel
              projectHash={project.project_hash}
              canEdit={isRoot}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectOverviewTab;
