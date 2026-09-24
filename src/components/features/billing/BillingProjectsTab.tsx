/** Projects attached to a billing group, with attach and detach. */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Unlink } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  BillingGroupDetails,
  BillingGroupProject,
} from '@/types/billing.types';
import { BillingAttachProjectsModal } from './BillingAttachProjectsModal';
import { useBillingGroupMutations } from './useBilling';

export interface BillingProjectsTabProps {
  details: BillingGroupDetails;
  onChanged: () => void;
}

export function BillingProjectsTab({
  details,
  onChanged,
}: BillingProjectsTabProps): React.JSX.Element {
  const { group, projects } = details;
  const { showToast } = useToast();
  const { detachProject, pending } = useBillingGroupMutations();
  const [attachOpen, setAttachOpen] = useState(false);
  const [detachTarget, setDetachTarget] = useState<BillingGroupProject | null>(
    null
  );

  const confirmDetach = async (): Promise<void> => {
    if (!detachTarget) return;
    try {
      await detachProject(group.group_hash, detachTarget.project_hash);
      showToast(
        `Detached ${detachTarget.project_name || 'the project'}`,
        'success'
      );
      setDetachTarget(null);
      onChanged();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The project could not be detached.',
        'error'
      );
    }
  };

  const columns: DataViewColumn<BillingGroupProject>[] = [
    {
      key: 'project_name',
      header: 'Project',
      render: (_value, project) => (
        <div className="min-w-0">
          <Link
            to={`${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}`}
            className="font-medium text-foreground no-underline hover:underline"
          >
            {project.project_name || project.project_hash}
          </Link>
          {project.project_description && (
            <div className="max-w-[420px] truncate text-xs text-muted-foreground">
              {project.project_description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'added_at',
      header: 'Attached',
      hideOnMobile: true,
      render: (_value, project) =>
        project.added_at ? (
          <time
            dateTime={project.added_at}
            title={formatDateTime(project.added_at)}
            className="text-muted-foreground"
          >
            {formatRelativeTime(project.added_at)}
          </time>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'project_hash',
      header: '',
      align: 'right',
      width: '120px',
      render: (_value, project) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDetachTarget(project)}
          aria-label={`Detach ${project.project_name || project.project_hash}`}
        >
          <Unlink aria-hidden="true" />
          Detach
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataView<BillingGroupProject>
        data={projects}
        columns={columns}
        keyExtractor={(project) => project.project_hash}
        toolbarFilters={
          <p className="m-0 text-xs text-muted-foreground">
            Users of these projects are billed through this group.
          </p>
        }
        toolbarActions={
          <Button onClick={() => setAttachOpen(true)}>
            <Plus aria-hidden="true" />
            Attach projects
          </Button>
        }
        emptyIcon={<FolderKanban className="h-8 w-8" />}
        emptyMessage="No projects attached"
        emptyDescription="Attach a project to bill its users through this group's Stripe account and catalog."
        caption="Attached projects"
      />

      <BillingAttachProjectsModal
        isOpen={attachOpen}
        onClose={() => setAttachOpen(false)}
        onSuccess={onChanged}
        groupHash={group.group_hash}
        groupName={group.name}
        attachedProjectHashes={projects.map((project) => project.project_hash)}
      />

      <ConfirmDialog
        isOpen={detachTarget !== null}
        onClose={() => setDetachTarget(null)}
        onConfirm={() => void confirmDetach()}
        variant="warning"
        title="Detach project?"
        message={
          <>
            <span className="font-medium text-foreground">
              {detachTarget?.project_name || detachTarget?.project_hash}
            </span>{' '}
            will stop using this group. Its users fall back to the free default
            until the project is attached to a billing group again.
          </>
        }
        confirmText="Detach project"
        isLoading={pending === 'detach'}
      />
    </>
  );
}

export default BillingProjectsTab;
