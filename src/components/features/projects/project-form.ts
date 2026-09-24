import type { ProjectFormData, ProjectFormErrors } from '@/types/project.types';

/** `projects.project_name` is VARCHAR(100). */
export const PROJECT_NAME_MAX = 100;
/** The column is TEXT; this is a usability limit only. */
export const PROJECT_DESCRIPTION_MAX = 2000;

/** Client-side checks for usability; api.auth remains the authority. Names need not be unique. */
export function validateProjectForm(
  values: ProjectFormData
): ProjectFormErrors {
  const errors: ProjectFormErrors = {};
  const name = values.project_name.trim();
  if (!name) errors.project_name = 'Enter a project name.';
  else if (name.length > PROJECT_NAME_MAX)
    errors.project_name = `Use ${PROJECT_NAME_MAX} characters or fewer.`;
  if (values.project_description.trim().length > PROJECT_DESCRIPTION_MAX) {
    errors.project_description = `Use ${PROJECT_DESCRIPTION_MAX} characters or fewer.`;
  }
  return errors;
}

export function hasErrors(errors: ProjectFormErrors): boolean {
  return Boolean(errors.project_name || errors.project_description);
}
