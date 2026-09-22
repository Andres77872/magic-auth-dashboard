/**
 * Searchable multi-select picker for binding projects to an OAuth connection.
 *
 * Modelled directly on `features/billing/BillingAttachProjectsModal`: debounced
 * server-side search with an instant client-side overlay, a scrollable `divide-y`
 * list of fully clickable rows, a sequential loop of per-item calls, per-row result
 * badges, one aggregate toast per bucket, and the modal staying open when anything
 * failed so the badges explaining why remain visible.
 *
 * One deliberate difference from billing: a project may hold SEVERAL bindings
 * (Google *and* GitHub), so the conflict case is "this project already reaches this
 * provider type through another connection", which `uk_project_oauth_key` forbids.
 * That gets its own badge instead of a generic failure.
 *
 * New bindings are created with safe defaults — disabled, no provisioning, deny —
 * and with no URLs, so the success summary must say that a redirect URI and a return
 * origin are still required before anyone can sign in.
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common';
import { projectService } from '@/services';
import { oauthService } from '@/services/oauth.service';
import { useToast } from '@/hooks';
import { cn } from '@/lib/utils';
import { isBindingConflict, providerTypeLabel } from './oauth-status';

interface AvailableProject {
  project_hash: string;
  project_name: string;
  project_description?: string | null;
}

type RowResult = 'assigned' | 'conflict' | 'error';

export interface OAuthAssignProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after at least one binding is created so the parent can refetch. */
  onSuccess: () => void;
  connectionHash: string;
  connectionName: string;
  providerType: string;
  /** Hashes already bound to THIS connection — excluded from the picker. */
  boundProjectHashes: string[];
}

const PROJECT_FETCH_LIMIT = 500;

function RowStatusBadge({ status }: { status: RowResult }): React.JSX.Element {
  switch (status) {
    case 'assigned':
      return <Badge variant="success">Assigned</Badge>;
    case 'conflict':
      return <Badge variant="warning">Already uses another connection</Badge>;
    case 'error':
      return <Badge variant="destructive">Failed</Badge>;
  }
}

export function OAuthAssignProjectsModal({
  isOpen,
  onClose,
  onSuccess,
  connectionHash,
  connectionName,
  providerType,
  boundProjectHashes,
}: OAuthAssignProjectsModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const [availableProjects, setAvailableProjects] = useState<AvailableProject[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rowStatus, setRowStatus] = useState<Record<string, RowResult>>({});
  // `null` means "untouched", so the default can follow `providerType` without an
  // effect that writes prop-derived state.
  const [connectionKeyInput, setConnectionKeyInput] = useState<string | null>(null);
  const connectionKey = connectionKeyInput ?? providerType;
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(false);

  const boundSet = useMemo(() => new Set(boundProjectHashes), [boundProjectHashes]);

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
              .filter((project) => !boundSet.has(project.project_hash))
              .map((project) => ({
                project_hash: project.project_hash,
                project_name: project.project_name,
                project_description: project.project_description,
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
    [boundSet, showToast],
  );

  // Reset transient state each time the modal opens. Done with the "adjust state
  // during render" pattern instead of an effect so it does not cascade a render.
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSelected([]);
      setRowStatus({});
      setSearchTerm('');
      setConnectionKeyInput(null);
      setKeyError(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return undefined;
    const delay = searchTerm ? 300 : 0;
    const handle = setTimeout(() => void fetchProjects(searchTerm.trim()), delay);
    return (): void => clearTimeout(handle);
  }, [isOpen, searchTerm, fetchProjects]);

  // Instant client-side overlay between a keystroke and the debounced server refetch.
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return availableProjects;
    return availableProjects.filter(
      (project) =>
        project.project_name.toLowerCase().includes(term) ||
        (project.project_description?.toLowerCase().includes(term) ?? false),
    );
  }, [availableProjects, searchTerm]);

  const toggle = (hash: string): void => {
    setSelected((previous) =>
      previous.includes(hash) ? previous.filter((item) => item !== hash) : [...previous, hash],
    );
  };

  const validateForm = (): boolean => {
    const key = connectionKey.trim().toLowerCase();
    if (!key) {
      setKeyError('A connection key is required');
      return false;
    }
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(key)) {
      setKeyError('Use lowercase letters, digits, hyphens and underscores');
      return false;
    }
    setKeyError(null);
    return true;
  };

  const handleAssign = async (): Promise<void> => {
    if (selected.length === 0) return;
    if (!validateForm()) return;

    const key = connectionKey.trim().toLowerCase();
    setIsAssigning(true);
    let assigned = 0;
    let conflict = 0;
    let failed = 0;

    for (const hash of selected) {
      try {
        // Safe defaults: the binding exists but grants nothing until it is configured.
        await oauthService.upsertBinding(hash, key, {
          connection_hash: connectionHash,
          enabled: false,
          login_enabled: true,
          link_enabled: true,
          provisioning_mode: 'disabled',
          existing_user_policy: 'deny',
        });
        assigned += 1;
        setRowStatus((previous) => ({ ...previous, [hash]: 'assigned' }));
      } catch (err) {
        if (isBindingConflict(err)) {
          conflict += 1;
          setRowStatus((previous) => ({ ...previous, [hash]: 'conflict' }));
        } else {
          failed += 1;
          setRowStatus((previous) => ({ ...previous, [hash]: 'error' }));
        }
      }
    }

    setIsAssigning(false);
    setSelected([]);

    if (assigned > 0) {
      showToast(
        `Assigned ${assigned} project${assigned === 1 ? '' : 's'} — each still needs a redirect URI and a return origin before sign-in works`,
        'success',
      );
      onSuccess();
    }
    if (conflict > 0) {
      showToast(
        `${conflict} project${conflict === 1 ? '' : 's'} already use another ${providerTypeLabel(providerType)} connection`,
        'warning',
      );
    }
    if (failed > 0) {
      showToast(`Failed to assign ${failed} project${failed === 1 ? '' : 's'}`, 'error');
    }

    // Clean exit only when everything succeeded; otherwise stay open so the inline
    // badges explaining which projects conflicted remain visible.
    if (conflict === 0 && failed === 0) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isAssigning && !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Assign projects to {connectionName}</DialogTitle>
          <DialogDescription>
            Each selected project gets a binding to this connection. New bindings are created
            DISABLED with no provisioning — add a redirect URI and a return origin, then enable
            the provider on the project&apos;s sign-in tab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="oauth-connection-key">Connection key</Label>
            <Input
              id="oauth-connection-key"
              value={connectionKey}
              onChange={(event) => {
                setConnectionKeyInput(event.target.value);
                if (keyError) setKeyError(null);
              }}
              error={keyError || undefined}
              helperText="The slug used in sign-in URLs for every selected project. Defaults to the provider type."
              disabled={isAssigning}
              fullWidth
            />
          </div>

          <Input
            type="text"
            placeholder="Search projects by name…"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
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
                    : 'Every project is already bound to this connection.'
                }
                size="sm"
              />
            ) : (
              <div className="divide-y">
                {filteredProjects.map((project) => {
                  const status = rowStatus[project.project_hash];
                  const locked = status === 'assigned' || status === 'conflict';
                  const isSelected = selected.includes(project.project_hash);
                  return (
                    <div
                      key={project.project_hash}
                      className={cn(
                        'flex items-center gap-3 p-3 transition-colors',
                        locked || isAssigning ? 'cursor-default' : 'cursor-pointer',
                        isSelected && 'bg-primary/5',
                        !isSelected && !locked && !isAssigning && 'hover:bg-accent/50',
                        locked && 'opacity-80',
                      )}
                      onClick={() => !locked && !isAssigning && toggle(project.project_hash)}
                    >
                      {/* Stop propagation so a click on the checkbox toggles once (via
                          onCheckedChange) instead of also firing the row's onClick. */}
                      <span className="flex" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggle(project.project_hash)}
                          disabled={locked || isAssigning}
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
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleAssign()}
            disabled={selected.length === 0 || isAssigning}
            loading={isAssigning}
          >
            Assign{selected.length > 0 ? ` (${selected.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OAuthAssignProjectsModal;
