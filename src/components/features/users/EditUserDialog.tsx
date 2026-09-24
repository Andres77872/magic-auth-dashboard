import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks';
import { userService } from '@/services/user.service';
import type { User } from '@/types/auth.types';

interface EditUserDialogProps {
  user: Pick<User, 'user_hash' | 'username' | 'email'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Rename a user or change their contact email (`PUT /users/{hash}`). */
export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: EditUserDialogProps): React.JSX.Element {
  const { showToast } = useToast();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email ?? '');
  const [errors, setErrors] = useState<{ username?: string; email?: string }>(
    {}
  );
  const [saving, setSaving] = useState(false);

  // Re-seed the form each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUsername(user.username);
      setEmail(user.email ?? '');
      setErrors({});
    }
  }

  const changes: { username?: string; email?: string } = {};
  if (username.trim() !== user.username) changes.username = username.trim();
  if (email.trim() !== (user.email ?? '')) changes.email = email.trim();
  const hasChanges = Object.keys(changes).length > 0;

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (username.trim().length < 3)
      nextErrors.username = 'Use at least 3 characters.';
    if (email.trim() && !EMAIL_PATTERN.test(email.trim()))
      nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !hasChanges) return;

    setSaving(true);
    try {
      await userService.updateUser(user.user_hash, changes);
      showToast(
        `Saved changes to ${changes.username ?? user.username}.`,
        'success'
      );
      onSaved();
      onOpenChange(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Changes could not be saved.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent size="sm">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="grid gap-4"
          noValidate
        >
          <DialogHeader>
            <DialogTitle>Edit details</DialogTitle>
            <DialogDescription>
              Update the username or contact email for this account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-user-username">Username</Label>
            <Input
              id="edit-user-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={
                errors.username ? 'edit-user-username-error' : undefined
              }
            />
            {errors.username && (
              <p
                id="edit-user-username-error"
                className="m-0 text-xs text-destructive"
              >
                {errors.username}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="edit-user-email">Email</Label>
            <Input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby="edit-user-email-hint"
            />
            <p
              id="edit-user-email-hint"
              className={
                errors.email
                  ? 'm-0 text-xs text-destructive'
                  : 'm-0 text-xs text-muted-foreground'
              }
            >
              {errors.email ??
                'Verified sign-in emails are managed by the user.'}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={!hasChanges}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserDialog;
