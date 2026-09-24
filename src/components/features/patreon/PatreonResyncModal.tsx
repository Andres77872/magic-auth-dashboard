/**
 * PatreonResyncModal
 *
 * ROOT-only modal to queue a manual Patreon resync. Scope 'user' re-reads one
 * user's linked membership (by user_hash); scope 'all' queues one full sweep of
 * every configured campaign.
 *
 * The form lives in an inner component rendered inside the dialog content, which
 * Radix unmounts on close — so the form resets to its defaults on every open
 * without a reset effect.
 */

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useResyncPatreon, useToast } from '@/hooks';
import {
  PATREON_RESYNC_REASON_MAX_LENGTH,
  type PatreonResyncResult,
  type PatreonResyncScope,
} from '@/types/patreon.types';
import { describeResyncError, describeResyncResult } from './resync-messages';

interface PatreonResyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the server answered (queued, merged, or declined). */
  onSubmitted?: (result: PatreonResyncResult) => void;
  defaultScope?: PatreonResyncScope;
  defaultUserHash?: string;
  /** Show the scope as fixed (per-user resync opened from a row or drawer). */
  lockScope?: boolean;
  /** Display name for a locked per-user resync. */
  userLabel?: string;
  /** False when the sync worker is not reporting; queued jobs will wait. */
  workerHealthy?: boolean;
}

interface ResyncFormProps extends Required<
  Pick<
    PatreonResyncModalProps,
    'defaultScope' | 'defaultUserHash' | 'lockScope' | 'workerHealthy'
  >
> {
  onClose: () => void;
  onSubmitted?: (result: PatreonResyncResult) => void;
  userLabel?: string;
}

function Callout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-foreground">
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <p>{children}</p>
    </div>
  );
}

function ResyncForm({
  onClose,
  onSubmitted,
  defaultScope,
  defaultUserHash,
  lockScope,
  userLabel,
  workerHealthy,
}: ResyncFormProps): React.JSX.Element {
  const { resync, isResyncing } = useResyncPatreon();
  const { showToast } = useToast();

  const [scope, setScope] = useState<PatreonResyncScope>(defaultScope);
  const [userHash, setUserHash] = useState(defaultUserHash);
  const [reason, setReason] = useState('');
  const [highPriority, setHighPriority] = useState(false);
  const [userHashError, setUserHashError] = useState<string | undefined>();

  const handleSubmit = async (): Promise<void> => {
    if (scope === 'user' && !userHash.trim()) {
      setUserHashError('Enter the user hash of the user to resync.');
      return;
    }
    setUserHashError(undefined);

    try {
      const result = await resync({
        scope,
        userHash: scope === 'user' ? userHash.trim() : undefined,
        reason: reason.trim() || undefined,
        force: highPriority,
      });
      const toast = describeResyncResult(result);
      showToast(toast.message, toast.variant);
      onSubmitted?.(result);
      onClose();
    } catch (err) {
      showToast(describeResyncError(err), 'error');
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit();
      }}
      className="space-y-4"
    >
      {lockScope ? (
        <p className="text-sm text-muted-foreground">
          Re-read{' '}
          <span className="font-medium text-foreground">
            {userLabel || 'this user'}
          </span>
          {"'s"} membership from Patreon and update their entitlement.
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="resync-scope">Scope</Label>
          <Select
            value={scope}
            onValueChange={(value) => setScope(value as PatreonResyncScope)}
            disabled={isResyncing}
          >
            <SelectTrigger id="resync-scope" aria-label="Resync scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">One user</SelectItem>
              <SelectItem value="all">
                Every configured campaign (full sweep)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'user' && !lockScope && (
        <div className="space-y-2">
          <Label htmlFor="resync-user-hash">User hash</Label>
          <Input
            id="resync-user-hash"
            value={userHash}
            onChange={(e) => setUserHash(e.target.value)}
            placeholder="usr-…"
            maxLength={255}
            autoComplete="off"
            disabled={isResyncing}
            error={userHashError}
          />
        </div>
      )}

      {scope === 'all' && (
        <Callout>
          A full sweep reads every member of every configured campaign from
          Patreon. Use it after changing the tier map or recovering from an
          outage; scheduled sweeps already run on their own.
        </Callout>
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="resync-reason">Note (optional)</Label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {reason.length}/{PATREON_RESYNC_REASON_MAX_LENGTH}
          </span>
        </div>
        <Textarea
          id="resync-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this resync? Stored with the job."
          rows={2}
          maxLength={PATREON_RESYNC_REASON_MAX_LENGTH}
          disabled={isResyncing}
        />
      </div>

      <Checkbox
        id="resync-high-priority"
        checked={highPriority}
        onCheckedChange={(checked) => setHighPriority(checked === true)}
        disabled={isResyncing}
        label="High priority (run before other queued jobs)"
      />

      {!workerHealthy && (
        <Callout>
          The sync worker is not reporting a heartbeat. The job will wait in the
          queue until the worker runs.
        </Callout>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isResyncing}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isResyncing}>
          {isResyncing ? 'Queuing…' : 'Queue resync'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function PatreonResyncModal({
  isOpen,
  onClose,
  onSubmitted,
  defaultScope = 'user',
  defaultUserHash = '',
  lockScope = false,
  userLabel,
  workerHealthy = true,
}: PatreonResyncModalProps): React.JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {lockScope ? 'Resync Patreon membership' : 'Queue a Patreon resync'}
          </DialogTitle>
          <DialogDescription>
            Resyncs read the source of truth from Patreon. They are queued and
            run by the sync worker.
          </DialogDescription>
        </DialogHeader>
        <ResyncForm
          onClose={onClose}
          onSubmitted={onSubmitted}
          defaultScope={defaultScope}
          defaultUserHash={defaultUserHash}
          lockScope={lockScope}
          userLabel={userLabel}
          workerHealthy={workerHealthy}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PatreonResyncModal;
