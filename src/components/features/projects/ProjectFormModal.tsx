import React from 'react';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { useProjectMutations } from '@/hooks/useProjects';
import type { ProjectFormData, ProjectInfo } from '@/types/project.types';
import { ProjectForm } from './ProjectForm';

/** The fields the edit dialog needs; list rows and detail records both fit. */
export interface EditableProject {
  project_hash: string;
  project_name: string;
  project_description: string | null;
}

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  /** Required in edit mode. */
  project?: EditableProject | null;
  /** Called with the API's copy of the project after it confirms the write. */
  onSaved: (project: ProjectInfo) => void;
}

/** Create (root only) or edit a project's name and description. */
export function ProjectFormModal({
  open,
  onOpenChange,
  mode,
  project,
  onSaved,
}: ProjectFormModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const { pending, createProject, updateProject } = useProjectMutations();
  const isSubmitting = pending !== null;

  const handleSubmit = async (values: ProjectFormData): Promise<void> => {
    try {
      if (mode === 'create') {
        const created = await createProject(values);
        showToast(
          `Project "${created.project_name}" created with its default groups.`,
          'success'
        );
        onSaved(created);
      } else {
        if (!project) return;
        const updated = await updateProject(project.project_hash, values);
        showToast('Project updated.', 'success');
        onSaved(updated);
      }
      onOpenChange(false);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : `The project could not be ${mode === 'create' ? 'created' : 'updated'}.`,
        'error'
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isSubmitting && onOpenChange(next)}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create project' : 'Edit project'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Projects are the applications your users sign in to.'
              : 'Change the name or description shown across the console.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'create' && (
          <div className="flex gap-2.5 rounded-md border border-border bg-secondary/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-info"
              aria-hidden="true"
            />
            <p className="m-0">
              The API also creates a project group for this project and three
              user groups granted it:{' '}
              <span className="font-mono text-foreground">admin_…</span>,{' '}
              <span className="font-mono text-foreground">user_…</span> and{' '}
              <span className="font-mono text-foreground">readonly_…</span>.
              They start empty; add admin users to the{' '}
              <span className="font-mono text-foreground">admin_…</span> group
              to make them project administrators.
            </p>
          </div>
        )}

        {/* Remount per open/project so the fields start from the current values. */}
        {open && (
          <ProjectForm
            key={`${mode}:${project?.project_hash ?? 'new'}`}
            mode={mode}
            idPrefix={`project-${mode}`}
            initialValues={
              mode === 'edit' && project
                ? {
                    project_name: project.project_name,
                    project_description: project.project_description ?? '',
                  }
                : undefined
            }
            onSubmit={(values) => void handleSubmit(values)}
            onCancel={() => onOpenChange(false)}
            submitLabel={mode === 'create' ? 'Create project' : 'Save changes'}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ProjectFormModal;
