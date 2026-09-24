import React from 'react';
import { Trash2 } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { Button } from '@/components/ui/button';
import { useProjectMutations } from '@/hooks/useProjects';
import { useToast } from '@/hooks/useToast';
import type { ProjectFormData, ProjectInfo } from '@/types/project.types';
import { ProjectForm } from './ProjectForm';

interface ProjectSettingsTabProps {
  project: ProjectInfo;
  /** Reload the project after the API confirms an update. */
  onUpdated: () => Promise<void>;
  onDeleteRequest: () => void;
}

/** Edit the project's name and description; delete it from the danger zone. */
export function ProjectSettingsTab({
  project,
  onUpdated,
  onDeleteRequest,
}: ProjectSettingsTabProps): React.JSX.Element {
  const { showToast } = useToast();
  const { pending, updateProject } = useProjectMutations();

  const save = async (values: ProjectFormData): Promise<void> => {
    try {
      await updateProject(project.project_hash, values);
      showToast('Project updated.', 'success');
      await onUpdated();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The project could not be updated.',
        'error'
      );
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Panel
        title="General"
        description="Shown to operators across the console and in project pickers."
      >
        {/* Remount when the saved values change so the form starts from them. */}
        <ProjectForm
          key={`${project.project_name}\u0000${project.project_description ?? ''}`}
          mode="edit"
          idPrefix="project-settings"
          initialValues={{
            project_name: project.project_name,
            project_description: project.project_description ?? '',
          }}
          onSubmit={(values) => void save(values)}
          submitLabel="Save changes"
          isSubmitting={pending === 'update'}
        />
      </Panel>

      <Panel title="Danger zone" className="border-destructive/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-[13px] font-medium text-foreground">
              Delete this project
            </p>
            <p className="m-0 text-xs text-muted-foreground">
              Removes it from every project group and ends its sessions. The API
              cannot restore it.
            </p>
          </div>
          <Button variant="destructive" onClick={onDeleteRequest}>
            <Trash2 aria-hidden="true" />
            Delete project
          </Button>
        </div>
      </Panel>
    </div>
  );
}

export default ProjectSettingsTab;
