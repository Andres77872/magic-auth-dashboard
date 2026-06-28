/**
 * PatreonResyncModal
 *
 * ROOT-only modal to enqueue a manual Patreon resync. Scope 'user' resyncs a
 * single user (by user_hash); scope 'all' enqueues a full sweep over every
 * configured campaign.
 *
 * The form lives in an inner component rendered inside the dialog content, which
 * Radix unmounts on close — so the form resets to its defaults on every open
 * without a reset effect.
 */

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useResyncPatreon, useToast } from '@/hooks';
import type { PatreonResyncScope } from '@/types/patreon.types';

interface PatreonResyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  defaultScope?: PatreonResyncScope;
  defaultUserHash?: string;
  lockScope?: boolean;
}

interface ResyncFormProps {
  onClose: () => void;
  onSubmitted?: () => void;
  defaultScope: PatreonResyncScope;
  defaultUserHash: string;
  lockScope: boolean;
}

function ResyncForm({
  onClose,
  onSubmitted,
  defaultScope,
  defaultUserHash,
  lockScope,
}: ResyncFormProps): React.JSX.Element {
  const { resync, isResyncing } = useResyncPatreon();
  const { showToast } = useToast();

  const [scope, setScope] = useState<PatreonResyncScope>(defaultScope);
  const [userHash, setUserHash] = useState(defaultUserHash);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (): Promise<void> => {
    const nextErrors: Record<string, string> = {};
    if (scope === 'user' && !userHash.trim()) {
      nextErrors.userHash = 'User hash is required for a per-user resync.';
    }
    if (!reason.trim()) {
      nextErrors.reason = 'A reason is required.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const result = await resync({
        scope,
        userHash: scope === 'user' ? userHash.trim() : undefined,
        reason: reason.trim(),
      });
      showToast(
        result.correlationId ? `Resync queued (job ${result.correlationId}).` : 'Resync queued.',
        'success'
      );
      onSubmitted?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to enqueue resync', 'error');
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
      <div className="space-y-2">
        <Label htmlFor="resync-scope">Scope</Label>
        <Select
          value={scope}
          onValueChange={(value) => setScope(value as PatreonResyncScope)}
          disabled={lockScope || isResyncing}
        >
          <SelectTrigger id="resync-scope" aria-label="Resync scope">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Single user</SelectItem>
            <SelectItem value="all">All campaigns (full sweep)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scope === 'user' && (
        <div className="space-y-2">
          <Label htmlFor="resync-user-hash">User hash</Label>
          <Input
            id="resync-user-hash"
            value={userHash}
            onChange={(e) => setUserHash(e.target.value)}
            placeholder="usr-..."
            disabled={isResyncing}
            error={errors.userHash}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="resync-reason">Reason</Label>
        <Textarea
          id="resync-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you triggering this resync?"
          rows={3}
          disabled={isResyncing}
          error={errors.reason}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isResyncing}>
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
}: PatreonResyncModalProps): React.JSX.Element {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Trigger Patreon resync</DialogTitle>
          <DialogDescription>
            Enqueue a manual resync. Jobs are processed only while the Patreon sync
            worker is running.
          </DialogDescription>
        </DialogHeader>
        <ResyncForm
          onClose={onClose}
          onSubmitted={onSubmitted}
          defaultScope={defaultScope}
          defaultUserHash={defaultUserHash}
          lockScope={lockScope}
        />
      </DialogContent>
    </Dialog>
  );
}

export default PatreonResyncModal;
