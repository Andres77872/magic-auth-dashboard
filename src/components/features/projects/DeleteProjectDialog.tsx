import React from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { useProjectMutations } from '@/hooks/useProjects';

interface DeleteProjectDialogProps {
  project: { project_hash: string; project_name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the API confirms the deletion. */
  onDeleted: () => void;
}

/**
 * `DELETE /projects/{hash}` behind a typed confirmation. The API soft-deletes
 * the project and offers no restore, so the console treats it as irreversible.
 */
export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onDeleted,
}: DeleteProjectDialogProps): React.JSX.Element {
  const { showToast } = useToast();
  const { pending, deleteProject } = useProjectMutations();

  const confirm = async (): Promise<void> => {
    try {
      const result = await deleteProject(project.project_hash);
      showToast(
        result.warning
          ? `Project deleted. ${result.warning}.`
          : 'Project deleted.',
        'success'
      );
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The project could not be deleted.',
        'error'
      );
    }
  };

  return (
    <ConfirmDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onConfirm={() => void confirm()}
      title={`Delete ${project.project_name}?`}
      message={
        <>
          The project is removed from every project group, so no user group can
          reach it, and its sessions stop working. Its default user groups and
          project group are kept. The API has no way to restore a deleted
          project.
        </>
      }
      confirmText="Delete project"
      confirmationPhrase={project.project_name}
      isLoading={pending === 'delete'}
    />
  );
}

export default DeleteProjectDialog;
