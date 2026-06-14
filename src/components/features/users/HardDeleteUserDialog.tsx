import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle } from 'lucide-react';

interface HardDeleteUserDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  error?: string;
}

/**
 * ROOT-only HARD delete confirmation.
 *
 * This is a permanent, irreversible "root debug hard clean user" operation —
 * distinct from the standard, reversible soft "Delete User". To guard against
 * mistakes, the operator must type the exact target username to enable the
 * confirm button.
 */
export function HardDeleteUserDialog({
  isOpen,
  isLoading,
  userName,
  onConfirm,
  onCancel,
  error,
}: HardDeleteUserDialogProps): React.JSX.Element {
  const [confirmText, setConfirmText] = useState('');

  // Reset the typed value whenever the dialog re-opens for a (possibly different) user.
  useEffect(() => {
    if (isOpen) setConfirmText('');
  }, [isOpen, userName]);

  const isMatch = confirmText === userName;

  const handleConfirm = () => {
    if (!isMatch || isLoading) return;
    onConfirm();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isLoading && !open) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              aria-hidden="true"
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Permanently delete user</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-2 text-sm text-destructive">
              <p className="font-medium">This is a HARD delete and cannot be undone.</p>
              <p>
                You are about to permanently destroy <strong>{userName}</strong> and
                everything owned by this account. This is a ROOT debug operation,
                separate from the standard (reversible) “Delete User”.
              </p>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Permanently destroyed:</p>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
              <li>The user account and login</li>
              <li>All active sessions</li>
              <li>All API keys</li>
              <li>All linked emails / identities (unlinked and removed)</li>
              <li>All group memberships</li>
              <li>All permission grants</li>
            </ul>
            <p className="pt-2 font-medium text-foreground">Preserved:</p>
            <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">
              <li>Shared projects and groups (only this user’s membership is removed)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hard-delete-confirm">
              Type <span className="font-mono font-semibold">{userName}</span> to confirm
            </Label>
            <Input
              id="hard-delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={userName}
              autoComplete="off"
              autoFocus
              disabled={isLoading}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isMatch || isLoading}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            Permanently delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default HardDeleteUserDialog;
