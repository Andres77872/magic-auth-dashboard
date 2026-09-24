import React, { useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useProjectCandidates,
  useProjectGroupMutations,
} from '@/hooks/useProjectGroups';
import { formatNumber, pluralize } from '@/utils/formatters';
import type { GroupBatchResult } from '@/types/group.types';
import {
  GroupPickerDialog,
  type PickerFailure,
  type PickerItem,
} from './GroupPickerDialog';

export interface AddProjectsToGroupModalProps {
  groupHash: string;
  groupName: string;
  assignedProjectHashes: string[];
  onClose: () => void;
  /** Called after at least one project was added. */
  onAdded: (result: GroupBatchResult) => void;
}

/** Search projects and add them to a project group. Mount while open. */
export function AddProjectsToGroupModal({
  groupHash,
  groupName,
  assignedProjectHashes,
  onClose,
  onAdded,
}: AddProjectsToGroupModalProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { projects, isLoading, isRefreshing, error, refetch } =
    useProjectCandidates(debouncedSearch, true);
  const { addProjects } = useProjectGroupMutations();

  const assigned = useMemo(
    () => new Set(assignedProjectHashes),
    [assignedProjectHashes]
  );
  const items: PickerItem[] = projects.map((project) => ({
    id: project.project_hash,
    label: project.project_name,
    description: project.project_description,
    disabledReason: assigned.has(project.project_hash)
      ? 'In this group'
      : undefined,
  }));
  const nameOf = (hash: string): string =>
    projects.find((p) => p.project_hash === hash)?.project_name ?? hash;

  const handleConfirm = async (
    projectHashes: string[]
  ): Promise<PickerFailure[]> => {
    const result = await addProjects(groupHash, projectHashes);
    if (result.succeeded.length > 0) onAdded(result);
    return result.failures.map((failure) => ({
      id: failure.id,
      label: nameOf(failure.id),
      message: failure.message,
    }));
  };

  return (
    <GroupPickerDialog
      onClose={onClose}
      title={`Add projects to ${groupName}`}
      description="Members of every user group granted this project group will be able to sign in to these projects."
      items={items}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      onRetry={() => void refetch()}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search projects by name or description"
      emptyMessage="No projects available."
      noun={['project', 'projects']}
      confirmLabel={(count) =>
        count === 0
          ? 'Add projects'
          : `Add ${formatNumber(count)} ${pluralize(count, 'project')}`
      }
      onConfirm={handleConfirm}
    />
  );
}

export default AddProjectsToGroupModal;
