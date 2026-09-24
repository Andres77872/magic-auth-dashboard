import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  PageContainer,
  PageHeader,
  StatCard,
  TabNavigation,
  UserTypeBadge,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { UserActionsMenu } from '@/components/features/users/UserActionsMenu';
import { getUserCapabilities } from '@/components/features/users/user-capabilities';
import { UserAccountPanel } from '@/components/features/users/profile/UserAccountPanel';
import { UserAccessPanels } from '@/components/features/users/profile/UserAccessPanels';
import { UserPermissionsPanels } from '@/components/features/users/profile/UserPermissionsPanels';
import { AdminProjectsPanel } from '@/components/features/users/profile/AdminProjectsPanel';
import { UserActivityPanel } from '@/components/features/users/profile/UserActivityPanel';
import { useSetBreadcrumbLabel } from '@/contexts';
import {
  useAuth,
  useTabParam,
  useUserProfileDetails,
  useUserType,
} from '@/hooks';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';

const TABS = ['overview', 'access', 'permissions', 'activity'] as const;

function ProfileSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading user">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export function UserProfilePage(): React.JSX.Element {
  const { userHash } = useParams<{ userHash: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { userType } = useUserType();
  const { user, isLoading, isRefreshing, error, notFound, refetch } =
    useUserProfileDetails(userHash);
  const [activeTab, setTab] = useTabParam(TABS, 'overview');

  useSetBreadcrumbLabel(user?.username);

  if (isLoading) {
    return (
      <PageContainer>
        <ProfileSkeleton />
      </PageContainer>
    );
  }

  if (notFound) {
    return (
      <PageContainer>
        <EmptyState
          icon={<UserX />}
          title="User not found"
          description="The account doesn't exist, or it has been deactivated. Deactivated accounts can't be opened."
          action={
            <Button asChild variant="secondary">
              <Link to={`${ROUTES.USERS}?status=all`}>Back to users</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
        <ErrorState
          title="This user could not be loaded"
          message={error ?? undefined}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
        />
      </PageContainer>
    );
  }

  const isSelf = currentUser?.user_hash === user.user_hash;
  const caps = getUserCapabilities(
    { userType, userHash: currentUser?.user_hash },
    {
      user_hash: user.user_hash,
      user_type: user.user_type,
      is_active: user.is_active,
    }
  );
  const groups = user.groups ?? [];
  const projects = user.projects ?? [];
  const permissionTotal = new Set(
    projects.flatMap((p) => p.effective_permissions ?? p.permissions ?? [])
  ).size;

  return (
    <PageContainer>
      <PageHeader
        title={user.username}
        icon={<UserAvatar username={user.username} size="lg" />}
        badge={
          <>
            <UserTypeBadge userType={user.user_type} />
            {user.is_active ? (
              <Badge variant="success" size="sm" dot>
                Active
              </Badge>
            ) : (
              <Badge variant="secondary" size="sm" dot>
                Deactivated
              </Badge>
            )}
            {isSelf && (
              <Badge variant="outline" size="sm">
                You
              </Badge>
            )}
          </>
        }
        subtitle={
          <>
            {user.email || 'No contact email'} · Joined{' '}
            {formatDate(user.created_at)} ·{' '}
            {user.last_login
              ? `Last signed in ${formatRelativeTime(user.last_login)}`
              : 'Never signed in'}
          </>
        }
        actions={
          <UserActionsMenu
            user={user}
            trigger="button"
            hideViewProfile
            onUserUpdated={() => void refetch()}
            onUserRemoved={() => void navigate(ROUTES.USERS)}
          />
        }
      />

      <section
        aria-label="Access summary"
        className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
      >
        <StatCard
          title="Groups"
          value={groups.length}
          subValue="Direct memberships"
        />
        <StatCard
          title="Projects"
          value={projects.length}
          subValue="Reachable through groups"
        />
        <StatCard
          title="Permissions"
          value={permissionTotal}
          subValue="Distinct, across projects"
        />
        <StatCard
          title="Last sign-in"
          value={
            user.last_login ? formatRelativeTime(user.last_login) : 'Never'
          }
          subValue={
            user.last_login
              ? formatDate(user.last_login)
              : 'No sessions recorded'
          }
        />
      </section>

      <TabNavigation
        className="mb-6 mt-8"
        ariaLabel="User sections"
        activeTab={activeTab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'access', label: 'Groups & projects', count: groups.length },
          { id: 'permissions', label: 'Roles & permissions' },
          { id: 'activity', label: 'Activity' },
        ]}
      />

      <div role="tabpanel" aria-label={activeTab}>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <UserAccountPanel user={user} />
            {user.user_type === 'admin' ? (
              <AdminProjectsPanel user={user} />
            ) : (
              <UserActivityPanel user={user} />
            )}
          </div>
        )}
        {activeTab === 'access' && (
          <UserAccessPanels
            user={user}
            canManage={caps.canManageAccess}
            onChanged={() => void refetch()}
          />
        )}
        {activeTab === 'permissions' && (
          <UserPermissionsPanels user={user} canManage={caps.canManageAccess} />
        )}
        {activeTab === 'activity' && <UserActivityPanel user={user} />}
      </div>
    </PageContainer>
  );
}

export default UserProfilePage;
