import React, { useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/useToast';
import { formatCount } from '@/utils/formatters';
import type { GroupKind } from './GroupBadges';

export interface DeleteGroupDialogProps {
  kind: GroupKind;
  groupName: string;
  /** Members (user group) or projects (project group); null when unknown. */
  count: number | null;
  onClose: () => void;
  /** Delete the group; reject to keep the dialog open (the error is shown as a toast). */
  onDelete: () => Promise<void>;
}

/**
 * Confirmation for deleting a user group or project group. Groups that still
 * have members/projects (or whose count is unknown) require typing the name.
 * Mount while open.
 */
export function DeleteGroupDialog({
  kind,
  groupName,
  count,
  onClose,
  onDelete,
}: DeleteGroupDialogProps): React.JSX.Element {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const hasContents = count === null || count > 0;

  const handleConfirm = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'The group could not be deleted.',
        'error'
      );
      setIsDeleting(false);
    }
  };

  const message =
    kind === 'user' ? (
      <>
        {count !== null && count > 0 && (
          <>
            <strong className="text-foreground">{groupName}</strong> has{' '}
            {formatCount(count, 'member')}. They lose access to the projects
            this group reaches (unless another group grants them) and are signed
            out of those projects.{' '}
          </>
        )}
        Its memberships and project group grants are removed. The name can’t be
        reused.
      </>
    ) : (
      <>
        {count !== null && count > 0 && (
          <>
            <strong className="text-foreground">{groupName}</strong> contains{' '}
            {formatCount(count, 'project')}. User groups granted it lose access
            to them (unless another project group covers them) and affected
            sessions are signed out. The projects themselves are not
            deleted.{' '}
          </>
        )}
        Its project assignments and user group grants are removed. The name
        can’t be reused.
      </>
    );

  return (
    <ConfirmDialog
      isOpen
      onClose={onClose}
      onConfirm={() => void handleConfirm()}
      title={kind === 'user' ? 'Delete user group' : 'Delete project group'}
      message={message}
      confirmText={
        kind === 'user' ? 'Delete user group' : 'Delete project group'
      }
      variant="danger"
      isLoading={isDeleting}
      confirmationPhrase={hasContents ? groupName : undefined}
    />
  );
}

export default DeleteGroupDialog;
