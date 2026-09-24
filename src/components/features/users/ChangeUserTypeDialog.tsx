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
import { Button } from '@/components/ui/button';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { useToast, useUserActions } from '@/hooks';
import { cn } from '@/lib/utils';
import type { User, UserType } from '@/types/auth.types';

interface ChangeUserTypeDialogProps {
  user: Pick<User, 'user_hash' | 'username' | 'user_type'>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const OPTIONS: { value: UserType; description: string }[] = [
  {
    value: 'consumer',
    description: 'Signs in to projects. Cannot open this console.',
  },
  { value: 'admin', description: 'Manages the projects they are assigned to.' },
  {
    value: 'root',
    description: 'Unrestricted access to every project and system setting.',
  },
];

/** Root-only: promote or demote a user (`PATCH /users/{hash}/type`). */
export function ChangeUserTypeDialog({
  user,
  open,
  onOpenChange,
  onChanged,
}: ChangeUserTypeDialogProps): React.JSX.Element {
  const { showToast } = useToast();
  const { changeUserType, pending } = useUserActions();
  const [selected, setSelected] = useState<UserType>(user.user_type);
  const saving = pending === 'changeType';

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelected(user.user_type);
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      await changeUserType(user.user_hash, selected);
      showToast(
        `${user.username} is now ${selected === 'admin' ? 'an' : 'a'} ${selected} user.`,
        'success'
      );
      onChanged();
      onOpenChange(false);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The user type could not be changed.',
        'error'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Change user type</DialogTitle>
          <DialogDescription>
            {user.username} is currently{' '}
            <UserTypeBadge userType={user.user_type} className="align-middle" />
            .
          </DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label="User type" className="grid gap-2">
          {OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(option.value)}
                className={cn(
                  'flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border hover:bg-accent/50'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    isSelected ? 'border-primary' : 'border-input'
                  )}
                  aria-hidden="true"
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </span>
                <span>
                  <UserTypeBadge userType={option.value} />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {selected !== user.user_type && selected === 'admin' && (
          <p className="m-0 flex gap-2 rounded-md bg-warning-subtle px-3 py-2 text-xs text-warning-subtle-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Admins manage nothing until they are added to a project&apos;s
            administrators (Projects → project → Overview).
          </p>
        )}
        {selected !== user.user_type && selected === 'root' && (
          <p className="m-0 flex gap-2 rounded-md bg-destructive-subtle px-3 py-2 text-xs text-destructive-subtle-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Root users can change every setting, including other root accounts.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            loading={saving}
            disabled={selected === user.user_type}
          >
            Change type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ChangeUserTypeDialog;
