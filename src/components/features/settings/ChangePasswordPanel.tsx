import React, { useState } from 'react';
import { Panel } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/auth.service';
import { ApiError, handleApiError } from '@/utils/error-handler';

/** api.auth's default policy (`PASSWORD_POLICY_MIN_LENGTH`); the server has the final say. */
const MIN_LENGTH = 8;

const POLICY_HINT = `At least ${MIN_LENGTH} characters. Avoid common passwords, your username and repeated or sequential patterns.`;

interface FieldErrors {
  current?: string;
  next?: string;
  confirm?: string;
}

const EMPTY = { current: '', next: '', confirm: '' };

/**
 * Self-service password change for the signed-in root/admin. Other sessions
 * are signed out by the API; this one stays active.
 */
export function ChangePasswordPanel(): React.JSX.Element {
  const { showToast } = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update =
    (field: keyof typeof EMPTY) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setFormError(null);
    };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!values.current) next.current = 'Enter your current password.';
    if (values.next.length < MIN_LENGTH)
      next.next = `Use at least ${MIN_LENGTH} characters.`;
    else if (values.next === values.current)
      next.next = 'Choose a password you are not using now.';
    if (values.confirm !== values.next)
      next.confirm = 'The passwords do not match.';
    return next;
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await authService.changePassword(values.current, values.next);
      setValues(EMPTY);
      showToast(
        'Password changed. Your other sessions were signed out.',
        'success'
      );
    } catch (error) {
      if (error instanceof ApiError && error.code === 'AUTH_1001') {
        setErrors({ current: 'The current password is incorrect.' });
      } else if (error instanceof ApiError && error.code === 'VAL_3007') {
        setErrors({ next: `This password is too weak. ${POLICY_HINT}` });
      } else if (error instanceof ApiError && error.status === 429) {
        setFormError(
          `Too many attempts. Try again in ${error.retryAfterSeconds ?? 60} seconds.`
        );
      } else {
        setFormError(handleApiError(error));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Password"
      description="Changing it signs out your other sessions"
    >
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className="space-y-4"
      >
        <Input
          type="password"
          label="Current password"
          autoComplete="current-password"
          value={values.current}
          onChange={update('current')}
          error={errors.current}
          disabled={saving}
          fullWidth
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="password"
            label="New password"
            autoComplete="new-password"
            value={values.next}
            onChange={update('next')}
            error={errors.next}
            helperText={errors.next ? undefined : POLICY_HINT}
            disabled={saving}
            fullWidth
          />
          <Input
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={update('confirm')}
            error={errors.confirm}
            disabled={saving}
            fullWidth
          />
        </div>
        {formError && (
          <p role="alert" className="m-0 text-sm text-destructive">
            {formError}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" loading={saving}>
            Change password
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default ChangePasswordPanel;
