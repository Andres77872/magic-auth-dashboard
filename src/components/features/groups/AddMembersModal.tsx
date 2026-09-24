import React, { useMemo, useState } from 'react';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useGroupMemberActions,
  useMemberCandidates,
} from '@/hooks/useGroupMemberActions';
import { BULK_MEMBERS_MAX } from '@/services/group.service';
import { formatNumber, pluralize } from '@/utils/formatters';
import type { BulkAddMembersResult } from '@/types/group.types';
import {
  GroupPickerDialog,
  type PickerFailure,
  type PickerItem,
} from './GroupPickerDialog';

export interface AddMembersModalProps {
  groupHash: string;
  groupName: string;
  /** Members known to the page (current page of the member list); shown as already added. */
  knownMemberHashes: string[];
  onClose: () => void;
  /** Called after at least one user was added, with the outcome. */
  onAdded: (result: BulkAddMembersResult) => void;
}

/** Search users and add one or several (up to 100) to a user group. Mount while open. */
export function AddMembersModal({
  groupHash,
  groupName,
  knownMemberHashes,
  onClose,
  onAdded,
}: AddMembersModalProps): React.JSX.Element {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const { candidates, isLoading, isRefreshing, error, refetch } =
    useMemberCandidates(debouncedSearch, true);
  const { addMembers } = useGroupMemberActions(groupHash);

  const known = useMemo(() => new Set(knownMemberHashes), [knownMemberHashes]);
  const items: PickerItem[] = candidates.map((user) => ({
    id: user.user_hash,
    label: user.username,
    description: user.email,
    meta: <UserTypeBadge userType={user.user_type} />,
    disabledReason: known.has(user.user_hash) ? 'Already a member' : undefined,
  }));

  const handleConfirm = async (
    userHashes: string[]
  ): Promise<PickerFailure[]> => {
    const result = await addMembers(userHashes);
    if (result.succeeded > 0) onAdded(result);
    return result.failures.map((failure, index) => ({
      id: failure.user_hash ?? `unknown-${index}`,
      label: failure.username ?? failure.user_hash ?? 'Unknown user',
      message: failure.message,
    }));
  };

  return (
    <GroupPickerDialog
      onClose={onClose}
      title={`Add members to ${groupName}`}
      description="Members can sign in to every project this group reaches through its project groups."
      items={items}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      onRetry={() => void refetch()}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search users by name or email"
      emptyMessage="No users found."
      noun={['user', 'users']}
      maxSelection={BULK_MEMBERS_MAX}
      confirmLabel={(count) =>
        count === 0
          ? 'Add members'
          : `Add ${formatNumber(count)} ${pluralize(count, 'member')}`
      }
      onConfirm={handleConfirm}
      footnote="Shows the first 50 matches. Adding someone who is already a member keeps them in the group."
    />
  );
}

export default AddMembersModal;
