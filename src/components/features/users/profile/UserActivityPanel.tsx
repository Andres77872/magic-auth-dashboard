import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { ActivityIcon, EmptyState, Panel } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncData } from '@/hooks';
import { auditService } from '@/services/audit.service';
import { getActivityLabel, getActivitySummary } from '@/utils/activity';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { User } from '@/types/auth.types';

interface UserActivityPanelProps {
  user: User;
}

/**
 * Recent activity performed by this user. The activity filter takes the
 * internal user id, which the user's own `user_type_info` provides.
 */
export function UserActivityPanel({
  user,
}: UserActivityPanelProps): React.JSX.Element {
  const internalId = user.user_type_info?.user_id;
  const fetchActivity = useCallback(
    () =>
      auditService.getActivityLogs({
        user_id: internalId,
        limit: 25,
        days: 90,
      }),
    [internalId]
  );
  const activity = useAsyncData(fetchActivity, {
    enabled: Boolean(internalId),
  });
  const items = activity.data?.activities ?? [];

  return (
    <Panel
      title="Recent activity"
      description="Actions performed by this user in the last 90 days"
      padding="none"
    >
      {!internalId ? (
        <p className="m-0 px-5 py-4 text-[13px] text-muted-foreground">
          Activity isn&apos;t available for this account.
        </p>
      ) : activity.isLoading ? (
        <div className="space-y-3 px-5 py-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-5" />
          ))}
        </div>
      ) : activity.error ? (
        <div className="flex items-center justify-between gap-3 px-5 py-4 text-[13px] text-muted-foreground">
          Activity could not be loaded.
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void activity.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<History />} title="No recent activity" size="sm" />
      ) : (
        <ul className="m-0 list-none divide-y divide-border px-5 py-1">
          {items.map((item) => {
            const summary = getActivitySummary(item.details);
            return (
              <li key={item.id} className="flex gap-3 py-2.5">
                <ActivityIcon
                  activityType={item.activityType}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1 text-[13px]">
                  <p className="m-0 text-foreground">
                    {getActivityLabel(item.activityType)}
                    {item.targetUser &&
                      item.targetUser.userHash !== user.user_hash && (
                        <>
                          {' → '}
                          <Link
                            to={`${ROUTES.USERS}/${encodeURIComponent(item.targetUser.userHash)}`}
                            className="text-foreground no-underline hover:underline"
                          >
                            {item.targetUser.username}
                          </Link>
                        </>
                      )}
                    {item.project && (
                      <span className="text-muted-foreground">
                        {' '}
                        in {item.project.name}
                      </span>
                    )}
                  </p>
                  {summary && (
                    <p className="m-0 truncate text-xs text-muted-foreground">
                      {summary}
                    </p>
                  )}
                </div>
                <time
                  dateTime={item.createdAt}
                  title={formatDateTime(item.createdAt)}
                  className="shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {formatRelativeTime(item.createdAt)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export default UserActivityPanel;
