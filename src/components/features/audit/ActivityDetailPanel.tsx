/**
 * Side sheet for one activity entry. Shows the listed row immediately and
 * fills in severity, user agent and metadata from `GET /admin/activity/{id}`.
 * People and projects link by hash; the internal ids are only used to filter.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityIcon } from '@/components/common/ActivityIcon';
import { CopyableId } from '@/components/common/CopyableId';
import { useActivityDetail } from '@/hooks/audit/useAuditData';
import { getActivityLabel } from '@/utils/activity';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  ActivityLog,
  ActivityProject,
  ActivityUser,
} from '@/types/audit.types';
import { SEVERITY_BADGE, formatStructured } from './audit-format';

export interface ActivityDetailPanelProps {
  activity: ActivityLog | null;
  onClose: () => void;
  onFilterUser?: (user: ActivityUser) => void;
  onFilterProject?: (project: ActivityProject) => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function UserLink({ user }: { user: ActivityUser }): React.JSX.Element {
  return (
    <Link
      to={`${ROUTES.USERS}/${encodeURIComponent(user.userHash)}`}
      className="text-foreground no-underline hover:underline"
    >
      {user.username}
    </Link>
  );
}

function Structured({ value }: { value: string }): React.JSX.Element {
  return (
    <pre className="m-0 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground">
      {value}
    </pre>
  );
}

export function ActivityDetailPanel({
  activity,
  onClose,
  onFilterUser,
  onFilterProject,
}: ActivityDetailPanelProps): React.JSX.Element {
  const detail = useActivityDetail(activity?.id ?? null);
  const entry = detail.activity ?? activity;
  const details = entry ? formatStructured(entry.details) : null;
  const metadata = detail.activity
    ? formatStructured(detail.activity.metadata)
    : null;

  return (
    <Sheet open={activity !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {entry && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3 pr-6">
                <ActivityIcon activityType={entry.activityType} />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-[17px]">
                    {getActivityLabel(entry.activityType)}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    <time dateTime={entry.createdAt}>
                      {formatDateTime(entry.createdAt)}
                    </time>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <dl className="mt-5 divide-y divide-border border-y border-border">
              <Row label="Severity">
                {detail.activity ? (
                  <Badge
                    variant={SEVERITY_BADGE[detail.activity.severity].variant}
                    size="sm"
                  >
                    {SEVERITY_BADGE[detail.activity.severity].label}
                  </Badge>
                ) : detail.isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Row>
              <Row label="Type">
                <span className="font-mono text-xs">{entry.activityType}</span>
                {detail.activity?.activityCategory && (
                  <span className="text-muted-foreground">
                    {' '}
                    · {detail.activity.activityCategory}
                  </span>
                )}
              </Row>
              {detail.activity?.activityDescription && (
                <Row label="About">{detail.activity.activityDescription}</Row>
              )}
              <Row label="Actor">
                {entry.user ? (
                  <UserLink user={entry.user} />
                ) : (
                  <span className="text-muted-foreground">System</span>
                )}
              </Row>
              {entry.targetUser && (
                <Row label="Target">
                  <UserLink user={entry.targetUser} />
                </Row>
              )}
              {entry.project && (
                <Row label="Project">
                  <Link
                    to={`${ROUTES.PROJECTS}/${encodeURIComponent(entry.project.hash)}`}
                    className="text-foreground no-underline hover:underline"
                  >
                    {entry.project.name}
                  </Link>
                </Row>
              )}
              <Row label="IP address">
                {entry.ipAddress ? (
                  <span className="font-mono text-xs">{entry.ipAddress}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Row>
              {detail.activity?.userAgent && (
                <Row label="User agent">
                  <span className="text-xs text-muted-foreground">
                    {detail.activity.userAgent}
                  </span>
                </Row>
              )}
              <Row label="Entry ID">
                <CopyableId id={entry.id} label="Activity ID" />
              </Row>
            </dl>

            {detail.error && (
              <p className="mt-3 text-xs text-muted-foreground">
                Extra details couldn&apos;t be loaded. {detail.error}
              </p>
            )}

            {details && (
              <section className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Details
                </h3>
                <Structured value={details} />
              </section>
            )}
            {metadata && (
              <section className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  Metadata
                </h3>
                <Structured value={metadata} />
              </section>
            )}

            {(entry.user && onFilterUser) ||
            (entry.project && onFilterProject) ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {entry.user && onFilterUser && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => entry.user && onFilterUser(entry.user)}
                  >
                    <Filter aria-hidden="true" />
                    Only {entry.user.username}
                  </Button>
                )}
                {entry.project && onFilterProject && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      entry.project && onFilterProject(entry.project)
                    }
                  >
                    <Filter aria-hidden="true" />
                    Only {entry.project.name}
                  </Button>
                )}
              </div>
            ) : null}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ActivityDetailPanel;
