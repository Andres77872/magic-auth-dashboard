import React, { useMemo } from 'react';
import { useProjectGroups } from '@/hooks/useProjectGroups';
import { formatCount, formatNumber, pluralize } from '@/utils/formatters';
import type { GroupBatchResult } from '@/types/group.types';
import {
  GroupPickerDialog,
  type PickerFailure,
  type PickerItem,
} from './GroupPickerDialog';

export interface GrantProjectGroupsModalProps {
  groupName: string;
  grantedHashes: string[];
  onClose: () => void;
  /** Grant the selected project groups (one request each). */
  onGrant: (projectGroupHashes: string[]) => Promise<GroupBatchResult>;
  /** Called after at least one grant succeeded. */
  onGranted: (result: GroupBatchResult) => void;
}

/** Pick project groups to grant to a user group. Mount while open. */
export function GrantProjectGroupsModal({
  groupName,
  grantedHashes,
  onClose,
  onGrant,
  onGranted,
}: GrantProjectGroupsModalProps): React.JSX.Element {
  const list = useProjectGroups({ limit: 100 });
  const granted = useMemo(() => new Set(grantedHashes), [grantedHashes]);

  const items: PickerItem[] = list.projectGroups.map((pg) => ({
    id: pg.group_hash,
    label: pg.group_name,
    description: pg.description,
    meta: (
      <span className="text-xs text-muted-foreground">
        {formatCount(pg.project_count, 'project')}
      </span>
    ),
    disabledReason: granted.has(pg.group_hash) ? 'Already granted' : undefined,
  }));
  const nameOf = (hash: string): string =>
    list.projectGroups.find((pg) => pg.group_hash === hash)?.group_name ?? hash;

  const handleConfirm = async (hashes: string[]): Promise<PickerFailure[]> => {
    const result = await onGrant(hashes);
    if (result.succeeded.length > 0) onGranted(result);
    return result.failures.map((failure) => ({
      id: failure.id,
      label: nameOf(failure.id),
      message: failure.message,
    }));
  };

  const hiddenCount =
    list.total !== undefined ? list.total - list.projectGroups.length : 0;

  return (
    <GroupPickerDialog
      onClose={onClose}
      title={`Grant project groups to ${groupName}`}
      description="Members of this user group will be able to sign in to every project in the selected project groups."
      items={items}
      isLoading={list.isLoading}
      isRefreshing={list.isRefreshing}
      error={list.error}
      onRetry={() => void list.refetch()}
      searchValue={list.searchInput}
      onSearchChange={list.setSearchInput}
      searchPlaceholder="Search project groups by name"
      emptyMessage="No project groups exist yet."
      noun={['project group', 'project groups']}
      confirmLabel={(count) =>
        count === 0
          ? 'Grant access'
          : `Grant ${formatNumber(count)} ${pluralize(count, 'project group')}`
      }
      onConfirm={handleConfirm}
      footnote={
        hiddenCount > 0
          ? `${formatNumber(hiddenCount)} more not shown; search to narrow the list.`
          : undefined
      }
    />
  );
}

export default GrantProjectGroupsModal;
