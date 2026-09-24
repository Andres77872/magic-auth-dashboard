import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  FolderKanban,
  RefreshCw,
  Users,
  UsersRound,
} from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  StatCard,
  ErrorState,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import {
  useAuth,
  useBillingMetrics,
  useRecentActivity,
  useSystemHealth,
  useSystemStats,
  useUserStatistics,
  useUserType,
} from '@/hooks';
import { formatNumber, formatRelativeTime } from '@/utils/formatters';
import { getUserTypeLabel } from '@/utils/component-utils';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import { AccessModelPanel } from './components/overview/AccessModelPanel';
import { ActivityFeedPanel } from './components/overview/ActivityFeedPanel';
import { ServiceHealthPanel } from './components/overview/ServiceHealthPanel';
import { UserCompositionPanel } from './components/overview/UserCompositionPanel';

function weeklyDelta(
  count: number | undefined,
  noun: string
): string | undefined {
  if (count === undefined) return undefined;
  return count > 0
    ? `+${formatNumber(count)} ${noun} in the last 7 days`
    : `No new ${noun} this week`;
}

export function DashboardOverview(): React.JSX.Element {
  const { user } = useAuth();
  const { isRoot } = useUserType();
  const { stats, isLoading, isRefreshing, error, updatedAt, refetch } =
    useSystemStats();
  const userStats = useUserStatistics(30);
  const activity = useRecentActivity({ limit: 8 });
  const health = useSystemHealth();
  const billing = useBillingMetrics();

  const refreshAll = (): void => {
    void refetch();
    void userStats.refetch();
    void activity.refetch();
    void health.refetch();
    billing.refetch();
  };

  const refreshing =
    isRefreshing ||
    activity.isRefreshing ||
    health.isRefreshing ||
    userStats.isRefreshing;
  const totals = stats?.totals;

  return (
    <PageContainer>
      <PageHeader
        title="Overview"
        subtitle={
          <>
            Signed in as{' '}
            <span className="font-medium text-foreground">
              {user?.username}
            </span>
            {user && ` · ${getUserTypeLabel(user.user_type)}`}
            {updatedAt && <> · Updated {formatRelativeTime(updatedAt)}</>}
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={refreshAll}
              disabled={refreshing}
              aria-label="Refresh overview"
            >
              <RefreshCw
                className={cn(refreshing && 'animate-spin')}
                aria-hidden="true"
              />
              Refresh
            </Button>
            <Button asChild variant="primary" size="md">
              <Link to={ROUTES.USERS}>Manage users</Link>
            </Button>
          </>
        }
      />

      {error && !stats ? (
        <ErrorState
          title="Platform statistics are unavailable"
          message={error}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
          variant="card"
          size="md"
        />
      ) : (
        <section
          aria-label="Platform totals"
          className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            title="Users"
            value={formatNumber(totals?.users)}
            icon={<Users />}
            href={ROUTES.USERS}
            loading={isLoading}
            subValue={weeklyDelta(stats?.recent_activity.new_users_7d, 'users')}
          />
          <StatCard
            title="Active sessions"
            value={formatNumber(totals?.active_sessions)}
            icon={<Activity />}
            variant="success"
            loading={isLoading}
            subValue="Live access tokens · 15-minute lifetime"
          />
          <StatCard
            title="Projects"
            value={formatNumber(totals?.projects)}
            icon={<FolderKanban />}
            href={ROUTES.PROJECTS}
            loading={isLoading}
            subValue={weeklyDelta(
              stats?.recent_activity.new_projects_7d,
              'projects'
            )}
          />
          <StatCard
            title="User groups"
            value={formatNumber(totals?.user_groups)}
            icon={<UsersRound />}
            href={ROUTES.GROUPS}
            loading={isLoading}
            subValue={
              totals
                ? `${formatNumber(totals.project_groups)} project groups · ${formatNumber(stats?.groups_summary.avg_users_per_group ?? 0)} users per group on average`
                : undefined
            }
          />
        </section>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <UserCompositionPanel
            stats={stats}
            userStats={userStats.statistics}
            userStatsError={userStats.error}
            isLoading={isLoading}
          />
          <ServiceHealthPanel
            health={health.health}
            healthError={health.error}
            isLoading={health.isLoading}
            billing={billing.metrics}
            canViewDetails={isRoot}
            onRetry={() => void health.refetch()}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <ActivityFeedPanel
            activities={activity.activities}
            total={activity.total}
            isLoading={activity.isLoading}
            error={activity.error}
            onRetry={() => void activity.refetch()}
          />
          <AccessModelPanel stats={stats} isLoading={isLoading} />
        </div>
      </div>
    </PageContainer>
  );
}

export default DashboardOverview;
