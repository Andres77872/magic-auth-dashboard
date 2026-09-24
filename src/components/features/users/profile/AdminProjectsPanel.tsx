import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, X } from 'lucide-react';
import { ConfirmDialog, EmptyState, Panel } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncData, useToast, useUserType } from '@/hooks';
import { userService } from '@/services/user.service';
import { formatDate } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type { User } from '@/types/auth.types';
import type { AdminAssignedProject } from '@/types/user.types';

interface AdminProjectsPanelProps {
  user: User;
}

/**
 * Projects an admin manages (`GET /user-types/admin/{hash}/projects`, root
 * only). Assignment itself is membership of the project's `admin_…` group,
 * managed from the project page.
 */
export function AdminProjectsPanel({
  user,
}: AdminProjectsPanelProps): React.JSX.Element | null {
  const { isRoot } = useUserType();
  const { showToast } = useToast();
  const fetchProjects = useCallback(
    () => userService.getAdminProjects(user.user_hash),
    [user.user_hash]
  );
  const projects = useAsyncData(fetchProjects, { enabled: isRoot });
  const [removing, setRemoving] = useState<AdminAssignedProject | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isRoot) return null;

  const handleRemove = async (): Promise<void> => {
    if (!removing) return;
    setBusy(true);
    try {
      await userService.removeAdminFromProject(
        user.user_hash,
        removing.project_id
      );
      showToast(
        `${user.username} no longer administers ${removing.project_name}.`,
        'success'
      );
      setRemoving(null);
      await projects.refetch();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'The assignment could not be removed.',
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  const list = projects.data?.assigned_projects ?? [];

  return (
    <Panel
      title="Administered projects"
      description="Add admins from a project's Overview tab, under Administrators"
      padding="none"
    >
      {projects.isLoading ? (
        <div className="space-y-2 px-5 py-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : projects.error ? (
        <p className="m-0 px-5 py-4 text-[13px] text-muted-foreground">
          Assignments could not be loaded. {projects.error}
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="No projects assigned"
          description="This admin can sign in to the console but manages nothing yet."
          size="sm"
          action={
            <Button asChild variant="secondary" size="sm">
              <Link to={ROUTES.PROJECTS}>Open projects</Link>
            </Button>
          }
        />
      ) : (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {list.map((project) => (
            <li
              key={project.project_id}
              className="flex items-center gap-3 px-5 py-2.5"
            >
              <FolderKanban
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <Link
                  to={`${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}`}
                  className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
                >
                  {project.project_name}
                </Link>
                <span className="block truncate text-xs text-muted-foreground">
                  {project.assigned_at
                    ? `Assigned ${formatDate(project.assigned_at)}`
                    : 'Assigned'}
                  {project.assigned_by && ` by ${project.assigned_by}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setRemoving(project)}
                aria-label={`Stop administering ${project.project_name}`}
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={() => void handleRemove()}
        variant="warning"
        title={`Remove admin access to ${removing?.project_name ?? 'project'}?`}
        message={`${user.username} will no longer manage this project. Their user type stays Admin.`}
        confirmText="Remove access"
        isLoading={busy}
      />
    </Panel>
  );
}

export default AdminProjectsPanel;
