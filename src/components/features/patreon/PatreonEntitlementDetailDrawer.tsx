/**
 * PatreonEntitlementDetailDrawer
 *
 * Right-side drawer with one user's normalized Patreon entitlement and its
 * recent transitions. Only fetches while open with a non-null userHash.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyableId, ErrorState, Skeleton } from '@/components/common';
import { usePatreonEntitlement, usePatreonEntitlementHistory } from '@/hooks';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import {
  isPatreonTimestampPast,
  patreonReasonLabel,
  patreonStatusLabel,
  type PatreonEntitlementDetail,
  type PatreonHistoryItem,
} from '@/types/patreon.types';
import { StatusBadge } from './StatusBadge';
import { Timestamp } from './patreon-format';

interface PatreonEntitlementDetailDrawerProps {
  userHash: string | null;
  displayName?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onResync?: (userHash: string, label: string) => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}

function DetailBody({
  detail,
}: {
  detail: PatreonEntitlementDetail;
}): React.JSX.Element {
  const stale =
    detail.status === 'active' && isPatreonTimestampPast(detail.staleAfter);
  return (
    <section
      aria-labelledby="patreon-entitlement-heading"
      className="space-y-3"
    >
      <h3 id="patreon-entitlement-heading" className="sr-only">
        Current entitlement
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={detail.status} />
        <StatusBadge
          status={detail.linkStatus}
          label={`Link: ${patreonStatusLabel(detail.linkStatus).toLowerCase()}`}
        />
        {stale && <Badge variant="warning">Stale</Badge>}
      </div>
      {stale && (
        <p className="text-sm text-muted-foreground">
          This paid entitlement has not been refreshed from Patreon within the
          freshness window. It is served as stale until a sync succeeds.
        </p>
      )}
      <dl className="divide-y divide-border">
        <Row label="Plan">
          <span className="font-mono">{detail.planCode}</span>
        </Row>
        <Row label="Tier">{detail.tierName || detail.tierCode || '—'}</Row>
        <Row label="Next renewal">
          {detail.nextRenewalAt ? formatDateTime(detail.nextRenewalAt) : '—'}
        </Row>
        {detail.gracePeriodUntil && (
          <Row label="Grace period until">
            {formatDateTime(detail.gracePeriodUntil)}
          </Row>
        )}
        <Row label="Last synced">
          <Timestamp value={detail.lastSyncedAt} className="text-sm" />
        </Row>
        <Row label="Fresh until">
          {detail.staleAfter ? formatDateTime(detail.staleAfter) : '—'}
        </Row>
        {detail.classificationVersion !== null && (
          <Row label="Classification version">
            {detail.classificationVersion}
          </Row>
        )}
      </dl>
    </section>
  );
}

function Transition({
  from,
  to,
}: {
  from: string | null;
  to: string;
}): React.JSX.Element {
  if (!from || from === to) return <span>{patreonStatusLabel(to)}</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {patreonStatusLabel(from)}
      <ArrowRight className="h-3 w-3 text-muted-foreground" aria-label="to" />
      {patreonStatusLabel(to)}
    </span>
  );
}

function HistoryList({
  items,
}: {
  items: PatreonHistoryItem[];
}): React.JSX.Element {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No entitlement changes recorded yet.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {items.map((item) => {
        const planChanged =
          item.previousPlanCode !== null &&
          item.previousPlanCode !== item.newPlanCode;
        return (
          <li
            key={item.historyId}
            className="rounded-md border border-border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-foreground">
                <Transition from={item.previousStatus} to={item.newStatus} />
              </p>
              <Timestamp
                value={item.observedAt}
                className="shrink-0 text-xs text-muted-foreground"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {patreonReasonLabel(item.reason)} ·{' '}
              {patreonStatusLabel(item.syncSource)}
            </p>
            {planChanged && (
              <p className="mt-1 font-mono text-xs text-foreground">
                {item.previousPlanCode} → {item.newPlanCode}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function PatreonEntitlementDetailDrawer({
  userHash,
  displayName,
  isOpen,
  onClose,
  onResync,
}: PatreonEntitlementDetailDrawerProps): React.JSX.Element {
  const activeHash = isOpen ? userHash : null;
  const { detail, isLoading, error, refetch } =
    usePatreonEntitlement(activeHash);
  const history = usePatreonEntitlementHistory(activeHash);
  const label = displayName || userHash || 'this user';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>{displayName || 'Patreon entitlement'}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2">
              {userHash ? (
                <CopyableId
                  id={userHash}
                  startChars={8}
                  endChars={6}
                  label="user hash"
                />
              ) : null}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {isLoading && !detail && (
            <div className="space-y-2" aria-busy="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-8 rounded" />
              ))}
            </div>
          )}
          {!isLoading && error && (
            <ErrorState
              variant="inline"
              size="sm"
              title="Couldn’t load this entitlement"
              message={error}
              onRetry={() => void refetch()}
            />
          )}
          {detail && <DetailBody detail={detail} />}

          {userHash && (
            <div className="flex flex-wrap gap-2">
              {onResync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResync(userHash, label)}
                >
                  <RefreshCw size={13} className="mr-1.5" aria-hidden="true" />
                  Resync from Patreon
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link to={`${ROUTES.USERS}/${encodeURIComponent(userHash)}`}>
                  <ExternalLink
                    size={13}
                    className="mr-1.5"
                    aria-hidden="true"
                  />
                  Open user
                </Link>
              </Button>
            </div>
          )}

          <section
            aria-labelledby="patreon-history-heading"
            className="space-y-3"
          >
            <h3
              id="patreon-history-heading"
              className="text-sm font-semibold text-foreground"
            >
              History
            </h3>
            {history.isLoading && history.items.length === 0 ? (
              <Skeleton className="h-16 rounded" />
            ) : history.error ? (
              <ErrorState
                variant="inline"
                size="sm"
                title="Couldn’t load history"
                message={history.error}
                onRetry={() => void history.refetch()}
              />
            ) : (
              <HistoryList items={history.items} />
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PatreonEntitlementDetailDrawer;
