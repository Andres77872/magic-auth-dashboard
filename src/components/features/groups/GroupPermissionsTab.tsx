import React, { useMemo, useState } from 'react';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { DataView, type DataViewColumn } from '@/components/common/DataView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useGroupPermissionGroups,
  usePermissionGroupCatalog,
} from '@/hooks/useGroupDetails';
import { useToast } from '@/hooks/useToast';
import { formatCount, formatNumber, pluralize } from '@/utils/formatters';
import type { AssignedPermissionGroup } from '@/types/permission-assignments.types';
import {
  GroupPickerDialog,
  type PickerFailure,
  type PickerItem,
} from './GroupPickerDialog';
import { GroupSectionHeader } from './GroupSectionHeader';
import { TimeCell } from './GroupCells';

export interface GroupPermissionsTabProps {
  groupHash: string;
  groupName: string;
}

/**
 * Permission groups assigned to a user group. These assignments appear in
 * members' permission sources but are not part of their access tokens (only
 * the global role is), which the copy states plainly.
 */
export function GroupPermissionsTab({
  groupHash,
  groupName,
}: GroupPermissionsTabProps): React.JSX.Element {
  const { showToast } = useToast();
  const { assigned, isLoading, isRefreshing, error, refetch, assign, remove } =
    useGroupPermissionGroups(groupHash);
  const [isAssigning, setIsAssigning] = useState(false);
  const [toRemove, setToRemove] = useState<AssignedPermissionGroup | null>(
    null
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async (
    target: AssignedPermissionGroup
  ): Promise<void> => {
    setIsRemoving(true);
    try {
      await remove(target.group_hash);
      showToast(
        `Removed ${target.group_display_name || target.group_name} from ${groupName}.`,
        'success'
      );
      setToRemove(null);
      void refetch();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The permission group could not be removed.',
        'error'
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const columns: DataViewColumn<AssignedPermissionGroup>[] = [
    {
      key: 'group_display_name',
      header: 'Permission group',
      render: (_value, pg) => (
        <div className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-foreground">
            {pg.group_display_name || pg.group_name}
          </span>
          <span className="block truncate font-mono text-xs text-muted-foreground">
            {pg.group_name}
          </span>
        </div>
      ),
    },
    {
      key: 'group_category',
      header: 'Category',
      width: '160px',
      hideOnMobile: true,
      render: (_value, pg) => (
        <Badge variant="secondary" size="sm">
          {pg.group_category || 'Uncategorised'}
        </Badge>
      ),
    },
    {
      key: 'assigned_at',
      header: 'Assigned',
      width: '140px',
      hideOnMobile: true,
      render: (_value, pg) => <TimeCell value={pg.assigned_at} />,
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '72px',
      align: 'right',
      render: (_value, pg) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setToRemove(pg)}
          aria-label={`Remove ${pg.group_display_name || pg.group_name} from ${groupName}`}
          title="Remove from group"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      ),
    },
  ];

  const assignButton = (
    variant: 'primary' | 'secondary'
  ): React.JSX.Element => (
    <Button
      variant={variant}
      size="md"
      leftIcon={<Plus aria-hidden="true" />}
      onClick={() => setIsAssigning(true)}
    >
      Assign permission groups
    </Button>
  );

  return (
    <section aria-label="Permission groups">
      <GroupSectionHeader
        title="Permission groups"
        description="Listed in members’ permission sources. Access tokens only carry the permissions of each user’s global role."
        actions={assignButton('primary')}
      />

      {error && assigned.length === 0 && !isLoading ? (
        <ErrorState
          retryLabel="Try again"
          title="Permission groups couldn't be loaded"
          message={error}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
          variant="inline"
          size="sm"
        />
      ) : (
        <DataView<AssignedPermissionGroup>
          data={assigned}
          columns={columns}
          keyExtractor={(pg) => pg.group_hash}
          isLoading={isLoading}
          skeletonRows={3}
          emptyIcon={<Lock className="h-8 w-8" />}
          emptyMessage="No permission groups assigned"
          emptyDescription="Assigned permission groups are listed as a source for every member."
          emptyAction={assignButton('secondary')}
          caption={`Permission groups assigned to ${groupName}`}
        />
      )}

      {isAssigning && (
        <AssignPermissionGroupsDialog
          groupName={groupName}
          assignedHashes={assigned.map((pg) => pg.group_hash)}
          onClose={() => setIsAssigning(false)}
          onAssign={async (hashes) => {
            const result = await assign(hashes);
            const failures = result.results.filter((row) => !row.success);
            if (result.success_count > 0) {
              showToast(
                failures.length > 0
                  ? `Assigned ${formatNumber(result.success_count)} of ${formatCount(result.total_count, 'permission group')}.`
                  : `Assigned ${formatCount(result.success_count, 'permission group')} to ${groupName}.`,
                failures.length > 0 ? 'warning' : 'success'
              );
              void refetch();
            }
            return failures.map((row) => ({
              id: row.permission_group_hash,
              label: row.permission_group_name ?? row.permission_group_hash,
              message: row.error ?? 'Not assigned.',
            }));
          }}
        />
      )}

      <ConfirmDialog
        isOpen={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (toRemove) void handleRemove(toRemove);
        }}
        title="Remove permission group"
        message={
          toRemove ? (
            <>
              <strong className="text-foreground">
                {toRemove.group_display_name || toRemove.group_name}
              </strong>{' '}
              will no longer be listed as a permission source for members of{' '}
              {groupName}.
            </>
          ) : (
            ''
          )
        }
        confirmText="Remove"
        variant="danger"
        isLoading={isRemoving}
      />
    </section>
  );
}

interface AssignPermissionGroupsDialogProps {
  groupName: string;
  assignedHashes: string[];
  onClose: () => void;
  onAssign: (hashes: string[]) => Promise<PickerFailure[]>;
}

function AssignPermissionGroupsDialog({
  groupName,
  assignedHashes,
  onClose,
  onAssign,
}: AssignPermissionGroupsDialogProps): React.JSX.Element {
  const catalog = usePermissionGroupCatalog(true);
  const [search, setSearch] = useState('');
  const assigned = useMemo(() => new Set(assignedHashes), [assignedHashes]);

  const term = search.trim().toLowerCase();
  const items: PickerItem[] = catalog.permissionGroups
    .filter(
      (pg) =>
        !term ||
        pg.group_name.toLowerCase().includes(term) ||
        (pg.group_display_name || '').toLowerCase().includes(term) ||
        (pg.group_category || '').toLowerCase().includes(term)
    )
    .sort(
      (a, b) =>
        (a.group_category || '').localeCompare(b.group_category || '') ||
        (a.group_display_name || a.group_name).localeCompare(
          b.group_display_name || b.group_name
        )
    )
    .map((pg) => ({
      id: pg.group_hash,
      label: pg.group_display_name || pg.group_name,
      description: pg.group_description || pg.group_name,
      meta: (
        <Badge variant="secondary" size="sm">
          {pg.group_category || 'Uncategorised'}
        </Badge>
      ),
      disabledReason: assigned.has(pg.group_hash) ? 'Assigned' : undefined,
    }));

  return (
    <GroupPickerDialog
      onClose={onClose}
      title={`Assign permission groups to ${groupName}`}
      description="Assigned permission groups show up in members’ permission sources. They don’t change access tokens."
      items={items}
      isLoading={catalog.isLoading}
      error={catalog.error}
      onRetry={() => void catalog.refetch()}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Filter by name or category"
      emptyMessage="No permission groups exist yet."
      noun={['permission group', 'permission groups']}
      confirmLabel={(count) =>
        count === 0
          ? 'Assign'
          : `Assign ${formatNumber(count)} ${pluralize(count, 'permission group')}`
      }
      onConfirm={onAssign}
    />
  );
}

export default GroupPermissionsTab;
