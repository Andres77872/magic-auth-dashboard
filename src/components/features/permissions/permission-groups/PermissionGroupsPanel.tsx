import React, { useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import {
  ConfirmDialog,
  DataView,
  ErrorState,
  type DataViewColumn,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { globalRolesService } from '@/services/global-roles.service';
import { useToast } from '@/hooks';
import type { AccessCatalog } from '@/hooks/useAccessCatalog';
import type {
  GlobalPermission,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';
import {
  AccessFormDialog,
  type AccessFormField,
  type AccessFormValues,
} from '../shared/AccessFormDialog';
import { PermissionGroupSheet } from './PermissionGroupSheet';

interface PermissionGroupsPanelProps {
  catalog: AccessCatalog;
  canEdit: boolean;
  selectedHash: string | null;
  onSelect: (groupHash: string | null) => void;
  onOpenRole: (roleHash: string) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

const ALL = '__all__';
const NO_ROLES: GlobalRole[] = [];
const NO_PERMISSIONS: GlobalPermission[] = [];

function fields(categories: string[]): AccessFormField[] {
  return [
    {
      key: 'group_display_name',
      label: 'Display name',
      required: true,
      placeholder: 'Billing read',
    },
    {
      key: 'group_name',
      label: 'Name',
      required: true,
      immutableOnEdit: true,
      monospace: true,
      placeholder: 'billing_read',
      hint: 'Machine name. It can’t be changed later.',
    },
    {
      key: 'group_category',
      label: 'Category',
      required: true,
      suggestions: categories,
      placeholder: 'billing',
      hint: 'Groups with the same category are listed together.',
    },
    { key: 'group_description', label: 'Description', kind: 'textarea' },
  ];
}

function toValues(group: GlobalPermissionGroup | null): AccessFormValues {
  return {
    group_display_name: group?.group_display_name ?? '',
    group_name: group?.group_name ?? '',
    group_category: group?.group_category ?? '',
    group_description: group?.group_description ?? '',
  };
}

/** Permission groups: list with category filter, create/edit/delete, detail sheet. */
export function PermissionGroupsPanel({
  catalog,
  canEdit,
  selectedHash,
  onSelect,
  onOpenRole,
  createOpen,
  onCreateOpenChange,
}: PermissionGroupsPanelProps): React.JSX.Element {
  const { showToast } = useToast();
  const { permissionGroups, permissions, roles, groupCategories } = catalog;
  const [category, setCategory] = useState(ALL);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<GlobalPermissionGroup | null>(null);
  const [deleting, setDeleting] = useState<GlobalPermissionGroup | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const all = permissionGroups.data;
  const list = useMemo(
    () =>
      category === ALL
        ? (all ?? [])
        : (all ?? []).filter((group) => group.group_category === category),
    [all, category]
  );
  const selected =
    (all ?? []).find((group) => group.group_hash === selectedHash) ?? null;

  const columns = useMemo<DataViewColumn<GlobalPermissionGroup>[]>(
    () => [
      {
        key: 'group_display_name',
        header: 'Permission group',
        render: (_value, group) => (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-foreground">
              {group.group_display_name}
            </div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {group.group_name}
            </div>
          </div>
        ),
      },
      {
        key: 'group_category',
        header: 'Category',
        width: '160px',
        render: (_value, group) => (
          <Badge variant="secondary" size="sm">
            {group.group_category}
          </Badge>
        ),
      },
      {
        key: 'group_description',
        header: 'Description',
        hideOnMobile: true,
        render: (_value, group) => (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {group.group_description || '—'}
          </span>
        ),
      },
    ],
    []
  );

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await globalRolesService.deletePermissionGroup(deleting.group_hash);
      showToast(`Deleted ${deleting.group_display_name}.`, 'success');
      if (selectedHash === deleting.group_hash) onSelect(null);
      setDeleting(null);
      await permissionGroups.refetch();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The permission group could not be deleted.',
        'error'
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  if (permissionGroups.error && !permissionGroups.data) {
    return (
      <ErrorState
        title="Permission groups could not be loaded"
        message={permissionGroups.error}
        onRetry={() => void permissionGroups.refetch()}
      />
    );
  }

  return (
    <>
      <DataView<GlobalPermissionGroup>
        data={list}
        columns={columns}
        keyExtractor={(group) => group.group_hash}
        showSearch
        enableLocalSearch
        searchKeys={[
          'group_display_name',
          'group_name',
          'group_description',
          'group_category',
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permission groups"
        toolbarFilters={
          groupCategories.length > 1 ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-8 w-44 text-[13px]"
                aria-label="Filter by category"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {groupCategories.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
        onRowClick={(group) => onSelect(group.group_hash)}
        isLoading={permissionGroups.isLoading}
        skeletonRows={5}
        emptyIcon={<Layers className="h-8 w-8" />}
        emptyMessage={
          search || category !== ALL
            ? 'No permission groups match'
            : 'No permission groups yet'
        }
        emptyDescription={
          search || category !== ALL
            ? undefined
            : 'Group related permissions so roles can grant them together.'
        }
        caption="Permission groups"
      />

      <PermissionGroupSheet
        group={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && onSelect(null)}
        permissions={permissions.data ?? NO_PERMISSIONS}
        roles={roles.data ?? NO_ROLES}
        canEdit={canEdit}
        onEdit={setEditing}
        onDelete={setDeleting}
        onOpenRole={onOpenRole}
      />

      <AccessFormDialog
        open={createOpen || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            onCreateOpenChange(false);
            setEditing(null);
          }
        }}
        mode={editing ? 'edit' : 'create'}
        title={
          editing
            ? `Edit ${editing.group_display_name}`
            : 'Create permission group'
        }
        description={
          editing
            ? 'Update how this group is described.'
            : 'Add permissions to the group after creating it.'
        }
        fields={fields(groupCategories)}
        initialValues={toValues(editing)}
        submitLabel={editing ? 'Save changes' : 'Create group'}
        successMessage={
          editing ? 'Permission group updated.' : 'Permission group created.'
        }
        onSubmit={async (values) => {
          if (editing) {
            await globalRolesService.updatePermissionGroup(editing.group_hash, {
              group_display_name: values.group_display_name,
              group_description: values.group_description,
              group_category: values.group_category,
            });
          } else {
            const created = await globalRolesService.createPermissionGroup({
              group_name: values.group_name,
              group_display_name: values.group_display_name,
              group_category: values.group_category,
              group_description: values.group_description || undefined,
            });
            onSelect(created.group_hash);
          }
          await permissionGroups.refetch();
        }}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title={`Delete ${deleting?.group_display_name ?? 'permission group'}?`}
        message="Roles, user groups and users holding this group lose its permissions."
        confirmText="Delete group"
        confirmationPhrase={deleting?.group_name}
        isLoading={deleteBusy}
      />
    </>
  );
}

export default PermissionGroupsPanel;
