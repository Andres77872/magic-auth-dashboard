import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import type { GroupFormData } from '@/types/group.types';
import type { GroupKind } from './GroupBadges';

/** Column limit of `group_name` in api.auth. */
const GROUP_NAME_MAX = 100;
const GROUP_DESCRIPTION_MAX = 1000;

export interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Resolve once the API has saved; reject to show the error in the dialog. */
  onSubmit: (data: GroupFormData) => Promise<void>;
  mode: 'create' | 'edit';
  /** The group being edited. */
  group?: { group_name: string; description: string | null } | null;
  /** Defaults to a user group. */
  kind?: GroupKind;
  /**
   * Whether the operator may use `admin_…` user-group names (root only; the
   * backend answers 403 otherwise). Leave undefined to skip the client check.
   */
  canUseAdminPrefix?: boolean;
}

const COPY = {
  user: {
    createTitle: 'Create user group',
    editTitle: 'Edit user group',
    createDescription:
      'A set of users. Grant it project groups to let its members sign in to those projects.',
    editDescription: 'Rename the group or change its description.',
    placeholder: 'e.g. support-team',
    createLabel: 'Create user group',
  },
  project: {
    createTitle: 'Create project group',
    editTitle: 'Edit project group',
    createDescription:
      'A set of projects. User groups granted it can sign in to every project inside.',
    editDescription: 'Rename the group or change its description.',
    placeholder: 'e.g. mobile-apps',
    createLabel: 'Create project group',
  },
} as const;

interface FormErrors {
  group_name?: string;
  description?: string;
  general?: string;
}

/**
 * Create/edit dialog for user groups and project groups. State is created
 * when the dialog opens, so every opening starts from the current values.
 */
export function GroupFormModal(
  props: GroupFormModalProps
): React.JSX.Element | null {
  if (!props.isOpen) return null;
  return <GroupFormDialog {...props} />;
}

function GroupFormDialog({
  onClose,
  onSubmit,
  mode,
  group,
  kind = 'user',
  canUseAdminPrefix,
}: GroupFormModalProps): React.JSX.Element {
  const copy = COPY[kind];
  const originalDescription = group?.description ?? '';
  const [formData, setFormData] = useState<GroupFormData>({
    group_name: mode === 'edit' ? (group?.group_name ?? '') : '',
    description: mode === 'edit' ? originalDescription : '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const name = formData.group_name.trim();
    if (!name) {
      next.group_name = 'Enter a name.';
    } else if (name.length > GROUP_NAME_MAX) {
      next.group_name = `Use at most ${GROUP_NAME_MAX} characters.`;
    } else if (
      kind === 'user' &&
      canUseAdminPrefix === false &&
      isProjectAdminGroupName(name) &&
      !(mode === 'edit' && isProjectAdminGroupName(group?.group_name))
    ) {
      next.group_name =
        'Only root users can use names that start with admin_ (they grant project admin rights).';
    }
    if (formData.description.trim().length > GROUP_DESCRIPTION_MAX) {
      next.description = `Use at most ${GROUP_DESCRIPTION_MAX} characters.`;
    }
    return next;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        group_name: formData.group_name.trim(),
        description: formData.description.trim(),
      });
      onClose();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'The group could not be saved.',
      });
      setIsSubmitting(false);
    }
  };

  const update = (field: keyof GroupFormData, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field] || errors.general)
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
        general: undefined,
      }));
  };

  const clearingDescription =
    mode === 'edit' &&
    originalDescription.trim() !== '' &&
    formData.description.trim() === '';

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? copy.createTitle : copy.editTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? copy.createDescription : copy.editDescription}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
          noValidate
        >
          {errors.general && (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="group-form-name">Name</Label>
            <Input
              id="group-form-name"
              value={formData.group_name}
              onChange={(event) => update('group_name', event.target.value)}
              placeholder={copy.placeholder}
              disabled={isSubmitting}
              error={errors.group_name}
              maxLength={GROUP_NAME_MAX}
              autoComplete="off"
              autoFocus
              fullWidth
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="group-form-description">
              Description{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="group-form-description"
              value={formData.description}
              onChange={(event) => update('description', event.target.value)}
              rows={3}
              disabled={isSubmitting}
              error={errors.description}
              helperText={
                clearingDescription
                  ? 'The API keeps the current description when this is empty; descriptions can’t be cleared.'
                  : undefined
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {mode === 'create' ? copy.createLabel : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default GroupFormModal;
