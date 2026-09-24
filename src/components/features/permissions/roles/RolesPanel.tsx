import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  ConfirmDialog,
  DataView,
  ErrorState,
  type DataViewColumn,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { globalRolesService } from '@/services/global-roles.service';
import { useToast } from '@/hooks';
import type { AccessCatalog } from '@/hooks/useAccessCatalog';
import type { GlobalRole } from '@/types/global-roles.types';
import {
  AccessFormDialog,
  type AccessFormField,
  type AccessFormValues,
} from '../shared/AccessFormDialog';
import { RoleSheet } from './RoleSheet';

interface RolesPanelProps {
  catalog: AccessCatalog;
  canEdit: boolean;
  /** Controlled selection so a role can be deep-linked with `?role=`. */
  selectedHash: string | null;
  onSelect: (roleHash: string | null) => void;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

const FIELDS: AccessFormField[] = [
  {
    key: 'role_display_name',
    label: 'Display name',
    required: true,
    placeholder: 'Support agent',
  },
  {
    key: 'role_name',
    label: 'Name',
    required: true,
    immutableOnEdit: true,
    monospace: true,
    placeholder: 'support_agent',
    hint: 'Machine name used by apps. It can’t be changed later.',
  },
  { key: 'role_description', label: 'Description', kind: 'textarea' },
  {
    key: 'role_priority',
    label: 'Priority',
    kind: 'number',
    min: 0,
    max: 100,
    hint: 'Sort order from 0 to 100, higher first. It doesn’t change what the role grants.',
  },
];

function toValues(role: GlobalRole | null): AccessFormValues {
  return {
    role_display_name: role?.role_display_name ?? '',
    role_name: role?.role_name ?? '',
    role_description: role?.role_description ?? '',
    role_priority: String(role?.role_priority ?? 50),
  };
}

/** Global roles: list, create/edit/delete, and the detail sheet. */
export function RolesPanel({
  catalog,
  canEdit,
  selectedHash,
  onSelect,
  createOpen,
  onCreateOpenChange,
}: RolesPanelProps): React.JSX.Element {
  const { showToast } = useToast();
  const { roles, permissionGroups } = catalog;
  const [editing, setEditing] = useState<GlobalRole | null>(null);
  const [deleting, setDeleting] = useState<GlobalRole | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [search, setSearch] = useState('');

  const list = roles.data ?? [];
  const selected = list.find((role) => role.role_hash === selectedHash) ?? null;

  const columns = useMemo<DataViewColumn<GlobalRole>[]>(
    () => [
      {
        key: 'role_display_name',
        header: 'Role',
        render: (_value, role) => (
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-foreground">
              {role.role_display_name}
            </div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {role.role_name}
            </div>
          </div>
        ),
      },
      {
        key: 'role_description',
        header: 'Description',
        hideOnMobile: true,
        render: (_value, role) => (
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {role.role_description || '—'}
          </span>
        ),
      },
      {
        key: 'is_system_role',
        header: 'Type',
        width: '100px',
        render: (_value, role) =>
          role.is_system_role ? (
            <Badge variant="secondary" size="sm">
              System
            </Badge>
          ) : (
            <Badge variant="outline" size="sm">
              Custom
            </Badge>
          ),
      },
      {
        key: 'role_priority',
        header: 'Priority',
        width: '90px',
        align: 'right',
        render: (_value, role) => (
          <span className="font-mono text-xs tabular-nums">
            {role.role_priority}
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
      await globalRolesService.deleteRole(deleting.role_hash);
      showToast(`Deleted ${deleting.role_display_name}.`, 'success');
      if (selectedHash === deleting.role_hash) onSelect(null);
      setDeleting(null);
      await roles.refetch();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The role could not be deleted.',
        'error'
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  if (roles.error && !roles.data) {
    return (
      <ErrorState
        title="Roles could not be loaded"
        message={roles.error}
        onRetry={() => void roles.refetch()}
      />
    );
  }

  return (
    <>
      <DataView<GlobalRole>
        data={list}
        columns={columns}
        keyExtractor={(role) => role.role_hash}
        showSearch
        enableLocalSearch
        searchKeys={['role_display_name', 'role_name', 'role_description']}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search roles"
        onRowClick={(role) => onSelect(role.role_hash)}
        isLoading={roles.isLoading}
        skeletonRows={5}
        emptyIcon={<ShieldCheck className="h-8 w-8" />}
        emptyMessage={search ? 'No roles match your search' : 'No roles yet'}
        emptyDescription={
          search
            ? undefined
            : 'Create a role, then add permission groups to it.'
        }
        caption="Global roles"
      />

      <RoleSheet
        role={selected}
        open={selected !== null}
        onOpenChange={(open) => !open && onSelect(null)}
        permissionGroups={permissionGroups.data ?? []}
        canEdit={canEdit}
        onEdit={setEditing}
        onDelete={setDeleting}
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
        title={editing ? `Edit ${editing.role_display_name}` : 'Create role'}
        description={
          editing
            ? 'Update how this role is shown to operators.'
            : 'A new role grants nothing until you add permission groups.'
        }
        fields={FIELDS}
        initialValues={toValues(editing)}
        submitLabel={editing ? 'Save changes' : 'Create role'}
        successMessage={editing ? 'Role updated.' : 'Role created.'}
        onSubmit={async (values) => {
          const priority = values.role_priority
            ? Number(values.role_priority)
            : undefined;
          if (editing) {
            await globalRolesService.updateRole(editing.role_hash, {
              role_display_name: values.role_display_name,
              role_description: values.role_description,
              role_priority: priority,
            });
          } else {
            const created = await globalRolesService.createRole({
              role_name: values.role_name,
              role_display_name: values.role_display_name,
              role_description: values.role_description || undefined,
              role_priority: priority,
            });
            onSelect(created.role_hash);
          }
          await roles.refetch();
        }}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => void confirmDelete()}
        title={`Delete ${deleting?.role_display_name ?? 'role'}?`}
        message="Users who hold this role lose the permissions it grants. The role name stays reserved."
        confirmText="Delete role"
        confirmationPhrase={deleting?.role_name}
        isLoading={deleteBusy}
      />
    </>
  );
}

export default RolesPanel;
