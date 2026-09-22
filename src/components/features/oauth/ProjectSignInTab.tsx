/**
 * Project-first view of OAuth: "how do people sign in to this project, and why is
 * the button broken?".
 *
 * Mirror image of the connection detail's Projects tab. Per binding it shows the
 * policy editor, the two URL allow-lists and the server's readiness roll-up, plus a
 * link back to the connection. The primary action is a SINGLE-select dialog of
 * connections available to this project, grouped by provider type and showing each
 * connection's credential status, so nobody binds a connection whose secret was
 * never stored.
 *
 * Creating a connection is deliberately NOT possible from here: that is a root-only
 * action and this is an admin-level screen (doc 11, open question 3).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, KeyRound, Plus, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  CopyableId,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '@/components/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import { projectService } from '@/services';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type {
  OAuthBindingInfo,
  OAuthConnectionListItem,
  OAuthProjectReadinessEntry,
} from '@/types/oauth.types';
import type { UserGroup } from '@/types/group.types';
import { OAuthAllowedUrlList } from './OAuthAllowedUrlList';
import { OAuthBindingEditor } from './OAuthBindingEditor';
import { OAuthReadinessPanel } from './OAuthReadinessPanel';
import {
  connectionStatusVariant,
  credentialStatusVariant,
  bindingEffectiveState,
  providerTypeLabel,
} from './oauth-status';

export interface ProjectSignInTabProps {
  projectHash: string;
  projectName?: string;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function ProjectSignInTab({
  projectHash,
  projectName,
}: ProjectSignInTabProps): React.JSX.Element {
  const { showToast } = useToast();
  const [bindings, setBindings] = React.useState<OAuthBindingInfo[]>([]);
  const [readiness, setReadiness] = React.useState<OAuthProjectReadinessEntry[]>([]);
  const [oauthEnabled, setOauthEnabled] = React.useState(true);
  const [groups, setGroups] = React.useState<UserGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  const [showEnable, setShowEnable] = React.useState(false);
  const [pendingRemove, setPendingRemove] = React.useState<OAuthBindingInfo | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const reload = React.useCallback((): void => setVersion((value) => value + 1), []);

  React.useEffect(() => {
    if (!projectHash) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const [bindingsResponse, readinessResponse] = await Promise.all([
          oauthService.listProjectBindings(projectHash),
          oauthService.getProjectReadiness(projectHash),
        ]);
        if (active) {
          setBindings(bindingsResponse.bindings || []);
          setReadiness(readinessResponse.providers || []);
          setOauthEnabled(readinessResponse.oauth_enabled !== false);
          setError(null);
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load sign-in providers'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [projectHash, version]);

  // Default-group options come from the existing project groups endpoint, so the
  // selector can only offer groups that already reach this project.
  React.useEffect(() => {
    if (!projectHash) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const response = await projectService.getProjectGroups(projectHash, { limit: 200 });
        if (active) setGroups(response.user_groups || []);
      } catch {
        if (active) setGroups([]);
      } finally {
        if (active) setGroupsLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [projectHash]);

  const removeBinding = async (): Promise<void> => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await oauthService.deleteBinding(projectHash, pendingRemove.connection_key);
      showToast('Provider removed from this project', 'success');
      reload();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to remove provider'), 'error');
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Couldn’t load sign-in providers" message={error} onRetry={reload} />;
  }

  return (
    <div className="space-y-4">
      {!oauthEnabled && (
        <div
          role="alert"
          className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning"
        >
          OAuth is disabled for the whole deployment. No provider will work until it is switched
          on in the system settings.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold">Sign-in providers</h3>
          <p className="text-sm text-muted-foreground">
            Which OAuth connections this project uses, and what is still missing.
          </p>
        </div>
        <Button onClick={() => setShowEnable(true)}>
          <Plus size={16} className="mr-1" /> Enable a provider for this project
        </Button>
      </div>

      {bindings.length === 0 ? (
        <EmptyState
          icon={<KeyRound />}
          title="No sign-in providers"
          description="Enable an OAuth connection for this project, then add its redirect URI and return origin."
          action={
            <Button onClick={() => setShowEnable(true)}>
              <Plus size={16} className="mr-1" /> Enable a provider for this project
            </Button>
          }
        />
      ) : (
        bindings.map((binding) => {
          const effective = bindingEffectiveState(binding);
          const rollUp = readiness.find(
            (entry) => entry.connection_key === binding.connection_key,
          );
          return (
            <Card key={binding.connection_key}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{binding.connection_display_name}</CardTitle>
                  <Badge variant="secondary">{providerTypeLabel(binding.provider_type)}</Badge>
                  <Badge variant={effective.variant}>{effective.label}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {binding.connection_key}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`${ROUTES.OAUTH}/${binding.connection_hash}`}
                    className="inline-flex items-center gap-1 text-sm text-primary no-underline hover:underline"
                  >
                    Open connection <ExternalLink size={14} aria-hidden="true" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingRemove(binding)}
                    aria-label={`Remove ${binding.connection_display_name} from this project`}
                  >
                    <Trash2 size={14} className="mr-1" /> Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <OAuthReadinessPanel
                  checks={rollUp?.checks ?? binding.readiness}
                  ready={rollUp?.ready ?? binding.ready}
                  title="Why sign-in is or is not working"
                />
                <OAuthBindingEditor
                  binding={binding}
                  availableGroups={groups}
                  groupsLoading={groupsLoading}
                  onChanged={reload}
                />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Allowed URLs</div>
                  <OAuthAllowedUrlList
                    projectHash={projectHash}
                    connectionKey={binding.connection_key}
                    urls={binding.urls}
                    onChanged={reload}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      <EnableProviderDialog
        isOpen={showEnable}
        onClose={() => setShowEnable(false)}
        onSuccess={reload}
        projectHash={projectHash}
        projectName={projectName}
        boundConnectionHashes={bindings.map((binding) => binding.connection_hash)}
        usedConnectionKeys={bindings.map((binding) => binding.connection_key)}
      />

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => void removeBinding()}
        title="Remove sign-in provider"
        message="Remove this provider from the project? Users who sign in through it will lose access to this project immediately."
        confirmText="Remove"
        variant="danger"
        isLoading={removing}
      />
    </div>
  );
}

/**
 * Single-select dialog of connections available to this project (platform-owned plus
 * project-owned), grouped by provider type and showing each one's credential status.
 */
function EnableProviderDialog({
  isOpen,
  onClose,
  onSuccess,
  projectHash,
  projectName,
  boundConnectionHashes,
  usedConnectionKeys,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectHash: string;
  projectName?: string;
  boundConnectionHashes: string[];
  usedConnectionKeys: string[];
}): React.JSX.Element {
  const { showToast } = useToast();
  const [connections, setConnections] = React.useState<OAuthConnectionListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [connectionKey, setConnectionKey] = React.useState('');
  const [keyError, setKeyError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const boundSet = React.useMemo(() => new Set(boundConnectionHashes), [boundConnectionHashes]);
  const usedKeys = React.useMemo(() => new Set(usedConnectionKeys), [usedConnectionKeys]);

  // Reset the choice when the dialog opens, using "adjust state during render" so the
  // reset does not cascade an extra render pass.
  const [openedOnce, setOpenedOnce] = React.useState(false);
  if (isOpen !== openedOnce) {
    setOpenedOnce(isOpen);
    if (isOpen) {
      setSelected(null);
      setConnectionKey('');
      setKeyError(null);
      setLoading(true);
    }
  }

  React.useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const response = await oauthService.listConnections({ limit: 200 });
        if (!active) return;
        setConnections(
          (response.connections || []).filter(
            (item) =>
              !boundSet.has(item.connection_hash) &&
              (!item.owner_project_hash || item.owner_project_hash === projectHash),
          ),
        );
      } catch {
        if (!active) return;
        showToast('Failed to load OAuth connections', 'error');
        setConnections([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [isOpen, boundSet, projectHash, showToast]);

  const grouped = React.useMemo(() => {
    const byType = new Map<string, OAuthConnectionListItem[]>();
    connections.forEach((item) => {
      const list = byType.get(item.provider_type) ?? [];
      list.push(item);
      byType.set(item.provider_type, list);
    });
    return Array.from(byType.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [connections]);

  const selectedConnection = connections.find((item) => item.connection_hash === selected);

  const chooseConnection = (item: OAuthConnectionListItem): void => {
    setSelected(item.connection_hash);
    // Default the slug to the provider type, or a numbered variant when it is taken.
    let candidate = item.provider_type;
    let suffix = 2;
    while (usedKeys.has(candidate)) {
      candidate = `${item.provider_type}-${suffix}`;
      suffix += 1;
    }
    setConnectionKey(candidate);
    setKeyError(null);
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
    if (usedKeys.has(key)) {
      setKeyError('This project already uses that connection key');
      return false;
    }
    setKeyError(null);
    return true;
  };

  const enable = async (): Promise<void> => {
    if (!selected) return;
    if (!validateForm()) return;
    setSaving(true);
    try {
      await oauthService.upsertBinding(projectHash, connectionKey.trim().toLowerCase(), {
        connection_hash: selected,
        enabled: false,
        login_enabled: true,
        link_enabled: true,
        provisioning_mode: 'disabled',
        existing_user_policy: 'deny',
      });
      showToast(
        'Provider added — it stays disabled until a redirect URI and a return origin are set',
        'success',
      );
      onSuccess();
      onClose();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to enable provider'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !saving && !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Enable a provider{projectName ? ` for ${projectName}` : ''}</DialogTitle>
          <DialogDescription>
            Choose one connection. A connection whose secret was never stored cannot complete a
            sign-in, so its credential status is shown here.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" message="Loading connections…" />
            </div>
          ) : grouped.length === 0 ? (
            <EmptyState
              icon={<KeyRound />}
              title="No connection available"
              description="No OAuth connection is available to this project yet. A root administrator creates connections in the OAuth area."
              size="sm"
              action={
                <Link to={ROUTES.OAUTH} className="text-sm text-primary no-underline hover:underline">
                  Go to OAuth connections
                </Link>
              }
            />
          ) : (
            grouped.map(([providerType, items]) => (
              <div key={providerType} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {providerTypeLabel(providerType)}
                </div>
                <div className="divide-y rounded-md border border-border">
                  {items.map((item) => (
                    <label
                      key={item.connection_hash}
                      htmlFor={`enable-${item.connection_hash}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 p-3 text-sm transition-colors',
                        selected === item.connection_hash ? 'bg-primary/5' : 'hover:bg-accent/50',
                      )}
                    >
                      <input
                        id={`enable-${item.connection_hash}`}
                        type="radio"
                        name="oauth-enable-connection"
                        value={item.connection_hash}
                        checked={selected === item.connection_hash}
                        onChange={() => chooseConnection(item)}
                        disabled={saving}
                        className="h-4 w-4 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.display_name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {item.owner_project_hash ? 'project-owned' : 'platform'} ·{' '}
                          {item.scopes || 'catalog default scopes'}
                        </div>
                      </div>
                      <Badge variant={connectionStatusVariant(item.status)}>{item.status}</Badge>
                      <Badge variant={credentialStatusVariant(item.credential_status)}>
                        {item.credential_status}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}

          {selectedConnection && (
            <div className="space-y-1.5">
              <Label htmlFor="enable-connection-key">Connection key</Label>
              <Input
                id="enable-connection-key"
                value={connectionKey}
                onChange={(event) => {
                  setConnectionKey(event.target.value);
                  if (keyError) setKeyError(null);
                }}
                error={keyError || undefined}
                helperText="The slug that appears in this project's sign-in URLs."
                fullWidth
              />
              <p className="text-xs text-muted-foreground">
                Connection hash: <CopyableId id={selectedConnection.connection_hash} />
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void enable()} disabled={!selected || saving} loading={saving}>
            Enable provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectSignInTab;
