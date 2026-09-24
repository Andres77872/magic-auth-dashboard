import React, { useCallback, useMemo, useState } from 'react';
import { KeyRound } from 'lucide-react';
import {
  ConfirmDialog,
  DataView,
  DetailSheet,
  ErrorState,
  FactList,
  type DataViewColumn,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { globalRolesService } from '@/services/global-roles.service';
import { useAsyncData, useToast } from '@/hooks';
import { formatDateTime } from '@/utils/formatters';
import type { AccessCatalog } from '@/hooks/useAccessCatalog';
import type {
  GlobalPermission,
  GlobalPermissionGroup,
} from '@/types/global-roles.types';
import {
  AccessFormDialog,
  type AccessFormField,
  type AccessFormValues,
} from '../shared/AccessFormDialog';

interface PermissionsPanelProps {
  catalog: AccessCatalog;
  canEdit: boolean;
  onOpenGroup: (groupHash: string) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

const ALL = '__all__';
const NO_GROUPS: GlobalPermissionGroup[] = [];

function fields(categories: string[]): AccessFormField[] {
  return [
    {
      key: 'permission_display_name',
      label: 'Display name',
      required: true,
      placeholder: 'Read invoices',
    },
    {
      key: 'permission_name',
      label: 'Name',
      required: true,
      immutableOnEdit: true,
      monospace: true,
      placeholder: 'invoices.read',
      hint: 'The string apps check for. It can’t be changed later.',
    },
    {
      key: 'permission_category',
      label: 'Category',
      required: true,
      suggestions: categories,
      placeholder: 'billing',
    },
    { key: 'permission_description', label: 'Description', kind: 'textarea' },
  ];
}

function toValues(permission: GlobalPermission | null): AccessFormValues {
  return {
    permission_display_name: permission?.permission_display_name ?? '',
    permission_name: permission?.permission_name ?? '',
    permission_category: permission?.permission_category ?? '',
    permission_description: permission?.permission_description ?? '',
  };
}

function PermissionSheet({
  permission,
  groups,
  canEdit,
  onClose,
  onEdit,
  onDelete,
  onOpenGroup,
}: {
  permission: GlobalPermission | null;
  groups: GlobalPermissionGroup[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: (permission: GlobalPermission) => void;
  onDelete: (permission: GlobalPermission) => void;
  onOpenGroup: (groupHash: string) => void;
}): React.JSX.Element | null {
  const permissionHash = permission?.permission_hash;
  // No endpoint lists the groups containing a permission, so check each group.
  const fetchContaining = useCallback(async (): Promise<
    GlobalPermissionGroup[]
  > => {
    if (!permissionHash) return [];
    const matches = await Promise.all(
      groups.map(async (group) => {
        const permissions = await globalRolesService.getGroupPermissions(
          group.group_hash
        );
        return permissions.some((p) => p.permission_hash === permissionHash)
          ? group
          : null;
      })
    );
    return matches.filter(
      (group): group is GlobalPermissionGroup => group !== null
    );
  }, [permissionHash, groups]);
  const containing = useAsyncData(fetchContaining, {
    enabled: Boolean(permissionHash),
  });

  if (!permission) return null;

  return (
    <DetailSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={permission.permission_display_name}
      description={permission.permission_description || 'No description'}
      meta={
        <>
          <span className="font-mono text-xs text-muted-foreground">
            {permission.permission_name}
          </span>
          <Badge variant="secondary" size="sm">
            {permission.permission_category}
          </Badge>
        </>
      }
      footer={
        canEdit ? (
          <>
            <Button variant="destructive" onClick={() => onDelete(permission)}>
              Delete permission
            </Button>
            <Button variant="secondary" onClick={() => onEdit(permission)}>
              Edit details
            </Button>
          </>
        ) : undefined
      }
    >
      <section>
        <h3 className="m-0 mb-1 text-[13px] font-semibold text-foreground">
          In permission groups
        </h3>
        <p className="m-0 mb-3 text-xs text-muted-foreground">
          A permission is only granted through a group. Open a group to add or
          remove it.
        </p>
        {containing.isLoading ? (
          <Skeleton className="h-8" />
        ) : containing.error ? (
          <p className="m-0 text-xs text-muted-foreground">
            Couldn&apos;t load. {containing.error}
          </p>
        ) : (containing.data ?? []).length === 0 ? (
          <p className="m-0 rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
            Not in any group yet, so nobody has it.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {(containing.data ?? []).map((group) => (
              <button
                key={group.group_hash}
                type="button"
                onClick={() => onOpenGroup(group.group_hash)}
                className="rounded border border-border bg-secondary/60 px-2 py-0.5 text-xs text-foreground hover:border-input"
              >
                {group.group_display_name}
              </button>
            ))}
          </div>
        )}
      </section>
      <section>
        <h3 className="m-0 mb-2 text-[13px] font-semibold text-foreground">
          Details
        </h3>
        <FactList
          facts={[
            {
              label: 'Permission ID',
              value: permission.permission_hash,
              mono: true,
            },
            { label: 'Created', value: formatDateTime(permission.created_at) },
            {
              label: 'Updated',
              value: formatDateTime(permission.updated_at, 'Never'),
            },
          ]}
        />
      </section>
    </DetailSheet>
  );
}

/** Permissions: the strings apps check. Grouped into permission groups to be granted. */
export function PermissionsPanel({
  catalog,
  canEdit,
  onOpenGroup,
  createOpen,
  onCreateOpenChange,
}: PermissionsPanelProps): React.JSX.Element {
  const { showToast } = useToast();
  const { permissions, permissionGroups, permissionCategories } = catalog;
  const [category, setCategory] = useState(ALL);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GlobalPermission | null>(null);
  const [editing, setEditing] = useState<GlobalPermission | null>(null);
  const [deleting, setDeleting] = useState<GlobalPermission | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const all = permissions.data;
  const list = useMemo(
    () =>
      category === ALL
        ? (all ?? [])
        : (all ?? []).filter(
            (permission) => permission.permission_category === category
          ),
    [all, category]
  );

  const columns = useMemo<DataViewColumn<GlobalPermission>[]>(
    () => [
      {
        key: 'permission_name',
        header: 'Permission',
        render: (_value, permission) => (
          <div className="min-w-0">
            <div className="truncate font-mono text-[13px] text-foreground">
              {permission.permission_name}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {permission.permission_display_name}
            </div>
          </div>
        ),
      },
      {
        key: 'permission_category',
        header: 'Category',
        width: '160px',
        render: (_value, permission) => (
          <Badge variant="secondary" size="sm">
            {permission.permission_category}
          </Badge>
        ),
      },
      {
        key: 'permission_description',
        header: 'Description',
        hideOnMobile: true,
        render: (_value, permission) => (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {permission.permission_description || '—'}
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
      await globalRolesService.deletePermission(deleting.permission_hash);
      showToast(`Deleted ${deleting.permission_name}.`, 'success');
      if (selected?.permission_hash === deleting.permission_hash)
        setSelected(null);
      setDeleting(null);
      await permissions.refetch();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The permission could not be deleted.',
        'error'
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  if (permissions.error && !permissions.data) {
    return (
      <ErrorState
        title="Permissions could not be loaded"
        message={permissions.error}
        onRetry={() => void permissions.refetch()}
      />
    );
  }

  return (
    <>
      <DataView<GlobalPermission>
        data={list}
        columns={columns}
        keyExtractor={(permission) => permission.permission_hash}
        showSearch
        enableLocalSearch
        searchKeys={[
          'permission_name',
          'permission_display_name',
          'permission_description',
          'permission_category',
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permissions"
        toolbarFilters={
          permissionCategories.length > 1 ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                className="h-8 w-44 text-[13px]"
                aria-label="Filter by category"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {permissionCategories.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : undefined
        }
        onRowClick={setSelected}
        isLoading={permissions.isLoading}
        skeletonRows={6}
        emptyIcon={<KeyRound className="h-8 w-8" />}
        emptyMessage={
          search || category !== ALL
            ? 'No permissions match'
            : 'No permissions yet'
        }
        emptyDescription={
          search || category !== ALL
            ? undefined
            : 'Define the permission strings your apps check.'
        }
        caption="Permissions"
      />

      <PermissionSheet
        key={selected?.permission_hash ?? 'none'}
        permission={selected}
        groups={permissionGroups.data ?? NO_GROUPS}
        canEdit={canEdit}
        onClose={() => setSelected(null)}
        onEdit={setEditing}
        onDelete={setDeleting}
        onOpenGroup={(hash) => {
          setSelected(null);
          onOpenGroup(hash);
        }}
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
          editing ? `Edit ${editing.permission_name}` : 'Create permission'
        }
        description={
          editing
            ? 'Update how this permission is described.'
            : 'Add it to a permission group so it can be granted.'
        }
        fields={fields(permissionCategories)}
        initialValues={toValues(editing)}
        submitLabel={editing ? 'Save changes' : 'Create permission'}
        successMessage={editing ? 'Permission updated.' : 'Permission created.'}
        onSubmit={async (values) => {
          if (editing) {
            const updated = await globalRolesService.updatePermission(
              editing.permission_hash,
              {
                permission_display_name: values.permission_display_name,
                permission_description: values.permission_description,
                permission_category: values.permission_category,
              }
            );
            if (selected?.permission_hash === updated.permission_hash)
              setSelected(updated);
          } else {
            await globalRolesService.createPermission({
              permission_name: values.permission_name,
              permission_display_name: values.permission_display_name,
              permission_category: values.permission_category,
              permission_description:
                values.permission_description || undefined,
            });
          }
          await permissions.refetch();
        }}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title={`Delete ${deleting?.permission_name ?? 'permission'}?`}
        message="It is removed from every permission group, so apps checking it will deny access."
        confirmText="Delete permission"
        confirmationPhrase={deleting?.permission_name}
        isLoading={deleteBusy}
      />
    </>
  );
}

export default PermissionsPanel;
