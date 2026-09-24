/**
 * Activity log: management and sign-in events (`GET /admin/activity`) with
 * search, type and time filters, server pagination, a detail sheet and an
 * export of exactly what the filters match.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { ErrorState } from '@/components/common/ErrorState';
import { TablePager } from '@/components/common/TablePager';
import { ActivityIcon } from '@/components/common/ActivityIcon';
import { Button } from '@/components/ui/button';
import { EntityCombobox } from '@/components/features/shared-pickers';
import { useActivityLogs, useActivityTypes } from '@/hooks/audit/useAuditData';
import { getActivityLabel, getActivitySummary } from '@/utils/activity';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type {
  ActivityFilters,
  ActivityLog,
  ActivityUser,
} from '@/types/audit.types';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import { ActivityExport } from './ActivityExport';
import { DaysSelect, FilterChip, RefreshButton } from './AuditFilterControls';

export interface ActivityLogTabProps {
  className?: string;
}

const PAGE_SIZES = [25, 50, 100];
const DEFAULT_DAYS = 30;

interface ScopeFilter {
  id: string;
  label: string;
}

function NoRowClick({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <span data-no-row-click onClick={(event) => event.stopPropagation()}>
      {children}
    </span>
  );
}

function PersonLink({ user }: { user: ActivityUser }): React.JSX.Element {
  return (
    <NoRowClick>
      <Link
        to={`${ROUTES.USERS}/${encodeURIComponent(user.userHash)}`}
        className="text-foreground no-underline hover:underline"
      >
        {user.username}
      </Link>
    </NoRowClick>
  );
}

const COLUMNS: DataViewColumn<ActivityLog>[] = [
  {
    key: 'activityType',
    header: 'Event',
    render: (_value, activity) => {
      const summary = getActivitySummary(activity.details);
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <ActivityIcon activityType={activity.activityType} />
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">
              {getActivityLabel(activity.activityType)}
            </div>
            {summary && (
              <div className="max-w-[320px] truncate text-xs text-muted-foreground">
                {summary}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    key: 'user',
    header: 'Actor',
    render: (_value, activity) =>
      activity.user ? (
        <PersonLink user={activity.user} />
      ) : (
        <span className="text-muted-foreground">System</span>
      ),
  },
  {
    key: 'targetUser',
    header: 'Target',
    hideOnMobile: true,
    render: (_value, activity) =>
      activity.targetUser &&
      activity.targetUser.userHash !== activity.user?.userHash ? (
        <PersonLink user={activity.targetUser} />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'project',
    header: 'Project',
    hideOnMobile: true,
    render: (_value, activity) =>
      activity.project ? (
        <NoRowClick>
          <Link
            to={`${ROUTES.PROJECTS}/${encodeURIComponent(activity.project.hash)}`}
            className="text-foreground no-underline hover:underline"
          >
            {activity.project.name}
          </Link>
        </NoRowClick>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'ipAddress',
    header: 'IP address',
    hideOnMobile: true,
    render: (_value, activity) =>
      activity.ipAddress ? (
        <span className="font-mono text-xs text-muted-foreground">
          {activity.ipAddress}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: 'createdAt',
    header: 'When',
    align: 'right',
    render: (_value, activity) => (
      <time
        dateTime={activity.createdAt}
        title={formatDateTime(activity.createdAt)}
        className="whitespace-nowrap font-mono text-[11px] text-muted-foreground"
      >
        {formatRelativeTime(activity.createdAt)}
      </time>
    ),
  },
];

export function ActivityLogTab({
  className,
}: ActivityLogTabProps): React.JSX.Element {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activityType, setActivityType] = useState<string | undefined>(
    undefined
  );
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [userScope, setUserScope] = useState<ScopeFilter | null>(null);
  const [projectScope, setProjectScope] = useState<ScopeFilter | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZES[0]);
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  // Debounce free-text search; every filter change restarts at the first page.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === search) return undefined;
    const handle = window.setTimeout(() => {
      setSearch(next);
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, search]);

  const filters: ActivityFilters = useMemo(
    () => ({
      activityType,
      days,
      search: search || undefined,
      userId: userScope?.id,
      projectId: projectScope?.id,
    }),
    [activityType, days, search, userScope, projectScope]
  );

  const { activities, total, isLoading, isRefreshing, error, refetch } =
    useActivityLogs({ filters, limit, offset });
  const types = useActivityTypes();
  const typeOptions = useMemo(
    () =>
      types.activityTypes
        .map((type) => ({
          value: type,
          label: getActivityLabel(type),
          description: type,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [types.activityTypes]
  );

  const hasFilters = Boolean(
    activityType || search || userScope || projectScope || days !== DEFAULT_DAYS
  );
  const setFilter = (apply: () => void): void => {
    apply();
    setOffset(0);
  };
  const clearFilters = (): void =>
    setFilter(() => {
      setSearchInput('');
      setSearch('');
      setActivityType(undefined);
      setDays(DEFAULT_DAYS);
      setUserScope(null);
      setProjectScope(null);
    });

  if (error && activities.length === 0 && !isLoading) {
    return (
      <ErrorState
        title="The activity log could not be loaded"
        message={error}
        onRetry={() => void refetch()}
        isRetrying={isRefreshing}
      />
    );
  }

  return (
    <div
      className={cn(
        'transition-opacity',
        isRefreshing && 'opacity-70',
        className
      )}
    >
      <DataView<ActivityLog>
        data={activities}
        columns={COLUMNS}
        keyExtractor={(activity) => activity.id}
        showSearch
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search type, details or username"
        toolbarFilters={
          <>
            <div className="w-full sm:w-52">
              <EntityCombobox
                aria-label="Filter by activity type"
                value={activityType ?? ''}
                options={typeOptions}
                isLoading={types.isLoading}
                error={types.error}
                onChange={(option) =>
                  setFilter(() => setActivityType(option?.value))
                }
                placeholder="All activity types"
                searchPlaceholder="Search activity types"
                clearable
              />
            </div>
            <DaysSelect
              value={days}
              onChange={(next) => setFilter(() => setDays(next))}
            />
            {userScope && (
              <FilterChip
                label="User"
                value={userScope.label}
                onRemove={() => setFilter(() => setUserScope(null))}
              />
            )}
            {projectScope && (
              <FilterChip
                label="Project"
                value={projectScope.label}
                onRemove={() => setFilter(() => setProjectScope(null))}
              />
            )}
          </>
        }
        toolbarActions={
          <>
            <RefreshButton
              onClick={() => void refetch()}
              refreshing={isRefreshing}
              label="Refresh activity"
            />
            <ActivityExport
              source="activity"
              matchCount={total}
              filters={{
                activity_type: activityType,
                days,
                user_id: userScope?.id,
                project_id: projectScope?.id,
              }}
              unsupportedFilterNote={
                search ? 'Search text is not applied to exports' : undefined
              }
            />
          </>
        }
        onRowClick={setSelected}
        isLoading={isLoading}
        skeletonRows={8}
        emptyIcon={<History className="h-8 w-8" />}
        emptyMessage={
          hasFilters
            ? 'No activity matches these filters'
            : 'No activity in this period'
        }
        emptyDescription={
          hasFilters
            ? 'Try a longer time range or clear the filters.'
            : 'Sign-ins and management changes will appear here.'
        }
        emptyAction={
          hasFilters ? (
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
        caption="Activity log"
      />
      <TablePager
        offset={offset}
        limit={limit}
        pageCount={activities.length}
        total={total}
        onOffsetChange={setOffset}
        pageSizeOptions={PAGE_SIZES}
        onLimitChange={(next) => {
          setLimit(next);
          setOffset(0);
        }}
        itemLabel="entries"
      />

      <ActivityDetailPanel
        activity={selected}
        onClose={() => setSelected(null)}
        onFilterUser={(user) => {
          setSelected(null);
          setFilter(() => setUserScope({ id: user.id, label: user.username }));
        }}
        onFilterProject={(project) => {
          setSelected(null);
          setFilter(() =>
            setProjectScope({ id: project.id, label: project.name })
          );
        }}
      />
    </div>
  );
}

export default ActivityLogTab;
