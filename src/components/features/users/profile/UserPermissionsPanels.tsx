import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, ShieldCheck, X } from 'lucide-react';
import { ConfirmDialog, EmptyState, Panel } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAsyncData, useToast } from '@/hooks';
import { globalRolesService } from '@/services/global-roles.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import { formatDate } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { User } from '@/types/auth.types';
import type {
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';
import type { AssignedPermissionGroup } from '@/types/permission-assignments.types';

interface UserPermissionsPanelsProps {
  user: User;
  canManage: boolean;
}

const NO_ROLE = '__none__';

function GlobalRolePanel({
  user,
  canManage,
}: UserPermissionsPanelsProps): React.JSX.Element {
  const { showToast } = useToast();
  const fetchRole = useCallback(
    () => globalRolesService.getUserRole(user.user_hash),
    [user.user_hash]
  );
  const role = useAsyncData(fetchRole);
  const fetchRoles = useCallback(() => globalRolesService.getRoles(), []);
  const roles = useAsyncData(fetchRoles, { enabled: canManage });
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string>(NO_ROLE);
  const [saving, setSaving] = useState(false);

  const startEditing = (): void => {
    setSelected(role.data?.role_hash ?? NO_ROLE);
    setEditing(true);
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      if (selected === NO_ROLE) {
        await globalRolesService.removeRoleFromUser(user.user_hash);
        showToast(`Removed the global role from ${user.username}.`, 'success');
      } else {
        await globalRolesService.assignRoleToUser(user.user_hash, selected);
        const name =
          roles.data?.find((r) => r.role_hash === selected)
            ?.role_display_name ?? 'the role';
        showToast(`${user.username} now has ${name}.`, 'success');
      }
      setEditing(false);
      await role.refetch();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The role could not be changed.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const current: GlobalRole | null = role.data;

  return (
    <Panel
      title="Global role"
      description="The only permission source embedded in a consumer's access token"
      actions={
        canManage && !editing ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={startEditing}
            disabled={role.isLoading}
          >
            {current ? 'Change role' : 'Assign role'}
          </Button>
        ) : undefined
      }
    >
      {role.isLoading ? (
        <Skeleton className="h-10 w-2/3" />
      ) : role.error ? (
        <p className="m-0 text-[13px] text-muted-foreground">
          The role could not be loaded. {role.error}
        </p>
      ) : editing ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={selected}
            onValueChange={setSelected}
            disabled={saving}
          >
            <SelectTrigger className="sm:w-72" aria-label="Global role">
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ROLE}>No global role</SelectItem>
              {(roles.data ?? []).map((r) => (
                <SelectItem key={r.role_hash} value={r.role_hash}>
                  {r.role_display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void save()}
              loading={saving}
              disabled={selected === (current?.role_hash ?? NO_ROLE)}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : current ? (
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`${ROUTES.PERMISSIONS}?tab=roles&role=${encodeURIComponent(current.role_hash)}`}
                className="text-[13px] font-medium text-foreground no-underline hover:underline"
              >
                {current.role_display_name}
              </Link>
              <span className="font-mono text-xs text-muted-foreground">
                {current.role_name}
              </span>
              {current.is_system_role && (
                <Badge variant="secondary" size="sm">
                  System
                </Badge>
              )}
              <Badge variant="info" size="sm">
                Priority {current.role_priority}
              </Badge>
            </div>
            {current.role_description && (
              <p className="m-0 mt-1 text-xs text-muted-foreground">
                {current.role_description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="m-0 text-[13px] text-muted-foreground">
          No global role assigned.
        </p>
      )}
    </Panel>
  );
}

function DirectPermissionGroupsPanel({
  user,
  canManage,
}: UserPermissionsPanelsProps): React.JSX.Element {
  const { showToast } = useToast();
  const fetchAssigned = useCallback(
    () =>
      permissionAssignmentsService.getUserDirectPermissionGroups(
        user.user_hash
      ),
    [user.user_hash]
  );
  const assigned = useAsyncData(fetchAssigned);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<AssignedPermissionGroup | null>(
    null
  );
  const [removeBusy, setRemoveBusy] = useState(false);

  const handleRemove = async (): Promise<void> => {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await permissionAssignmentsService.removePermissionGroupFromUser(
        user.user_hash,
        removing.group_hash
      );
      showToast(
        `Removed ${removing.group_display_name} from ${user.username}.`,
        'success'
      );
      setRemoving(null);
      await assigned.refetch();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The permission group could not be removed.',
        'error'
      );
    } finally {
      setRemoveBusy(false);
    }
  };

  const groups = assigned.data ?? [];

  return (
    <Panel
      title="Direct permission groups"
      description="Assigned to this user individually, on top of their role and groups"
      padding="none"
      actions={
        canManage ? (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            <Plus aria-hidden="true" />
            Assign
          </Button>
        ) : undefined
      }
    >
      {assigned.isLoading ? (
        <div className="space-y-2 px-5 py-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : assigned.error ? (
        <p className="m-0 px-5 py-4 text-[13px] text-muted-foreground">
          Assignments could not be loaded. {assigned.error}
        </p>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="No direct assignments"
          description="Most access should come from roles and groups."
          size="sm"
        />
      ) : (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {groups.map((group) => (
            <li
              key={group.group_hash}
              className="flex items-start gap-3 px-5 py-2.5"
            >
              <Layers
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {group.group_display_name}
                  </span>
                  <Badge variant="secondary" size="sm">
                    {group.group_category}
                  </Badge>
                </div>
                <p className="m-0 truncate text-xs text-muted-foreground">
                  {group.notes
                    ? `“${group.notes}”`
                    : group.group_description || group.group_name}
                  {group.assigned_at &&
                    ` · Assigned ${formatDate(group.assigned_at)}`}
                </p>
              </div>
              {canManage && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setRemoving(group)}
                  aria-label={`Remove ${group.group_display_name}`}
                >
                  <X aria-hidden="true" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AssignDirectPermissionGroupDialog
        open={adding}
        onOpenChange={setAdding}
        user={user}
        assignedHashes={groups.map((g) => g.group_hash)}
        onAssigned={() => void assigned.refetch()}
      />
      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void handleRemove()}
        variant="warning"
        title="Remove permission group?"
        message={`${user.username} keeps any permissions granted by their role or groups.`}
        confirmText="Remove"
        isLoading={removeBusy}
      />
    </Panel>
  );
}

function AssignDirectPermissionGroupDialog({
  open,
  onOpenChange,
  user,
  assignedHashes,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  assignedHashes: string[];
  onAssigned: () => void;
}): React.JSX.Element {
  const { showToast } = useToast();
  const fetchGroups = useCallback(
    () => globalRolesService.getPermissionGroups(),
    []
  );
  const catalog = useAsyncData(fetchGroups, { enabled: open });
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const available = useMemo<GlobalPermissionGroup[]>(
    () =>
      (catalog.data ?? []).filter(
        (group) => !assignedHashes.includes(group.group_hash)
      ),
    [catalog.data, assignedHashes]
  );

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelected('');
      setNotes('');
    }
  }

  const submit = async (): Promise<void> => {
    if (!selected) return;
    setSaving(true);
    try {
      await permissionAssignmentsService.assignPermissionGroupToUser(
        user.user_hash,
        selected,
        notes
      );
      showToast(`Permission group assigned to ${user.username}.`, 'success');
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The permission group could not be assigned.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Assign a permission group</DialogTitle>
          <DialogDescription>
            Grant {user.username} a permission group directly.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor="direct-pg">Permission group</Label>
          <Select
            value={selected}
            onValueChange={setSelected}
            disabled={catalog.isLoading || saving}
          >
            <SelectTrigger id="direct-pg">
              <SelectValue
                placeholder={
                  catalog.isLoading ? 'Loading…' : 'Choose a permission group'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {available.map((group) => (
                <SelectItem key={group.group_hash} value={group.group_hash}>
                  {group.group_display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!catalog.isLoading && available.length === 0 && (
            <p className="m-0 text-xs text-muted-foreground">
              Every permission group is already assigned.
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="direct-pg-notes">Reason (optional)</Label>
          <Textarea
            id="direct-pg-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            placeholder="Why does this user need it?"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            loading={saving}
            disabled={!selected}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProjectPermissionsPanel({
  user,
}: {
  user: User;
}): React.JSX.Element | null {
  const projects = (user.projects ?? []).filter(
    (project) =>
      (project.effective_permissions?.length ??
        project.permissions?.length ??
        0) > 0
  );
  if (projects.length === 0) return null;
  return (
    <Panel
      title="Effective permissions by project"
      description="What the user can do in each project they can reach"
    >
      <div className="space-y-3">
        {projects.map((project) => {
          const permissions =
            project.effective_permissions ?? project.permissions ?? [];
          return (
            <div key={project.project_hash}>
              <div className="mb-1.5 text-[13px] font-medium text-foreground">
                {project.project_name}
              </div>
              <div className="flex flex-wrap gap-1">
                {permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded border border-border bg-secondary/60 px-1.5 py-px font-mono text-[11px] text-foreground"
                  >
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** Where the user's permissions come from: global role, direct groups, per-project result. */
export function UserPermissionsPanels({
  user,
  canManage,
}: UserPermissionsPanelsProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlobalRolePanel user={user} canManage={canManage} />
        <DirectPermissionGroupsPanel user={user} canManage={canManage} />
      </div>
      <ProjectPermissionsPanel user={user} />
    </div>
  );
}

export default UserPermissionsPanels;
