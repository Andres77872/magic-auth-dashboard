import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks';
import { authService } from '@/services/auth.service';
import { userService } from '@/services/user.service';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (userHash: string | undefined) => void;
}

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acknowledged: boolean;
}

const EMPTY: FormState = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acknowledged: false,
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (form.username.trim().length < 3)
    errors.username = 'Use at least 3 characters.';
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim()))
    errors.email = 'Enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Use at least 8 characters.';
  if (form.confirmPassword !== form.password)
    errors.confirmPassword = 'Passwords don’t match.';
  if (!form.acknowledged)
    errors.acknowledged = 'Confirm that this person should have root access.';
  return errors;
}

/**
 * Root-only: create another root account (`POST /user-types/root`).
 *
 * Admin and consumer accounts can't be created from the console: the admin
 * endpoint requires internal project ids the API doesn't expose, and the only
 * consumer sign-up route is the public registration flow.
 */
export function CreateUserModal({
  open,
  onOpenChange,
  onCreated,
}: CreateUserModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [taken, setTaken] = useState<{ username?: boolean; email?: boolean }>(
    {}
  );
  const [saving, setSaving] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(EMPTY);
      setErrors({});
      setTaken({});
    }
  }

  const update = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === 'username' || key === 'email')
      setTaken((prev) => ({ ...prev, [key]: undefined }));
  };

  const checkAvailability = async (
    field: 'username' | 'email'
  ): Promise<void> => {
    const value = form[field].trim();
    if (!value || (field === 'email' && !EMAIL_PATTERN.test(value))) return;
    try {
      const res = await authService.checkAvailability({ [field]: value });
      const available =
        field === 'username' ? res.username_available : res.email_available;
      if (available === false) setTaken((prev) => ({ ...prev, [field]: true }));
    } catch {
      // Availability is a convenience; the create call still validates uniqueness.
    }
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (taken.username) nextErrors.username = 'That username is already taken.';
    if (taken.email) nextErrors.email = 'That email is already in use.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const res = await userService.createRootUser({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim() || undefined,
      });
      showToast(`Root user ${form.username.trim()} created.`, 'success');
      onCreated(res.user?.user_hash);
      onOpenChange(false);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The user could not be created.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: 'username' | 'email' | 'password' | 'confirmPassword',
    label: string,
    props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    hint?: string
  ): React.JSX.Element => {
    const id = `create-user-${key}`;
    const error = errors[key];
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          id={id}
          value={form[key]}
          onChange={(event) => update(key, event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${id}-note` : undefined}
          {...props}
        />
        {(error || hint) && (
          <p
            id={`${id}-note`}
            className={
              error
                ? 'm-0 text-xs text-destructive'
                : 'm-0 text-xs text-muted-foreground'
            }
          >
            {error ?? hint}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent size="md">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="grid gap-4"
          noValidate
        >
          <DialogHeader>
            <DialogTitle>Create root user</DialogTitle>
            <DialogDescription>
              Root users can manage every project, user and system setting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            {field('username', 'Username', {
              autoComplete: 'off',
              onBlur: () => void checkAvailability('username'),
            })}
            {field(
              'email',
              'Email (optional)',
              {
                type: 'email',
                autoComplete: 'off',
                onBlur: () => void checkAvailability('email'),
              },
              'Used for password resets.'
            )}
            {field(
              'password',
              'Password',
              { type: 'password', autoComplete: 'new-password' },
              'At least 8 characters.'
            )}
            {field('confirmPassword', 'Confirm password', {
              type: 'password',
              autoComplete: 'new-password',
            })}
          </div>

          <div className="grid gap-1.5">
            <label className="flex items-start gap-2.5 text-[13px] text-foreground">
              <Checkbox
                checked={form.acknowledged}
                onCheckedChange={(checked) =>
                  update('acknowledged', checked === true)
                }
                aria-invalid={Boolean(errors.acknowledged)}
                className="mt-0.5"
              />
              <span>This person should have unrestricted root access.</span>
            </label>
            {errors.acknowledged && (
              <p className="m-0 text-xs text-destructive">
                {errors.acknowledged}
              </p>
            )}
          </div>

          <div className="flex gap-2.5 rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="m-0">
                <span className="font-medium text-foreground">Admins:</span>{' '}
                promote an existing user with “Change user type”, then add them
                to a project&apos;s administrators.
              </p>
              <p className="m-0">
                <span className="font-medium text-foreground">Consumers:</span>{' '}
                sign up through a project&apos;s sign-in flow; the API has no
                admin endpoint to create them.
              </p>
            </div>
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
            <Button type="submit" loading={saving}>
              Create root user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateUserModal;
