import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, Users } from 'lucide-react';
import {
  CopyableId,
  ErrorState,
  FactList,
  PageContainer,
  PageHeader,
  Panel,
  UserTypeBadge,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { useAsyncData, useAuth } from '@/hooks';
import { globalRolesService } from '@/services/global-roles.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { userService } from '@/services/user.service';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
} from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { PermissionSource } from '@/types/permission-assignments.types';

const SOURCE_LABELS: Record<
  PermissionSource['source_type'],
  { label: string; icon: typeof ShieldCheck }
> = {
  role: { label: 'From your role', icon: ShieldCheck },
  user_group: { label: 'From your user groups', icon: Users },
  direct: { label: 'Assigned to you directly', icon: Layers },
};

function SourceGroup({
  type,
  sources,
}: {
  type: PermissionSource['source_type'];
  sources: PermissionSource[];
}): React.JSX.Element {
  const { label, icon: Icon } = SOURCE_LABELS[type];
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
        <span className="font-mono text-[11px]">{sources.length}</span>
      </div>
      {sources.length === 0 ? (
        <p className="m-0 text-xs text-muted-foreground">None.</p>
      ) : (
        <ul className="m-0 list-none space-y-1 p-0">
          {sources.map((source) => (
            <li
              key={`${source.source_type}-${source.source_name}-${source.permission_group_hash}`}
              className="flex items-center justify-between gap-3 text-[13px]"
            >
              <span className="truncate text-foreground">
                {source.permission_group_name}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {type === 'direct'
                  ? source.notes || 'Direct'
                  : source.source_name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The signed-in operator's own account and where their access comes from. */
export function ProfilePage(): React.JSX.Element {
  const { user: sessionUser } = useAuth();
  const fetchProfile = useCallback(() => userService.getMyProfile(), []);
  const profile = useAsyncData(fetchProfile);
  const fetchRole = useCallback(() => globalRolesService.getMyRole(), []);
  const role = useAsyncData(fetchRole);
  const fetchSources = useCallback(
    () => permissionAssignmentsService.getMyPermissionSources(),
    []
  );
  const sources = useAsyncData(fetchSources);
  const fetchPermissions = useCallback(
    () => permissionAssignmentsService.getMyPermissions(),
    []
  );
  const permissions = useAsyncData(fetchPermissions);

  const user = profile.data;
  const username = user?.username ?? sessionUser?.username ?? 'Your profile';

  if (profile.error && !user) {
    return (
      <PageContainer>
        <PageHeader title="Your profile" />
        <ErrorState
          title="Your profile could not be loaded"
          message={profile.error}
          onRetry={() => void profile.refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={username}
        icon={<UserAvatar username={username} size="lg" />}
        badge={
          <UserTypeBadge userType={user?.user_type ?? sessionUser?.user_type} />
        }
        subtitle={
          user ? (
            <>
              {user.email || 'No contact email'} · Joined{' '}
              {formatDate(user.created_at)} ·{' '}
              {user.last_login
                ? `Last signed in ${formatRelativeTime(user.last_login)}`
                : 'First session'}
            </>
          ) : (
            'Loading your account…'
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Account">
            {profile.isLoading ? (
              <Skeleton className="h-32" />
            ) : user ? (
              <FactList
                facts={[
                  {
                    label: 'User ID',
                    value: (
                      <CopyableId
                        id={user.user_hash}
                        startChars={10}
                        endChars={4}
                      />
                    ),
                  },
                  {
                    label: 'Contact email',
                    value: user.email || (
                      <span className="text-muted-foreground">Not set</span>
                    ),
                  },
                  { label: 'Created', value: formatDateTime(user.created_at) },
                  {
                    label: 'Last sign-in',
                    value: formatDateTime(user.last_login, 'Never'),
                  },
                ]}
              />
            ) : null}
            <p className="m-0 mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
              Session length and sign-out live in{' '}
              <Link to={ROUTES.SETTINGS}>session settings</Link>.
            </p>
          </Panel>

          <Panel title="Groups & projects" padding="none">
            {profile.isLoading ? (
              <div className="p-5">
                <Skeleton className="h-16" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                <div className="px-5 py-3.5">
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                    User groups
                  </div>
                  {(user?.groups ?? []).length === 0 ? (
                    <p className="m-0 text-xs text-muted-foreground">
                      You aren&apos;t in any user group.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(user?.groups ?? []).map((group) => (
                        <Badge
                          key={group.group_hash}
                          variant="secondary"
                          size="sm"
                        >
                          {group.group_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3.5">
                  <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Projects you can reach
                  </div>
                  {(user?.projects ?? []).length === 0 ? (
                    <p className="m-0 text-xs text-muted-foreground">
                      {user?.user_type === 'root'
                        ? 'Root accounts administer every project without group access.'
                        : 'No project access through groups.'}
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(user?.projects ?? []).map((project) => (
                        <Link
                          key={project.project_hash}
                          to={`${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}`}
                          className="rounded border border-border bg-secondary/60 px-2 py-0.5 text-xs text-foreground no-underline hover:border-input"
                        >
                          {project.project_name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel
            title="Your access"
            description="Where your permissions come from"
          >
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                  Global role
                </div>
                {role.isLoading ? (
                  <Skeleton className="h-5 w-40" />
                ) : role.data ? (
                  <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <span className="font-medium text-foreground">
                      {role.data.role_display_name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {role.data.role_name}
                    </span>
                  </div>
                ) : (
                  <p className="m-0 text-xs text-muted-foreground">
                    No global role.{' '}
                    {(user?.user_type ?? sessionUser?.user_type) !==
                      'consumer' &&
                      'Root and admin accounts get their console permissions from their user type.'}
                  </p>
                )}
              </div>

              {sources.isLoading ? (
                <Skeleton className="h-24" />
              ) : sources.error ? (
                <p className="m-0 text-xs text-muted-foreground">
                  Permission sources could not be loaded.
                </p>
              ) : sources.data ? (
                <>
                  <SourceGroup
                    type="role"
                    sources={sources.data.sources.from_role}
                  />
                  <SourceGroup
                    type="user_group"
                    sources={sources.data.sources.from_user_groups}
                  />
                  <SourceGroup
                    type="direct"
                    sources={sources.data.sources.from_direct_assignment}
                  />
                </>
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Effective permissions"
            description="Every permission you hold, from all sources"
          >
            {permissions.isLoading ? (
              <Skeleton className="h-16" />
            ) : permissions.error ? (
              <p className="m-0 text-xs text-muted-foreground">
                Permissions could not be loaded.
              </p>
            ) : (permissions.data ?? []).length === 0 ? (
              <p className="m-0 text-xs text-muted-foreground">
                No permissions from roles or permission groups.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {(permissions.data ?? []).map((permission) => (
                  <span
                    key={permission}
                    className="rounded border border-border bg-secondary/60 px-1.5 py-px font-mono text-[11px] text-foreground"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </PageContainer>
  );
}

export default ProfilePage;
