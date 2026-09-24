import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatPercent } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  AdminDashboardStats,
  AdminUserStatistics,
} from '@/types/dashboard.types';

interface UserCompositionPanelProps {
  stats: AdminDashboardStats | null;
  userStats: AdminUserStatistics | null;
  userStatsError: string | null;
  isLoading: boolean;
}

const SEGMENTS = [
  { key: 'root_users', label: 'Root', filter: 'root', className: 'bg-violet' },
  {
    key: 'admin_users',
    label: 'Admin',
    filter: 'admin',
    className: 'bg-primary',
  },
  {
    key: 'consumer_users',
    label: 'Consumer',
    filter: 'consumer',
    className: 'bg-muted-foreground/45',
  },
] as const;

/** Who uses the platform: user-type split plus 30-day growth and activity. */
export function UserCompositionPanel({
  stats,
  userStats,
  userStatsError,
  isLoading,
}: UserCompositionPanelProps): React.JSX.Element {
  const breakdown = stats?.user_breakdown;
  const total = breakdown
    ? breakdown.root_users + breakdown.admin_users + breakdown.consumer_users
    : 0;

  return (
    <Panel
      title="Users by type"
      description="Root and admin accounts can sign in to this console"
      actions={
        <Link
          to={ROUTES.USERS}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary no-underline hover:underline"
        >
          All users <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      }
    >
      {isLoading || !breakdown ? (
        <div className="space-y-3" aria-hidden="true">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ) : (
        <>
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary"
            role="img"
            aria-label={SEGMENTS.map(
              (s) => `${s.label}: ${breakdown[s.key]}`
            ).join(', ')}
          >
            {SEGMENTS.map((segment) =>
              breakdown[segment.key] > 0 ? (
                <span
                  key={segment.key}
                  className={segment.className}
                  style={{
                    width: `${(breakdown[segment.key] / Math.max(total, 1)) * 100}%`,
                  }}
                />
              ) : null
            )}
          </div>

          <ul className="mt-4 divide-y divide-border">
            {SEGMENTS.map((segment) => {
              const count = breakdown[segment.key];
              return (
                <li key={segment.key}>
                  <Link
                    to={`${ROUTES.USERS}?type=${segment.filter}`}
                    className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 text-[13px] no-underline transition-colors hover:bg-accent/50"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-sm ${segment.className}`}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-foreground">
                      {segment.label}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatNumber(count)}
                    </span>
                    <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                      {total > 0 ? formatPercent((count / total) * 100) : '—'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <MiniStat
          label="New · 30d"
          value={userStats ? formatNumber(userStats.new_users) : null}
          loading={!userStats && !userStatsError}
        />
        <MiniStat
          label="Active · 30d"
          value={userStats ? formatNumber(userStats.active_users) : null}
          loading={!userStats && !userStatsError}
        />
        <MiniStat
          label="Activity rate"
          value={userStats ? formatPercent(userStats.activity_rate) : null}
          loading={!userStats && !userStatsError}
        />
      </div>
      {userStatsError && (
        <p className="mt-2 text-xs text-muted-foreground">
          30-day statistics are unavailable right now.
        </p>
      )}
    </Panel>
  );
}

function MiniStat({
  label,
  value,
  loading,
}: {
  label: string;
  value: string | null;
  loading: boolean;
}): React.JSX.Element {
  return (
    <div className="min-w-0">
      <div className="truncate text-[11px] font-medium uppercase tracking-[0.05em] text-muted-foreground">
        {label}
      </div>
      {loading ? (
        <Skeleton className="mt-1.5 h-5 w-12" />
      ) : (
        <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
          {value ?? '—'}
        </div>
      )}
    </div>
  );
}

export default UserCompositionPanel;
