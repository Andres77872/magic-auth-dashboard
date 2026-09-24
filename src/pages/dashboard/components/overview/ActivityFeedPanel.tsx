import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { ActivityIcon } from '@/components/common/ActivityIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getActivityLabel, getActivitySummary } from '@/utils/activity';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { ActivityLog } from '@/types/audit.types';

interface ActivityFeedPanelProps {
  activities: ActivityLog[];
  total: number;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

function UserLink({
  username,
  userHash,
}: {
  username: string;
  userHash: string;
}): React.JSX.Element {
  return (
    <Link
      to={`${ROUTES.USERS}/${encodeURIComponent(userHash)}`}
      className="font-medium text-foreground no-underline hover:underline"
    >
      {username}
    </Link>
  );
}

function ActivityRow({
  activity,
}: {
  activity: ActivityLog;
}): React.JSX.Element {
  const summary = getActivitySummary(activity.details);
  return (
    <li className="flex gap-3 py-2.5">
      <ActivityIcon activityType={activity.activityType} className="mt-0.5" />
      <div className="min-w-0 flex-1 text-[13px] leading-5">
        <p className="m-0 text-muted-foreground">
          <span className="font-medium text-foreground">
            {getActivityLabel(activity.activityType)}
          </span>
          {activity.user && (
            <>
              {' · '}
              <UserLink
                username={activity.user.username}
                userHash={activity.user.userHash}
              />
            </>
          )}
          {activity.targetUser &&
            activity.targetUser.userHash !== activity.user?.userHash && (
              <>
                {' → '}
                <UserLink
                  username={activity.targetUser.username}
                  userHash={activity.targetUser.userHash}
                />
              </>
            )}
          {activity.project && (
            <>
              {' in '}
              <Link
                to={`${ROUTES.PROJECTS}/${encodeURIComponent(activity.project.hash)}`}
                className="text-foreground no-underline hover:underline"
              >
                {activity.project.name}
              </Link>
            </>
          )}
        </p>
        {summary && (
          <p className="m-0 truncate text-xs text-muted-foreground">
            {summary}
          </p>
        )}
      </div>
      <time
        dateTime={activity.createdAt}
        title={formatDateTime(activity.createdAt)}
        className="shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground"
      >
        {formatRelativeTime(activity.createdAt)}
      </time>
    </li>
  );
}

/** The latest platform activity with links into the audit log. */
export function ActivityFeedPanel({
  activities,
  total,
  isLoading,
  error,
  onRetry,
}: ActivityFeedPanelProps): React.JSX.Element {
  return (
    <Panel
      title="Recent activity"
      description={
        total > 0
          ? `${total.toLocaleString('en-US')} events in the last 30 days`
          : 'Last 30 days'
      }
      actions={
        <Link
          to={ROUTES.AUDIT}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary no-underline hover:underline"
        >
          Audit log <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
      padding="none"
    >
      {isLoading ? (
        <ul className="m-0 list-none space-y-3 px-5 py-4" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-10" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-5 py-8 text-center">
          <p className="m-0 text-[13px] text-muted-foreground">
            Activity could not be loaded. {error}
          </p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No activity yet"
          description="Sign-ins and management changes will appear here."
          size="sm"
        />
      ) : (
        <ul className="m-0 list-none divide-y divide-border px-5 py-1">
          {activities.map((activity) => (
            <ActivityRow key={activity.id} activity={activity} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default ActivityFeedPanel;
