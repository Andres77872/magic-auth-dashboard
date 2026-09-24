/**
 * Attach projects to a billing group. A project belongs to at most one group,
 * so projects already attached elsewhere are flagged per row (409).
 */

import React from 'react';
import {
  ProjectBatchPickerDialog,
  type ProjectBatchSummary,
} from '@/components/features/shared-pickers';
import { billingService } from '@/services/billing.service';
import { useToast } from '@/hooks/useToast';
import { isAttachConflict } from './billing-status';

export interface BillingAttachProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after at least one project is attached so the parent can refetch. */
  onSuccess: () => void;
  groupHash: string;
  groupName: string;
  /** Projects already attached to this group; hidden from the picker. */
  attachedProjectHashes: string[];
}

function plural(count: number): string {
  return `${count} project${count === 1 ? '' : 's'}`;
}

export function BillingAttachProjectsModal({
  isOpen,
  onClose,
  onSuccess,
  groupHash,
  groupName,
  attachedProjectHashes,
}: BillingAttachProjectsModalProps): React.JSX.Element {
  const { showToast } = useToast();

  const handleComplete = ({
    done,
    conflict,
    failed,
  }: ProjectBatchSummary): void => {
    if (done > 0) {
      showToast(`Attached ${plural(done)}`, 'success');
      onSuccess();
    }
    if (conflict > 0)
      showToast(
        `${plural(conflict)} already in another billing group`,
        'warning'
      );
    if (failed > 0) showToast(`Failed to attach ${plural(failed)}`, 'error');
  };

  return (
    <ProjectBatchPickerDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Attach projects to ${groupName}`}
      description="Users of these projects will use this group's Stripe account and catalog. A project can belong to only one billing group."
      excludeProjectHashes={attachedProjectHashes}
      confirmLabel="Attach"
      resultLabels={{
        done: 'Attached',
        conflict: 'In another group',
        error: 'Failed',
      }}
      emptyDescription="Every project you manage is already attached to this group."
      runForProject={(projectHash) =>
        billingService.attachProject(groupHash, projectHash)
      }
      isConflict={isAttachConflict}
      onComplete={handleComplete}
    />
  );
}

export default BillingAttachProjectsModal;
