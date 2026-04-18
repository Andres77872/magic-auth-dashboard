import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle } from 'lucide-react';

interface RootConfirmationDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  userName: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  error?: string;
}

/**
 * Confirmation dialog for ROOT user creation.
 * Requires password verification before proceeding with the creation.
 */
export function RootConfirmationDialog({
  isOpen,
  isLoading,
  userName,
  onConfirm,
  onCancel,
  error: externalError,
}: RootConfirmationDialogProps): React.JSX.Element {
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Use external error if provided, otherwise use local error
  const displayError = externalError || localError;

  const handleConfirm = () => {
    if (!password.trim()) {
      setLocalError('Please enter your password to confirm');
      return;
    }
    onConfirm(password);
  };

  const handleCancel = () => {
    setPassword('');
    setLocalError('');
    onCancel();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (localError) setLocalError('');
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isLoading && !open) handleCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm ROOT User Creation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-md bg-warning-subtle p-3 border border-warning/20">
            <AlertTriangle
              size={32}
              className="text-warning-subtle-foreground shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-2">
              <p className="text-sm text-warning-subtle-foreground">
                You are about to create <strong>{userName}</strong> as a ROOT
                user with full administrative privileges. This is a
                security-sensitive operation.
              </p>
              <p className="text-sm font-medium text-warning-subtle-foreground">
                Please enter your password to confirm this action:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              autoFocus
            />
            {displayError && (
              <p className="text-xs text-destructive">{displayError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2" />}
            Create ROOT User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RootConfirmationDialog;
