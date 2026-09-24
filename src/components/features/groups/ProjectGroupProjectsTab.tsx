import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Trash2 } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { useProjectGroupMutations } from '@/hooks/useProjectGroups';
import { useToast } from '@/hooks/useToast';
import { formatCount, formatNumber } from '@/utils/formatters';
import type { AssignedProject, GroupBatchResult } from '@/types/group.types';
import { AddProjectsToGroupModal } from './AddProjectsToGroupModal';
import { GroupSectionHeader } from './GroupSectionHeader';
import { NameCell } from './GroupCells';
import { groupRoutes } from './group-routes';

export interface ProjectGroupProjectsTabProps {
  groupHash: string;
  groupName: string;
  projects: AssignedProject[];
  /** Refresh the project group after projects changed. */
  onChange: () => void;
}

/** Projects inside a project group, with add and remove. */
export function ProjectGroupProjectsTab({
  groupHash,
  groupName,
  projects,
  onChange,
}: ProjectGroupProjectsTabProps): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { removeProject } = useProjectGroupMutations();
  const [isAdding, setIsAdding] = useState(false);
  const [toRemove, setToRemove] = useState<AssignedProject | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleAdded = (result: GroupBatchResult): void => {
    const added = result.succeeded.length;
    showToast(
      result.failures.length > 0
        ? `Added ${formatNumber(added)} of ${formatCount(added + result.failures.length, 'project')}; ${formatNumber(result.failures.length)} failed.`
        : `Added ${formatCount(added, 'project')} to ${groupName}.`,
      result.failures.length > 0 ? 'warning' : 'success'
    );
    onChange();
  };

  const handleRemove = async (project: AssignedProject): Promise<void> => {
    setIsRemoving(true);
    try {
      await removeProject(groupHash, project.project_hash);
      showToast(
        `Removed ${project.project_name} from ${groupName}.`,
        'success'
      );
      setToRemove(null);
      onChange();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The project could not be removed.',
        'error'
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const columns: DataViewColumn<AssignedProject>[] = [
    {
      key: 'project_name',
      header: 'Project',
      render: (_value, project) => (
        <NameCell
          to={groupRoutes.project(project.project_hash)}
          name={project.project_name}
          description={project.project_description}
        />
      ),
    },
    {
      key: 'project_hash',
      header: 'Actions',
      width: '72px',
      align: 'right',
      render: (_value, project) => (
        <span data-no-row-click>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setToRemove(project)}
            aria-label={`Remove ${project.project_name} from ${groupName}`}
            title="Remove from project group"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ];

  const addButton = (variant: 'primary' | 'secondary'): React.JSX.Element => (
    <Button
      variant={variant}
      size="md"
      leftIcon={<Plus aria-hidden="true" />}
      onClick={() => setIsAdding(true)}
    >
      Add projects
    </Button>
  );

  return (
    <section aria-label="Projects">
      <GroupSectionHeader
        title="Projects"
        description="Members of every user group granted this project group can sign in to these projects."
        actions={addButton('primary')}
      />

      <DataView<AssignedProject>
        data={projects}
        columns={columns}
        keyExtractor={(project) => project.project_hash}
        onRowClick={(project) =>
          void navigate(groupRoutes.project(project.project_hash))
        }
        showSearch={projects.length > 10}
        enableLocalSearch
        searchKeys={['project_name', 'project_description']}
        searchPlaceholder="Filter projects"
        emptyIcon={<FolderKanban className="h-8 w-8" />}
        emptyMessage="No projects in this group"
        emptyDescription="Add projects so user groups granted this group can reach them."
        emptyAction={addButton('secondary')}
        caption={`Projects in ${groupName}`}
      />

      {isAdding && (
        <AddProjectsToGroupModal
          groupHash={groupHash}
          groupName={groupName}
          assignedProjectHashes={projects.map(
            (project) => project.project_hash
          )}
          onClose={() => setIsAdding(false)}
          onAdded={handleAdded}
        />
      )}

      <ConfirmDialog
        isOpen={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) void handleRemove(toRemove);
        }}
        title="Remove project"
        message={
          toRemove ? (
            <>
              Members of user groups granted{' '}
              <strong className="text-foreground">{groupName}</strong> lose
              access to{' '}
              <strong className="text-foreground">
                {toRemove.project_name}
              </strong>{' '}
              unless another group covers it, and their sessions for it are
              signed out. The project itself is not changed.
            </>
          ) : (
            ''
          )
        }
        confirmText="Remove project"
        variant="danger"
        isLoading={isRemoving}
      />
    </section>
  );
}

export default ProjectGroupProjectsTab;
