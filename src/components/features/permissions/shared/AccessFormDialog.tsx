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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks';

export interface AccessFormField {
  key: string;
  label: string;
  kind?: 'text' | 'textarea' | 'number';
  placeholder?: string;
  hint?: string;
  required?: boolean;
  /** Shown but not editable when editing (e.g. machine names). */
  immutableOnEdit?: boolean;
  min?: number;
  max?: number;
  /** Suggestions offered through a datalist (e.g. existing categories). */
  suggestions?: string[];
  monospace?: boolean;
}

export type AccessFormValues = Record<string, string>;

interface AccessFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  title: string;
  description: string;
  fields: AccessFormField[];
  initialValues: AccessFormValues;
  submitLabel: string;
  /** Receives trimmed values; only changed fields when editing. Throw to keep the dialog open. */
  onSubmit: (values: AccessFormValues) => Promise<void>;
  successMessage: string;
}

/** Create/edit form for roles, permission groups and permissions. */
export function AccessFormDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  fields,
  initialValues,
  submitLabel,
  onSubmit,
  successMessage,
}: AccessFormDialogProps): React.JSX.Element {
  const { showToast } = useToast();
  const [values, setValues] = useState<AccessFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(initialValues);
      setErrors({});
    }
  }

  const editable = fields.filter(
    (field) => !(mode === 'edit' && field.immutableOnEdit)
  );
  const changed = editable.filter(
    (field) =>
      (values[field.key] ?? '').trim() !==
      (initialValues[field.key] ?? '').trim()
  );

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    for (const field of editable) {
      const value = (values[field.key] ?? '').trim();
      if (field.required && !value)
        next[field.key] = `${field.label} is required.`;
      if (field.kind === 'number' && value) {
        const n = Number(value);
        if (
          !Number.isInteger(n) ||
          (field.min !== undefined && n < field.min) ||
          (field.max !== undefined && n > field.max)
        ) {
          next[field.key] =
            `Enter a whole number from ${field.min ?? 0} to ${field.max ?? 100}.`;
        }
      }
    }
    return next;
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payloadFields = mode === 'edit' ? changed : editable;
    const payload: AccessFormValues = {};
    for (const field of payloadFields)
      payload[field.key] = (values[field.key] ?? '').trim();

    setSaving(true);
    try {
      await onSubmit(payload);
      showToast(successMessage, 'success');
      onOpenChange(false);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The changes could not be saved.',
        'error'
      );
    } finally {
      setSaving(false);
    }
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
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {fields.map((field) => {
            const id = `access-form-${field.key}`;
            const readOnly = mode === 'edit' && field.immutableOnEdit;
            const error = errors[field.key];
            const noteId = error || field.hint ? `${id}-note` : undefined;
            const common = {
              id,
              value: values[field.key] ?? '',
              placeholder: field.placeholder,
              disabled: saving,
              readOnly,
              'aria-invalid': Boolean(error),
              'aria-describedby': noteId,
            };
            return (
              <div key={field.key} className="grid gap-1.5">
                <Label htmlFor={id}>
                  {field.label}
                  {!field.required && !readOnly && (
                    <span className="font-normal text-muted-foreground">
                      {' '}
                      (optional)
                    </span>
                  )}
                </Label>
                {field.kind === 'textarea' ? (
                  <Textarea
                    {...common}
                    rows={3}
                    onChange={(event) =>
                      setValues((prev) => ({
                        ...prev,
                        [field.key]: event.target.value,
                      }))
                    }
                  />
                ) : (
                  <>
                    <Input
                      {...common}
                      type={field.kind === 'number' ? 'number' : 'text'}
                      min={field.min}
                      max={field.max}
                      list={
                        field.suggestions?.length ? `${id}-list` : undefined
                      }
                      autoComplete="off"
                      className={
                        field.monospace || readOnly
                          ? 'font-mono text-[13px]'
                          : undefined
                      }
                      onChange={(event) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: event.target.value,
                        }))
                      }
                    />
                    {field.suggestions && field.suggestions.length > 0 && (
                      <datalist id={`${id}-list`}>
                        {field.suggestions.map((suggestion) => (
                          <option key={suggestion} value={suggestion} />
                        ))}
                      </datalist>
                    )}
                  </>
                )}
                {(error || field.hint) && (
                  <p
                    id={noteId}
                    className={
                      error
                        ? 'm-0 text-xs text-destructive'
                        : 'm-0 text-xs text-muted-foreground'
                    }
                  >
                    {error ??
                      (readOnly
                        ? 'Can’t be changed after creation.'
                        : field.hint)}
                  </p>
                )}
              </div>
            );
          })}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={mode === 'edit' && changed.length === 0}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AccessFormDialog;
