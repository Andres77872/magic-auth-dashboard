import React, { useMemo } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import { formatCount, formatNumber, pluralize } from '@/utils/formatters';
import type { GroupBatchResult } from '@/types/group.types';
import {
  GroupPickerDialog,
  type PickerFailure,
  type PickerItem,
} from './GroupPickerDialog';

export interface GrantUserGroupsModalProps {
  projectGroupName: string;
  grantedHashes: string[];
  /** Root may grant `admin_…` groups; others get 403 from the backend. */
  canManageAdminGroups: boolean;
  onClose: () => void;
  onGrant: (userGroupHashes: string[]) => Promise<GroupBatchResult>;
  /** Called after at least one grant succeeded. */
  onGranted: (result: GroupBatchResult) => void;
}

/** Pick user groups to grant a project group to. Mount while open. */
export function GrantUserGroupsModal({
  projectGroupName,
  grantedHashes,
  canManageAdminGroups,
  onClose,
  onGrant,
  onGranted,
}: GrantUserGroupsModalProps): React.JSX.Element {
  const list = useGroups({ limit: 100 });
  const granted = useMemo(() => new Set(grantedHashes), [grantedHashes]);

  const items: PickerItem[] = list.groups.map((group) => ({
    id: group.group_hash,
    label: group.group_name,
    description: group.description,
    meta: (
      <span className="text-xs text-muted-foreground">
        {formatCount(group.member_count ?? 0, 'member')}
      </span>
    ),
    disabledReason: granted.has(group.group_hash)
      ? 'Already granted'
      : !canManageAdminGroups && isProjectAdminGroupName(group.group_name)
        ? 'Root only'
        : undefined,
  }));
  const nameOf = (hash: string): string =>
    list.groups.find((g) => g.group_hash === hash)?.group_name ?? hash;

  const handleConfirm = async (hashes: string[]): Promise<PickerFailure[]> => {
    const result = await onGrant(hashes);
    if (result.succeeded.length > 0) onGranted(result);
    return result.failures.map((failure) => ({
      id: failure.id,
      label: nameOf(failure.id),
      message: failure.message,
    }));
  };

  return (
    <GroupPickerDialog
      onClose={onClose}
      title={`Grant ${projectGroupName} to user groups`}
      description="Members of the selected user groups will be able to sign in to every project in this project group."
      items={items}
      isLoading={list.isLoading}
      isRefreshing={list.isRefreshing}
      error={list.error}
      onRetry={() => void list.refetch()}
      searchValue={list.searchInput}
      onSearchChange={list.setSearchInput}
      searchPlaceholder="Search user groups by name"
      emptyMessage="No user groups exist yet."
      noun={['user group', 'user groups']}
      confirmLabel={(count) =>
        count === 0
          ? 'Grant access'
          : `Grant to ${formatNumber(count)} ${pluralize(count, 'user group')}`
      }
      onConfirm={handleConfirm}
      footnote={
        list.groups.length === 100
          ? 'Showing the first 100 user groups; search to narrow the list.'
          : undefined
      }
    />
  );
}

export default GrantUserGroupsModal;
