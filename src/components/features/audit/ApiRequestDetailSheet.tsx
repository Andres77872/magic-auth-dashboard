/** Side sheet for one API request audit record. Bodies are never shown. */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CopyableId } from '@/components/common/CopyableId';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { formatDateTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { ApiAuditLog } from '@/types/audit.types';
import {
  formatDuration,
  humanizeCode,
  statusCodeVariant,
} from './audit-format';

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

const Muted = ({
  children = '—',
}: {
  children?: React.ReactNode;
}): React.JSX.Element => (
  <span className="text-muted-foreground">{children}</span>
);

export function ApiRequestDetailSheet({
  request,
  onClose,
}: {
  request: ApiAuditLog | null;
  onClose: () => void;
}): React.JSX.Element {
  return (
    <Sheet open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {request && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 pr-6 text-[15px]">
                <span className="font-mono text-xs text-muted-foreground">
                  {request.httpMethod}
                </span>
                <span className="min-w-0 truncate font-mono">
                  {request.endpointPath}
                </span>
              </SheetTitle>
              <SheetDescription className="text-xs">
                {request.requestTimestamp
                  ? formatDateTime(request.requestTimestamp)
                  : 'Time unknown'}
              </SheetDescription>
            </SheetHeader>

            <dl className="mt-5 divide-y divide-border border-y border-border">
              <Row label="Status">
                <span className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={statusCodeVariant(request.responseStatus)}
                    size="sm"
                  >
                    {request.responseStatus ?? 'No response'}
                  </Badge>
                  <span className="text-muted-foreground">
                    {request.isSuccess ? 'Succeeded' : 'Failed'}
                  </span>
                  {request.securityEvent && (
                    <Badge variant="warning" size="sm">
                      Security event
                    </Badge>
                  )}
                </span>
              </Row>
              {request.errorCode && (
                <Row label="Error">{humanizeCode(request.errorCode)}</Row>
              )}
              {request.errorMessage && (
                <Row label="Message">{request.errorMessage}</Row>
              )}
              {request.routePattern && (
                <Row label="Route">
                  <span className="font-mono text-xs">
                    {request.routePattern}
                  </span>
                </Row>
              )}
              <Row label="Duration">{formatDuration(request.durationMs)}</Row>
              <Row label="User">
                {request.userHash ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`${ROUTES.USERS}/${encodeURIComponent(request.userHash)}`}
                      className="text-foreground no-underline hover:underline"
                    >
                      {request.username || request.userHash}
                    </Link>
                    <UserTypeBadge userType={request.userType} />
                  </span>
                ) : (
                  <Muted>Anonymous</Muted>
                )}
              </Row>
              <Row label="Project">
                {request.projectHash ? (
                  <Link
                    to={`${ROUTES.PROJECTS}/${encodeURIComponent(request.projectHash)}`}
                    className="text-foreground no-underline hover:underline"
                  >
                    {request.projectName || request.projectHash}
                  </Link>
                ) : (
                  <Muted />
                )}
              </Row>
              <Row label="IP address">
                {request.clientIp ? (
                  <span className="font-mono text-xs">{request.clientIp}</span>
                ) : (
                  <Muted />
                )}
              </Row>
              {request.userAgent && (
                <Row label="User agent">
                  <span className="text-xs text-muted-foreground">
                    {request.userAgent}
                  </span>
                </Row>
              )}
              {request.requestId && (
                <Row label="Request ID">
                  <CopyableId id={request.requestId} label="Request ID" />
                </Row>
              )}
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ApiRequestDetailSheet;
