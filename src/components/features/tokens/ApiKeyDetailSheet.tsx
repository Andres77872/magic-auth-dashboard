/**
 * API Key Detail Sheet
 *
 * Right-side drawer showing the full metadata for a single API token, with
 * copy actions for its identifiers and quick Edit / Revoke actions.
 */
import React from 'react';
import type { ReactNode } from 'react';
import { Key, Edit, Trash2, FolderKanban } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { CopyableId } from '@/components/common';
import { computeApiKeyStatus } from '@/types/api-key.types';
import type { ApiKey, ApiKeyStatus } from '@/types/api-key.types';
import { formatDateTime } from '@/utils/component-utils';

const statusBadgeConfig: Record<
  ApiKeyStatus,
  { variant: 'subtleSuccess' | 'subtle' | 'subtleDestructive' | 'subtleWarning'; label: string }
> = {
  active: { variant: 'subtleSuccess', label: 'Active' },
  expired: { variant: 'subtleWarning', label: 'Expired' },
  revoked: { variant: 'subtleDestructive', label: 'Revoked' },
  revoking: { variant: 'subtleWarning', label: 'Revoking…' },
};

interface ApiKeyDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  keyData: ApiKey | null;
  onEdit?: (key: ApiKey) => void;
  onRevoke?: (key: ApiKey) => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function ApiKeyDetailSheet({
  isOpen,
  onClose,
  keyData,
  onEdit,
  onRevoke,
}: ApiKeyDetailSheetProps): React.JSX.Element | null {
  if (!keyData) return null;

  const status = computeApiKeyStatus(keyData);
  const statusConfig = statusBadgeConfig[status];
  const canEdit = status === 'active' || status === 'expired';
  const canRevoke = canEdit;

  const formatTimestamp = (value?: string | null): string =>
    value ? formatDateTime(value) : '—';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Key size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <SheetTitle className="truncate">
                {keyData.name || 'Unnamed token'}
              </SheetTitle>
              <SheetDescription className="font-mono">
                {keyData.fingerprint}
              </SheetDescription>
            </div>
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </div>
        </SheetHeader>

        <dl className="mt-6 grid grid-cols-1 gap-5">
          {keyData.description && (
            <DetailRow label="Description">
              <p className="leading-relaxed text-muted-foreground">
                {keyData.description}
              </p>
            </DetailRow>
          )}

          <DetailRow label="Project">
            <span className="inline-flex items-center gap-1.5">
              <FolderKanban size={14} className="text-muted-foreground" aria-hidden="true" />
              {keyData.project_name || keyData.project_id}
            </span>
          </DetailRow>

          <DetailRow label="Owner">
            <span className="inline-flex items-center gap-2">
              <Avatar
                name={keyData.owner_username || keyData.owner_user_id}
                size="xs"
              />
              {keyData.owner_username || keyData.owner_user_id}
            </span>
          </DetailRow>

          <DetailRow label="Fingerprint">
            <CopyableId id={keyData.fingerprint} showFull />
          </DetailRow>

          <DetailRow label="Public ID">
            <CopyableId id={keyData.public_id} showFull />
          </DetailRow>

          <DetailRow label="Secret">
            <span className="font-mono text-muted-foreground">
              …{keyData.secret_last4}
            </span>
          </DetailRow>

          <div className="grid grid-cols-2 gap-5">
            <DetailRow label="Created">{formatTimestamp(keyData.created_at)}</DetailRow>
            <DetailRow label="Last used">
              {keyData.last_used_at ? formatTimestamp(keyData.last_used_at) : 'Never'}
            </DetailRow>
            <DetailRow label="Expires">
              {keyData.expires_at ? formatTimestamp(keyData.expires_at) : 'Never'}
            </DetailRow>
            <DetailRow label="Updated">{formatTimestamp(keyData.updated_at)}</DetailRow>
          </div>

          {status === 'revoked' && (
            <div className="grid grid-cols-2 gap-5">
              <DetailRow label="Revoked at">
                {formatTimestamp(keyData.revoked_at)}
              </DetailRow>
              <DetailRow label="Revoke reason">
                {keyData.revoke_reason || '—'}
              </DetailRow>
            </div>
          )}

          {keyData.hash_algorithm && (
            <DetailRow label="Hash algorithm">
              <span className="font-mono text-muted-foreground">
                {keyData.hash_algorithm}
              </span>
            </DetailRow>
          )}
        </dl>

        {(onEdit || onRevoke) && (
          <SheetFooter className="mt-8">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(keyData)}
                disabled={!canEdit}
                leftIcon={<Edit size={16} />}
              >
                Edit
              </Button>
            )}
            {onRevoke && (
              <Button
                variant="destructive"
                onClick={() => onRevoke(keyData)}
                disabled={!canRevoke}
                leftIcon={<Trash2 size={16} />}
              >
                Revoke
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default ApiKeyDetailSheet;
