/**
 * Session Expiry Warning Modal
 *
 * Modal shown when session auto-refresh fails multiple times.
 * Warns user that session is about to expire and offers re-login.
 */

import React from 'react';
import { AlertTriangle, LogIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SessionExpiryWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReLogin: () => void;
}

export function SessionExpiryWarningModal({
  isOpen,
  onClose,
  onReLogin,
}: SessionExpiryWarningModalProps): React.JSX.Element {
  const handleReLogin = (): void => {
    onClose();
    onReLogin();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            Your session is ending
          </DialogTitle>
          <DialogDescription>
            The console couldn&apos;t renew your sign-in after several tries.
          </DialogDescription>
        </DialogHeader>

        <p className="m-0 rounded-md bg-warning-subtle px-3 py-2.5 text-[13px] text-foreground">
          Finish or copy any unsaved changes, then sign in again to keep
          working.
        </p>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="secondary" onClick={onClose}>
            Not now
          </Button>
          <Button onClick={handleReLogin}>
            <LogIn aria-hidden="true" />
            Sign in again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionExpiryWarningModal;
