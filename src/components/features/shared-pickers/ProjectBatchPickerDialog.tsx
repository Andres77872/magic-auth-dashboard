/**
 * Searchable multi-select dialog that runs one API call per selected project
 * (attach to a billing group, bind to an OAuth connection, …).
 *
 * - Loads the caller's projects (`GET /projects`, up to 500 per request; the
 *   endpoint defaults to 10) with a debounced server-side search and an instant
 *   client-side filter between keystrokes.
 * - Runs the action sequentially and marks each row as done, conflict or failed.
 * - Stays open when anything did not succeed so the row badges explain why;
 *   closes itself after a fully successful run.
 *
 * Domain wording (toasts, badge labels) comes from the caller.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FolderOpen, Search, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { projectService } from '@/services/project.service';
import { cn } from '@/lib/utils';

/** `GET /projects` accepts at most 500 rows per page. */
export const PROJECT_PICKER_PAGE_SIZE = 500;

export type ProjectBatchRowResult = 'done' | 'conflict' | 'error';

export interface ProjectBatchSummary {
  done: number;
  conflict: number;
  failed: number;
}

export interface ProjectBatchPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  /** Projects to leave out (already attached / bound). */
  excludeProjectHashes: string[];
  /** Verb on the confirm button, e.g. "Attach" → "Attach (3)". */
  confirmLabel: string;
  /** Badge text per row outcome. */
  resultLabels: Record<ProjectBatchRowResult, string>;
  /** Shown when no project is left to pick. */
  emptyDescription: string;
  /** Extra fields rendered above the search box. */
  children?: React.ReactNode;
  /** Return false to stop before any call is made (e.g. invalid extra field). */
  validate?: () => boolean;
  /** Performs the action for one project; throw to mark the row as conflict/failed. */
  runForProject: (projectHash: string) => Promise<void>;
  /** Classifies a thrown error as a conflict rather than a failure. */
  isConflict: (error: unknown) => boolean;
  /** Called once per run with the outcome counts (toast and refetch here). */
  onComplete: (summary: ProjectBatchSummary) => void;
  /** Optional extra reporting when the project list can't be loaded (the dialog also shows it inline). */
  onLoadError?: (message: string) => void;
}

interface PickerProject {
  project_hash: string;
  project_name: string;
  project_description?: string | null;
}

const BADGE_VARIANT: Record<
  ProjectBatchRowResult,
  'success' | 'warning' | 'destructive'
> = {
  done: 'success',
  conflict: 'warning',
  error: 'destructive',
};

export function ProjectBatchPickerDialog({
  isOpen,
  onClose,
  title,
  description,
  excludeProjectHashes,
  confirmLabel,
  resultLabels,
  emptyDescription,
  children,
  validate,
  runForProject,
  isConflict,
  onComplete,
  onLoadError,
}: ProjectBatchPickerDialogProps): React.JSX.Element {
  const [projects, setProjects] = useState<PickerProject[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rowStatus, setRowStatus] = useState<
    Record<string, ProjectBatchRowResult>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const excluded = useMemo(
    () => new Set(excludeProjectHashes),
    [excludeProjectHashes]
  );
  // Kept in a ref so an inline callback from the parent doesn't refetch on every render.
  const onLoadErrorRef = useRef(onLoadError);
  useEffect(() => {
    onLoadErrorRef.current = onLoadError;
  }, [onLoadError]);

  // Reset transient state whenever the dialog opens (adjust-state-during-render,
  // so no extra effect pass).
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSelected([]);
      setRowStatus({});
      setSearchTerm('');
      setLoadError(null);
    }
  }

  const fetchProjects = useCallback(async (search: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await projectService.getProjects({
        limit: PROJECT_PICKER_PAGE_SIZE,
        search: search || undefined,
      });
      setProjects(
        response.projects.map((project) => ({
          project_hash: project.project_hash,
          project_name: project.project_name,
          project_description: project.project_description,
        }))
      );
      setLoadError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Please try again.';
      setLoadError(message);
      onLoadErrorRef.current?.(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handle = window.setTimeout(
      () => void fetchProjects(searchTerm.trim()),
      searchTerm ? 300 : 0
    );
    return () => window.clearTimeout(handle);
  }, [isOpen, searchTerm, fetchProjects]);

  const visibleProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter(
      (project) =>
        !excluded.has(project.project_hash) &&
        (!term ||
          project.project_name.toLowerCase().includes(term) ||
          (project.project_description?.toLowerCase().includes(term) ?? false))
    );
  }, [projects, excluded, searchTerm]);

  const toggle = (hash: string): void => {
    setSelected((previous) =>
      previous.includes(hash)
        ? previous.filter((item) => item !== hash)
        : [...previous, hash]
    );
  };

  const run = async (): Promise<void> => {
    if (selected.length === 0 || isRunning) return;
    if (validate && !validate()) return;

    setIsRunning(true);
    const summary: ProjectBatchSummary = { done: 0, conflict: 0, failed: 0 };
    for (const hash of selected) {
      try {
        await runForProject(hash);
        summary.done += 1;
        setRowStatus((previous) => ({ ...previous, [hash]: 'done' }));
      } catch (err) {
        const outcome: ProjectBatchRowResult = isConflict(err)
          ? 'conflict'
          : 'error';
        if (outcome === 'conflict') summary.conflict += 1;
        else summary.failed += 1;
        setRowStatus((previous) => ({ ...previous, [hash]: outcome }));
      }
    }
    setIsRunning(false);
    setSelected([]);
    onComplete(summary);
    if (summary.conflict === 0 && summary.failed === 0) onClose();
  };

  const reachedPageLimit = projects.length >= PROJECT_PICKER_PAGE_SIZE;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isRunning && onClose()}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {children}

          <Input
            type="search"
            placeholder="Search projects by name"
            aria-label="Search projects"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            leftIcon={<Search size={16} aria-hidden="true" />}
            rightIcon={
              searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <XCircle size={16} aria-hidden="true" />
                </button>
              ) : undefined
            }
            fullWidth
          />

          {selected.length > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {selected.length} project{selected.length === 1 ? '' : 's'}{' '}
                selected
              </span>
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setSelected([])}
                disabled={isRunning}
              >
                Clear selection
              </button>
            </div>
          )}

          <div
            className="max-h-[360px] overflow-y-auto rounded-md border border-border"
            aria-busy={isLoading}
          >
            {isLoading && projects.length === 0 ? (
              <ul className="m-0 list-none space-y-3 p-3" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                  </li>
                ))}
              </ul>
            ) : loadError && projects.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
                <p className="m-0 text-[13px] text-muted-foreground">
                  Projects could not be loaded. {loadError}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void fetchProjects(searchTerm.trim())}
                >
                  Try again
                </Button>
              </div>
            ) : visibleProjects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                title={
                  searchTerm
                    ? 'No projects match this search'
                    : 'No projects to add'
                }
                description={
                  searchTerm ? 'Try a different name.' : emptyDescription
                }
                size="sm"
              />
            ) : (
              <ul className="m-0 list-none divide-y divide-border p-0">
                {visibleProjects.map((project) => {
                  const status = rowStatus[project.project_hash];
                  const locked =
                    status === 'done' || status === 'conflict' || isRunning;
                  const isSelected = selected.includes(project.project_hash);
                  const checkboxId = `project-pick-${project.project_hash}`;
                  return (
                    <li
                      key={project.project_hash}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 transition-colors',
                        isSelected && 'bg-primary/5',
                        !locked && !isSelected && 'hover:bg-accent/50'
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={isSelected}
                        onCheckedChange={() => toggle(project.project_hash)}
                        disabled={locked}
                        aria-label={`Select ${project.project_name}`}
                      />
                      <label
                        htmlFor={checkboxId}
                        className={cn(
                          'min-w-0 flex-1',
                          locked ? 'cursor-default' : 'cursor-pointer'
                        )}
                      >
                        <span className="block truncate text-[13px] font-medium text-foreground">
                          {project.project_name}
                        </span>
                        {project.project_description && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {project.project_description}
                          </span>
                        )}
                      </label>
                      {status && (
                        <Badge variant={BADGE_VARIANT[status]} size="sm">
                          {resultLabels[status]}
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {reachedPageLimit && (
            <p className="m-0 text-xs text-muted-foreground">
              Showing the first {PROJECT_PICKER_PAGE_SIZE} projects. Search to
              find others.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isRunning}>
            Cancel
          </Button>
          <Button
            onClick={() => void run()}
            disabled={selected.length === 0}
            loading={isRunning}
          >
            {confirmLabel}
            {selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectBatchPickerDialog;
