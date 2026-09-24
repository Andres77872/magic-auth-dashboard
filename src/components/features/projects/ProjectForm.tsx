import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ProjectFormData, ProjectFormErrors } from '@/types/project.types';
import {
  PROJECT_DESCRIPTION_MAX,
  PROJECT_NAME_MAX,
  hasErrors,
  validateProjectForm,
} from './project-form';

export interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<ProjectFormData>;
  /** Called with trimmed values. The caller reports API errors. */
  onSubmit: (values: ProjectFormData) => void;
  onCancel?: () => void;
  submitLabel: string;
  isSubmitting?: boolean;
  /** Prefix for field ids when more than one form can be on screen. */
  idPrefix?: string;
  footerClassName?: string;
}

/**
 * Name and description fields shared by the create/edit dialog and the
 * settings tab. In edit mode Save stays disabled until something changes.
 */
export function ProjectForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting = false,
  idPrefix = 'project',
  footerClassName,
}: ProjectFormProps): React.JSX.Element {
  const initialName = initialValues?.project_name ?? '';
  const initialDescription = initialValues?.project_description ?? '';
  const [values, setValues] = useState<ProjectFormData>({
    project_name: initialName,
    project_description: initialDescription,
  });
  const [errors, setErrors] = useState<ProjectFormErrors>({});

  const trimmedName = values.project_name.trim();
  const trimmedDescription = values.project_description.trim();
  // PUT /projects/{hash} treats an empty description as "keep the current one",
  // so clearing it alone is not a change.
  const clearsDescription =
    mode === 'edit' &&
    Boolean(initialDescription.trim()) &&
    !trimmedDescription;
  const effectiveDescription = clearsDescription
    ? initialDescription.trim()
    : trimmedDescription;
  const isDirty =
    trimmedName !== initialName.trim() ||
    effectiveDescription !== initialDescription.trim();

  const update =
    (field: keyof ProjectFormData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
      const { value } = event.target;
      setValues((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = validateProjectForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    onSubmit({
      project_name: trimmedName,
      project_description: trimmedDescription,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        id={`${idPrefix}-name`}
        label="Name"
        required
        value={values.project_name}
        onChange={update('project_name')}
        error={errors.project_name}
        maxLength={PROJECT_NAME_MAX}
        disabled={isSubmitting}
        autoComplete="off"
        fullWidth
      />
      <Textarea
        id={`${idPrefix}-description`}
        label="Description"
        value={values.project_description}
        onChange={update('project_description')}
        error={errors.project_description}
        helperText={
          clearsDescription
            ? 'An empty description keeps the current one; the API cannot clear descriptions.'
            : 'Optional. Shown in project lists and pickers.'
        }
        maxLength={PROJECT_DESCRIPTION_MAX}
        rows={3}
        disabled={isSubmitting}
      />
      <div
        className={cn(
          'flex flex-wrap items-center justify-end gap-2 pt-1',
          footerClassName
        )}
      >
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={mode === 'edit' && !isDirty}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default ProjectForm;
