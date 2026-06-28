/**
 * PatreonEntitlementDetailDrawer
 *
 * Read-only right-side drawer showing a single user's normalized Patreon
 * entitlement detail. Only fetches while open with a non-null userHash.
 */

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/common';
import { CopyButton } from '@/components/common';
import { usePatreonEntitlement } from '@/hooks';
import { truncateHash } from '@/utils/component-utils';
import { StatusBadge } from './StatusBadge';
import type { PatreonEntitlementDetail } from '@/types/patreon.types';

interface PatreonEntitlementDetailDrawerProps {
  userHash: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Row({ label, value }: { label: string; value: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function DetailBody({ detail }: { detail: PatreonEntitlementDetail }): React.JSX.Element {
  return (
    <div className="mt-4">
      <Row
        label="User"
        value={
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-xs">{truncateHash(detail.userHash)}</span>
            <CopyButton value={detail.userHash} />
          </span>
        }
      />
      <Row label="Entitlement status" value={<StatusBadge status={detail.status} />} />
      <Row label="Link status" value={<StatusBadge status={detail.linkStatus} />} />
      <Row label="Plan code" value={detail.planCode} />
      <Row label="Tier code" value={detail.tierCode ?? '—'} />
      <Row label="Tier name" value={detail.tierName ?? '—'} />
      <Row label="Source" value={detail.externalSource ?? '—'} />
      <Row label="Last synced" value={formatTimestamp(detail.lastSyncedAt)} />
      <Row label="Next renewal" value={formatTimestamp(detail.nextRenewalAt)} />
      <Row label="Grace period until" value={formatTimestamp(detail.gracePeriodUntil)} />
      <Row label="Stale after" value={formatTimestamp(detail.staleAfter)} />
    </div>
  );
}

export function PatreonEntitlementDetailDrawer({
  userHash,
  isOpen,
  onClose,
}: PatreonEntitlementDetailDrawerProps): React.JSX.Element {
  const { detail, isLoading, error } = usePatreonEntitlement(isOpen ? userHash : null);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Patreon entitlement</SheetTitle>
          <SheetDescription>
            Normalized, read-only entitlement detail for this user.
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-8 rounded" />
            ))}
          </div>
        )}
        {!isLoading && error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
        {!isLoading && !error && detail && <DetailBody detail={detail} />}
      </SheetContent>
    </Sheet>
  );
}

export default PatreonEntitlementDetailDrawer;
