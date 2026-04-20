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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription>
            Your session auto-refresh has failed multiple times.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm text-foreground mb-3">
            Your dashboard session is about to expire. Please save any work in progress.
          </p>
          <p className="text-sm text-muted-foreground">
            After expiry, you will need to log in again to continue using the dashboard.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Dismiss
          </Button>
          <Button
            onClick={handleReLogin}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Re-login Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SessionExpiryWarningModal;