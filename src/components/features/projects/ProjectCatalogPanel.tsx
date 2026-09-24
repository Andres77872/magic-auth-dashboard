import React, { useState } from 'react';
import { Info, Layers, Plus, Shield, Trash2 } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCatalogOptions,
  useProjectCatalog,
} from '@/hooks/useProjectDetails';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/formatters';
import type { CatalogMetadata } from '@/types/global-roles.types';
import { CatalogAddDialog, type CatalogOption } from './CatalogAddDialog';

interface ProjectCatalogPanelProps {
  projectHash: string;
  projectName: string;
}

type CatalogKind = 'role' | 'permission-group';

interface CatalogRow {
  hash: string;
  title: string;
  code: string;
  badge: string | null;
  description: string | null;
  purpose: string | null;
  notes: string | null;
  addedAt: string | null;
}

function RowsSkeleton(): React.JSX.Element {
  return (
    <ul className="m-0 list-none space-y-3 px-5 py-4" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <li key={index}>
          <Skeleton className="h-4 w-2/3" />
        </li>
      ))}
    </ul>
  );
}

function CatalogRows({
  rows,
  pendingKey,
  keyPrefix,
  onRemove,
}: {
  rows: CatalogRow[];
  pendingKey: string | null;
  keyPrefix: string;
  onRemove: (row: CatalogRow) => void;
}): React.JSX.Element {
  return (
    <ul className="m-0 list-none divide-y divide-border p-0">
      {rows.map((row) => (
        <li key={row.hash} className="flex items-start gap-3 px-5 py-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="truncate text-[13px] font-medium text-foreground">
                {row.title}
              </span>
              <code className="truncate font-mono text-[11px] text-muted-foreground">
                {row.code}
              </code>
              {row.badge && (
                <Badge variant="secondary" size="sm">
                  {row.badge}
                </Badge>
              )}
            </div>
            {row.description && (
              <p className="m-0 text-xs text-muted-foreground">
                {row.description}
              </p>
            )}
            {(row.purpose || row.notes) && (
              <p className="m-0 text-xs text-foreground">
                {row.purpose && <span>Purpose: {row.purpose}</span>}
                {row.purpose && row.notes && (
                  <span className="text-muted-foreground"> · </span>
                )}
                {row.notes && (
                  <span className="text-muted-foreground">{row.notes}</span>
                )}
              </p>
            )}
          </div>
          <span className="hidden shrink-0 pt-0.5 text-xs text-muted-foreground sm:inline">
            {row.addedAt ? `Added ${formatDate(row.addedAt)}` : null}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(row)}
            disabled={pendingKey === `${keyPrefix}:${row.hash}`}
            aria-label={`Remove ${row.title} from the catalog`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * The project's catalog: global roles and permission groups suggested to
 * operators for this project. It is UI metadata only and grants nothing.
 */
export function ProjectCatalogPanel({
  projectHash,
  projectName,
}: ProjectCatalogPanelProps): React.JSX.Element {
  const { showToast } = useToast();
  const catalog = useProjectCatalog(projectHash);
  // The add dialog keeps its kind while it animates closed.
  const [addDialog, setAddDialog] = useState<{
    open: boolean;
    kind: CatalogKind;
  }>({ open: false, kind: 'role' });
  const [removing, setRemoving] = useState<{
    kind: CatalogKind;
    row: CatalogRow;
  } | null>(null);
  const options = useCatalogOptions(addDialog.open);
  const openAdd = (kind: CatalogKind): void =>
    setAddDialog({ open: true, kind });

  const roleRows: CatalogRow[] = (catalog.catalog?.roles ?? []).map((role) => ({
    hash: role.role_hash,
    title: role.role_display_name || role.role_name,
    code: role.role_name,
    badge: role.is_system_role ? 'System' : null,
    description: role.role_description ?? null,
    purpose: role.catalog_purpose ?? null,
    notes: role.notes ?? null,
    addedAt: role.added_at ?? null,
  }));
  const groupRows: CatalogRow[] = (catalog.catalog?.permissionGroups ?? []).map(
    (group) => ({
      hash: group.group_hash,
      title: group.group_display_name || group.group_name,
      code: group.group_name,
      badge: group.group_category || null,
      description: group.group_description ?? null,
      purpose: group.catalog_purpose ?? null,
      notes: group.notes ?? null,
      addedAt: group.added_at ?? null,
    })
  );

  const roleOptions: CatalogOption[] = (options.options?.roles ?? [])
    .filter((role) => !roleRows.some((row) => row.hash === role.role_hash))
    .map((role) => ({
      hash: role.role_hash,
      label: role.role_display_name || role.role_name,
      hint: role.role_description ?? undefined,
    }));
  const groupOptions: CatalogOption[] = (
    options.options?.permissionGroups ?? []
  )
    .filter((group) => !groupRows.some((row) => row.hash === group.group_hash))
    .map((group) => ({
      hash: group.group_hash,
      label: `${group.group_display_name || group.group_name} (${group.group_category})`,
      hint: group.group_description ?? undefined,
    }));

  const handleAdd = async (
    hash: string,
    metadata: CatalogMetadata
  ): Promise<void> => {
    try {
      if (addDialog.kind === 'role') await catalog.addRole(hash, metadata);
      else await catalog.addPermissionGroup(hash, metadata);
      showToast('Added to the catalog.', 'success');
      setAddDialog((prev) => ({ ...prev, open: false }));
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The catalog could not be updated.',
        'error'
      );
      throw err;
    }
  };

  const confirmRemove = async (): Promise<void> => {
    if (!removing) return;
    try {
      if (removing.kind === 'role') await catalog.removeRole(removing.row.hash);
      else await catalog.removePermissionGroup(removing.row.hash);
      showToast(
        `${removing.row.title} is no longer suggested for this project.`,
        'success'
      );
      setRemoving(null);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The catalog could not be updated.',
        'error'
      );
    }
  };

  const loadError =
    catalog.error && !catalog.catalog ? (
      <div
        className="flex flex-col items-center gap-3 px-5 py-6 text-center"
        role="alert"
      >
        <p className="m-0 text-[13px] text-muted-foreground">
          The catalog could not be loaded. {catalog.error}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void catalog.refetch()}
          disabled={catalog.isRefreshing}
        >
          Try again
        </Button>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <p className="m-0 flex items-start gap-2 text-[13px] text-muted-foreground">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0 text-info"
          aria-hidden="true"
        />
        The catalog only suggests roles and permission groups to operators; it
        grants nothing. Access comes from global roles, user groups and direct
        assignments.
      </p>

      <Panel
        title="Suggested roles"
        description="Global roles operators should consider for this project’s users."
        actions={
          <Button variant="secondary" size="sm" onClick={() => openAdd('role')}>
            <Plus aria-hidden="true" />
            Add role
          </Button>
        }
        padding="none"
      >
        {catalog.isLoading ? (
          <RowsSkeleton />
        ) : (
          (loadError ??
          (roleRows.length === 0 ? (
            <EmptyState
              icon={<Shield />}
              title="No roles suggested"
              size="sm"
            />
          ) : (
            <CatalogRows
              rows={roleRows}
              keyPrefix="role"
              pendingKey={catalog.pending}
              onRemove={(row) => setRemoving({ kind: 'role', row })}
            />
          )))
        )}
      </Panel>

      <Panel
        title="Suggested permission groups"
        description="Permission groups commonly granted for this project."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAdd('permission-group')}
          >
            <Plus aria-hidden="true" />
            Add permission group
          </Button>
        }
        padding="none"
      >
        {catalog.isLoading ? (
          <RowsSkeleton />
        ) : (
          (loadError ??
          (groupRows.length === 0 ? (
            <EmptyState
              icon={<Layers />}
              title="No permission groups suggested"
              size="sm"
            />
          ) : (
            <CatalogRows
              rows={groupRows}
              keyPrefix="group"
              pendingKey={catalog.pending}
              onRemove={(row) => setRemoving({ kind: 'permission-group', row })}
            />
          )))
        )}
      </Panel>

      <CatalogAddDialog
        key={addDialog.kind}
        open={addDialog.open}
        onOpenChange={(open) => setAddDialog((prev) => ({ ...prev, open }))}
        kind={addDialog.kind}
        projectName={projectName}
        options={
          addDialog.kind === 'permission-group' ? groupOptions : roleOptions
        }
        isLoadingOptions={options.isLoading}
        optionsError={options.error}
        onRetryOptions={() => void options.refetch()}
        onAdd={handleAdd}
        isAdding={catalog.pending !== null && addDialog.open}
      />

      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void confirmRemove()}
        variant="warning"
        title="Remove from catalog?"
        message={
          removing
            ? `${removing.row.title} will no longer be suggested for ${projectName}. No one's access changes.`
            : ''
        }
        confirmText="Remove"
        isLoading={
          removing !== null &&
          catalog.pending ===
            `${removing.kind === 'role' ? 'role' : 'group'}:${removing.row.hash}`
        }
      />
    </div>
  );
}

export default ProjectCatalogPanel;
