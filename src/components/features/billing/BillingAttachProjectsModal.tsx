/**
 * Searchable multi-select picker for attaching projects to a billing group.
 *
 * Replaces the old "paste a project_hash" text field. Modeled on
 * features/groups/AddProjectsToGroupModal, with two billing-specific additions:
 *  - per-row result badges (attached / already-in-another-group / failed), since a project
 *    can belong to only ONE billing group and the backend rejects conflicts with HTTP 409;
 *  - debounced server-side search so projects past the 500-row fetch window stay findable.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common';
import { billingService, projectService } from '@/services';
import { useToast } from '@/hooks';
import { cn } from '@/lib/utils';
import { isAttachConflict } from './billing-status';

interface AvailableProject {
  project_hash: string;
  project_name: string;
  project_description?: string | null;
}

type RowResult = 'attached' | 'conflict' | 'error';

interface BillingAttachProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after at least one project is attached so the parent can refetch. */
  onSuccess: () => void;
  groupHash: string;
  groupName: string;
  /** Hashes already attached to THIS group — excluded from the picker. */
  attachedProjectHashes: string[];
}

const PROJECT_FETCH_LIMIT = 500;

function RowStatusBadge({ status }: { status: RowResult }): React.JSX.Element {
  switch (status) {
    case 'attached':
      return <Badge variant="success">Attached</Badge>;
    case 'conflict':
      return <Badge variant="warning">In another group</Badge>;
    case 'error':
      return <Badge variant="destructive">Failed</Badge>;
  }
}

export function BillingAttachProjectsModal({
  isOpen,
  onClose,
  onSuccess,
  groupHash,
  groupName,
  attachedProjectHashes,
}: BillingAttachProjectsModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rowStatus, setRowStatus] = useState<Record<string, RowResult>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const attachedSet = useMemo(() => new Set(attachedProjectHashes), [attachedProjectHashes]);

  const fetchProjects = useCallback(
    async (search: string): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await projectService.getProjects({
          limit: PROJECT_FETCH_LIMIT,
          search: search || undefined,
        });
        if (response.success && response.projects) {
          setAvailableProjects(
            response.projects
              .filter((p) => !attachedSet.has(p.project_hash))
              .map((p) => ({
                project_hash: p.project_hash,
                project_name: p.project_name,
                project_description: p.project_description,
              })),
          );
          setHasMore(Boolean(response.pagination?.has_more));
        } else {
          setAvailableProjects([]);
          setHasMore(false);
        }
      } catch {
        showToast('Failed to load available projects', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [attachedSet, showToast],
  );

  // Reset transient state each time the modal opens.
  useEffect(() => {
    if (isOpen) {
      setSelected([]);
      setRowStatus({});
      setSearchTerm('');
    }
  }, [isOpen]);

  // Fetch on open and whenever the (debounced) search term changes. An empty term loads the
  // first page immediately; a non-empty term hits the server so matches past the fetch window
  // are still discoverable.
  useEffect(() => {
    if (!isOpen) return undefined;
    const delay = searchTerm ? 300 : 0;
    const handle = setTimeout(() => void fetchProjects(searchTerm.trim()), delay);
    return () => clearTimeout(handle);
  }, [isOpen, searchTerm, fetchProjects]);

  // Instant client-side overlay between a keystroke and the debounced server refetch.
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableProjects;
    return availableProjects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(term) ||
        (p.project_description?.toLowerCase().includes(term) ?? false),
    );
  }, [availableProjects, searchTerm]);

  const toggle = (hash: string): void => {
    setSelected((prev) => (prev.includes(hash) ? prev.filter((h) => h !== hash) : [...prev, hash]));
  };

  const handleAttach = async (): Promise<void> => {
    if (selected.length === 0) return;
    setIsAttaching(true);
    let attached = 0;
    let conflict = 0;
    let failed = 0;

    for (const hash of selected) {
      try {
        await billingService.attachProject(groupHash, hash);
        attached += 1;
        setRowStatus((prev) => ({ ...prev, [hash]: 'attached' }));
      } catch (err) {
        if (isAttachConflict(err)) {
          conflict += 1;
          setRowStatus((prev) => ({ ...prev, [hash]: 'conflict' }));
        } else {
          failed += 1;
          setRowStatus((prev) => ({ ...prev, [hash]: 'error' }));
        }
      }
    }

    setIsAttaching(false);
    setSelected([]);

    if (attached > 0) {
      showToast(`Attached ${attached} project${attached === 1 ? '' : 's'}`, 'success');
      onSuccess();
    }
    if (conflict > 0) {
      showToast(
        `${conflict} project${conflict === 1 ? '' : 's'} already in another billing group`,
        'warning',
      );
    }
    if (failed > 0) {
      showToast(`Failed to attach ${failed} project${failed === 1 ? '' : 's'}`, 'error');
    }

    // Clean exit only when everything succeeded; otherwise stay open so the inline badges
    // explaining which projects conflicted remain visible.
    if (conflict === 0 && failed === 0) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isAttaching && !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Attach projects to {groupName}</DialogTitle>
          <DialogDescription>
            Search and select projects to bring under this billing group. A project can belong to
            only one billing group — any already in another group will be flagged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search projects by name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} />}
            rightIcon={
              searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <XCircle size={16} />
                </button>
              ) : undefined
            }
            disabled={isLoading && availableProjects.length === 0}
            fullWidth
          />

          {selected.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selected.length} project{selected.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setSelected([])}
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto rounded-md border">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" message="Loading projects…" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <EmptyState
                icon={<FolderOpen />}
                title={searchTerm ? 'No projects found' : 'No available projects'}
                description={
                  searchTerm
                    ? 'Try a different search term.'
                    : 'Every project is already attached to a billing group.'
                }
                size="sm"
              />
            ) : (
              <div className="divide-y">
                {filteredProjects.map((project) => {
                  const status = rowStatus[project.project_hash];
                  const locked = status === 'attached' || status === 'conflict';
                  const isSelected = selected.includes(project.project_hash);
                  return (
                    <div
                      key={project.project_hash}
                      className={cn(
                        'flex items-center gap-3 p-3 transition-colors',
                        locked || isAttaching ? 'cursor-default' : 'cursor-pointer',
                        isSelected && 'bg-primary/5',
                        !isSelected && !locked && !isAttaching && 'hover:bg-accent/50',
                        locked && 'opacity-80',
                      )}
                      onClick={() => !locked && !isAttaching && toggle(project.project_hash)}
                    >
                      {/* Stop propagation so a click on the checkbox toggles once (via
                          onCheckedChange) instead of also firing the row's onClick. */}
                      <span className="flex" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggle(project.project_hash)}
                          disabled={locked || isAttaching}
                          aria-label={`Select ${project.project_name}`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{project.project_name}</div>
                        {project.project_description && (
                          <div className="truncate text-sm text-muted-foreground">
                            {project.project_description}
                          </div>
                        )}
                      </div>
                      {status && <RowStatusBadge status={status} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {hasMore && (
            <p className="text-xs text-muted-foreground">
              Showing the first {PROJECT_FETCH_LIMIT} projects. Use search to find others.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAttaching}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleAttach()}
            disabled={selected.length === 0 || isAttaching}
            loading={isAttaching}
          >
            Attach{selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BillingAttachProjectsModal;
