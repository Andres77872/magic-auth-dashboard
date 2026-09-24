import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, History } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { ActivityIcon } from '@/components/common/ActivityIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectActivity } from '@/hooks/useProjectDetails';
import { getActivityLabel, getActivitySummary } from '@/utils/activity';
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  ProjectActivityActor,
  ProjectActivityEntry,
} from '@/types/project.types';

function UserLink({
  actor,
}: {
  actor: ProjectActivityActor;
}): React.JSX.Element {
  return (
    <Link
      to={`${ROUTES.USERS}/${encodeURIComponent(actor.userHash)}`}
      className="font-medium text-foreground no-underline hover:underline"
    >
      {actor.username}
    </Link>
  );
}

function ActivityRow({
  entry,
}: {
  entry: ProjectActivityEntry;
}): React.JSX.Element {
  const summary = getActivitySummary(entry.details);
  return (
    <li className="flex gap-3 py-2.5">
      <ActivityIcon activityType={entry.activityType} className="mt-0.5" />
      <div className="min-w-0 flex-1 text-[13px] leading-5">
        <p className="m-0 text-muted-foreground">
          <span className="font-medium text-foreground">
            {getActivityLabel(entry.activityType)}
          </span>
          {entry.actor && (
            <>
              {' · '}
              <UserLink actor={entry.actor} />
            </>
          )}
          {entry.target && entry.target.userHash !== entry.actor?.userHash && (
            <>
              {' → '}
              <UserLink actor={entry.target} />
            </>
          )}
          {entry.userGroupName && <> · {entry.userGroupName}</>}
        </p>
        {summary && (
          <p className="m-0 truncate text-xs text-muted-foreground">
            {summary}
          </p>
        )}
      </div>
      {entry.createdAt && (
        <time
          dateTime={entry.createdAt}
          title={formatDateTime(entry.createdAt)}
          className="shrink-0 pt-0.5 font-mono text-[11px] text-muted-foreground"
        >
          {formatRelativeTime(entry.createdAt)}
        </time>
      )}
    </li>
  );
}

/** The latest entries of `GET /projects/{hash}/activity`, with a link to the audit log. */
export function ProjectActivityPanel({
  projectHash,
}: {
  projectHash: string;
}): React.JSX.Element {
  const { activities, total, days, isLoading, error, refetch, isRefreshing } =
    useProjectActivity(projectHash, {
      limit: 8,
      days: 30,
    });

  return (
    <Panel
      title="Recent activity"
      description={
        isLoading || error
          ? `Last ${days} days`
          : `${formatNumber(total)} ${total === 1 ? 'event' : 'events'} in the last ${days} days`
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
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-10" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <div
          className="flex flex-col items-center gap-3 px-5 py-8 text-center"
          role="alert"
        >
          <p className="m-0 text-[13px] text-muted-foreground">
            Activity could not be loaded. {error}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefreshing}
          >
            Try again
          </Button>
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<History />}
          title="No activity in this window"
          description="Sign-ins and changes scoped to this project appear here."
          size="sm"
        />
      ) : (
        <ul className="m-0 list-none divide-y divide-border px-5 py-1">
          {activities.map((entry) => (
            <ActivityRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default ProjectActivityPanel;
