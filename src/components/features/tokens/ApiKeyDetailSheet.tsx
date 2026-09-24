/**
 * Side sheet with one API key's metadata. Loads `GET /api-keys/{key_id}` for
 * owner and project details, showing the listing row until it arrives.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CopyableId } from '@/components/common/CopyableId';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { useApiKeyDetails } from '@/hooks/useApiKeys';
import { computeApiKeyStatus, type ApiKey } from '@/types/api-key.types';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { ApiKeyStatusBadge } from './ApiKeyStatusBadge';
import { apiKeyHint, canRevoke } from './api-key-format';

export interface ApiKeyDetailSheetProps {
  apiKey: ApiKey | null;
  onClose: () => void;
  onEdit: (key: ApiKey) => void;
  onRevoke: (key: ApiKey) => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

function When({
  value,
  empty,
}: {
  value: string | null | undefined;
  empty: string;
}): React.JSX.Element {
  if (!value) return <span className="text-muted-foreground">{empty}</span>;
  return (
    <time dateTime={value} title={formatDateTime(value)}>
      {formatDateTime(value)}
    </time>
  );
}

export function ApiKeyDetailSheet({
  apiKey,
  onClose,
  onEdit,
  onRevoke,
}: ApiKeyDetailSheetProps): React.JSX.Element {
  const details = useApiKeyDetails(apiKey?.public_id ?? null);
  const key = details.apiKey ?? apiKey;
  const status = key ? computeApiKeyStatus(key) : null;

  return (
    <Sheet open={apiKey !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {key && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2 pr-6">
                <SheetTitle className="truncate text-[17px]">
                  {key.name}
                </SheetTitle>
                <ApiKeyStatusBadge apiKey={key} />
              </div>
              <SheetDescription className="font-mono text-xs">
                {apiKeyHint(key)}
              </SheetDescription>
            </SheetHeader>

            {details.error && (
              <p className="mt-4 text-xs text-muted-foreground">
                Some details couldn&apos;t be loaded. {details.error}
              </p>
            )}

            <dl className="mt-5 divide-y divide-border border-y border-border">
              {key.description && (
                <Row label="Description">{key.description}</Row>
              )}
              <Row label="Project">
                {key.project_hash ? (
                  <Link
                    to={`${ROUTES.PROJECTS}/${encodeURIComponent(key.project_hash)}`}
                    className="text-foreground no-underline hover:underline"
                  >
                    {key.project_name || key.project_hash}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">
                    {details.isLoading ? 'Loading…' : 'Unknown'}
                  </span>
                )}
              </Row>
              <Row label="Owner">
                {key.owner_user_hash ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`${ROUTES.USERS}/${encodeURIComponent(key.owner_user_hash)}`}
                      className="text-foreground no-underline hover:underline"
                    >
                      {key.owner_username || key.owner_user_hash}
                    </Link>
                    <UserTypeBadge userType={key.owner_user_type} />
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {details.isLoading ? 'Loading…' : 'Unknown'}
                  </span>
                )}
              </Row>
              <Row label="Fingerprint">
                <CopyableId id={key.fingerprint} showFull label="Fingerprint" />
              </Row>
              <Row label="Key ID">
                <CopyableId id={key.public_id} showFull label="Key ID" />
              </Row>
              <Row label="Created">
                <When value={key.created_at} empty="—" />
              </Row>
              <Row label="Last used">
                {key.last_used_at ? (
                  <time
                    dateTime={key.last_used_at}
                    title={formatDateTime(key.last_used_at)}
                  >
                    {formatRelativeTime(key.last_used_at)}
                  </time>
                ) : (
                  <span className="text-muted-foreground">Never</span>
                )}
              </Row>
              <Row label="Expires">
                <When value={key.expires_at} empty="Never" />
              </Row>
              {status === 'revoked' && (
                <>
                  <Row label="Revoked">
                    <When value={key.revoked_at} empty="—" />
                  </Row>
                  {key.revoke_reason && (
                    <Row label="Reason">{key.revoke_reason}</Row>
                  )}
                </>
              )}
            </dl>

            {status !== 'revoked' && (
              <SheetFooter className="mt-6 gap-2 sm:justify-start">
                <Button variant="secondary" onClick={() => onEdit(key)}>
                  <Pencil aria-hidden="true" />
                  Edit
                </Button>
                {canRevoke(key) && (
                  <Button variant="destructive" onClick={() => onRevoke(key)}>
                    <Trash2 aria-hidden="true" />
                    Revoke key
                  </Button>
                )}
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ApiKeyDetailSheet;
