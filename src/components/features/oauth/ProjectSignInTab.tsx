/**
 * Project-first view of OAuth: "how do people sign in to this project, and why is
 * the button not working?". Rendered inside the project details page, which owns the
 * tab bar — so this uses stacked panels, with a segmented control per provider.
 *
 * Per binding: the server's readiness checks, the two URL allow-lists and the sign-in
 * policy. The primary action adds one connection available to this project; creating
 * connections is root-only and lives in the OAuth area.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  KeyRound,
  Plus,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { TabNavigation } from '@/components/common/TabNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  useOAuthConnections,
  useOAuthDefaultGroupOptions,
  useProjectOAuthBindings,
  type UseProjectOAuthBindingsReturn,
} from '@/hooks/useOAuthConnections';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/utils/routes';
import type {
  OAuthBindingInfo,
  OAuthConnectionListItem,
} from '@/types/oauth.types';
import type { UserGroup } from '@/types/group.types';
import { OAuthAllowedUrlList } from './OAuthAllowedUrlList';
import { OAuthBindingEditor } from './OAuthBindingEditor';
import { OAuthReadinessPanel } from './OAuthReadinessPanel';
import {
  allowListSummary,
  bindingEffectiveState,
  connectionStatusPresentation,
  credentialStatusPresentation,
  isBindingConflict,
  providerTypeLabel,
  validateConnectionKey,
} from './oauth-status';

export interface ProjectSignInTabProps {
  projectHash: string;
  projectName?: string;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

type BindingView = 'readiness' | 'urls' | 'policy';

interface BindingPanelProps {
  binding: OAuthBindingInfo;
  groups: UserGroup[];
  groupsLoading: boolean;
  actions: Pick<
    UseProjectOAuthBindingsReturn,
    'saveBinding' | 'addUrl' | 'removeUrl'
  >;
  onRemove: (binding: OAuthBindingInfo) => void;
}

function BindingPanel({
  binding,
  groups,
  groupsLoading,
  actions,
  onRemove,
}: BindingPanelProps): React.JSX.Element {
  const [view, setView] = React.useState<BindingView>('readiness');
  const effective = bindingEffectiveState(binding);
  const key = binding.connection_key;

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-center gap-2">
          {binding.connection_display_name}
          <Badge variant="secondary" size="sm">
            {providerTypeLabel(binding.provider_type)}
          </Badge>
          <Badge variant={effective.variant} size="sm">
            {effective.label}
          </Badge>
        </span>
      }
      description={
        <>
          Key <span className="font-mono text-foreground">{key}</span> ·{' '}
          {allowListSummary(binding)}
          {effective.blockedBy && <> · First blocker: {effective.blockedBy}</>}
        </>
      }
      actions={
        <>
          <TabNavigation
            variant="segmented"
            size="sm"
            ariaLabel={`${binding.connection_display_name} settings`}
            activeTab={view}
            onChange={(next) =>
              setView(next === 'urls' || next === 'policy' ? next : 'readiness')
            }
            tabs={[
              { id: 'readiness', label: 'Readiness' },
              { id: 'urls', label: 'URLs', count: binding.urls.length },
              { id: 'policy', label: 'Policy' },
            ]}
          />
          <Button asChild variant="ghost" size="sm">
            <Link
              to={`${ROUTES.OAUTH_CONNECTION}/${encodeURIComponent(binding.connection_hash)}`}
            >
              Open connection
              <ExternalLink aria-hidden="true" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(binding)}
            aria-label={`Remove ${binding.connection_display_name} from this project`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </>
      }
    >
      <div>
        {view === 'readiness' && (
          <OAuthReadinessPanel
            checks={binding.readiness}
            ready={binding.ready}
            title="Readiness checks"
          />
        )}
        {view === 'urls' && (
          <OAuthAllowedUrlList
            connectionKey={key}
            urls={binding.urls}
            onAdd={(request) => actions.addUrl(key, request)}
            onRemove={(urlId) => actions.removeUrl(key, urlId)}
          />
        )}
        {view === 'policy' && (
          <OAuthBindingEditor
            binding={binding}
            availableGroups={groups}
            groupsLoading={groupsLoading}
            onSave={(request) => actions.saveBinding(key, request)}
          />
        )}
      </div>
    </Panel>
  );
}

export function ProjectSignInTab({
  projectHash,
  projectName,
}: ProjectSignInTabProps): React.JSX.Element {
  const { showToast } = useToast();
  const oauth = useProjectOAuthBindings(projectHash);
  const { groups, isLoading: groupsLoading } =
    useOAuthDefaultGroupOptions(projectHash);
  const [showEnable, setShowEnable] = React.useState(false);
  const [pendingRemove, setPendingRemove] =
    React.useState<OAuthBindingInfo | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const {
    bindings,
    oauthEnabled,
    isLoading,
    isRefreshing,
    error,
    refetch,
    removeBinding,
  } = oauth;

  const confirmRemove = async (): Promise<void> => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await removeBinding(pendingRemove.connection_key);
      showToast(
        `${pendingRemove.connection_display_name} removed from this project`,
        'success'
      );
      setPendingRemove(null);
    } catch (err) {
      showToast(
        errorMessage(err, 'The provider could not be removed.'),
        'error'
      );
    } finally {
      setRemoving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="space-y-4"
        aria-busy="true"
        aria-label="Loading sign-in providers"
      >
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error && bindings.length === 0) {
    return (
      <ErrorState
        title="Sign-in providers could not be loaded"
        message={error}
        onRetry={() => void refetch()}
        isRetrying={isRefreshing}
      />
    );
  }

  const addButton = (
    <Button onClick={() => setShowEnable(true)}>
      <Plus aria-hidden="true" />
      Add provider
    </Button>
  );

  return (
    <div
      className={cn(
        'space-y-5 transition-opacity',
        isRefreshing && 'opacity-80'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-[15px] font-semibold text-foreground">
            Sign-in providers
          </h2>
          <p className="m-0 mt-0.5 text-xs text-muted-foreground">
            OAuth connections people can use to sign in to{' '}
            {projectName || 'this project'}, and what each still needs.
          </p>
        </div>
        {bindings.length > 0 && addButton}
      </div>

      {oauthEnabled === false && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-warning"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            OAuth is switched off for this deployment (OAUTH_ENABLED), so no
            provider works until it is turned on.
          </span>
        </div>
      )}

      {bindings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border">
          <EmptyState
            icon={<KeyRound />}
            title="No sign-in providers yet"
            description="Add an OAuth connection, then give it a redirect URI and a return origin."
            action={addButton}
            size="sm"
          />
        </div>
      ) : (
        bindings.map((binding) => (
          <BindingPanel
            key={binding.connection_key}
            binding={binding}
            groups={groups}
            groupsLoading={groupsLoading}
            actions={oauth}
            onRemove={setPendingRemove}
          />
        ))
      )}

      <EnableProviderDialog
        isOpen={showEnable}
        onClose={() => setShowEnable(false)}
        projectHash={projectHash}
        projectName={projectName}
        bindings={bindings}
        onEnable={oauth.enableConnection}
      />

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => void confirmRemove()}
        title={`Remove ${pendingRemove?.connection_display_name ?? 'provider'}?`}
        message={
          <>
            People can no longer sign in to {projectName || 'this project'} with
            it, and its allowed URLs are deleted. The connection itself is kept.
          </>
        }
        confirmText="Remove provider"
        isLoading={removing}
      />
    </div>
  );
}

interface EnableProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectHash: string;
  projectName?: string;
  bindings: OAuthBindingInfo[];
  onEnable: (connectionHash: string, connectionKey: string) => Promise<void>;
}

/** Suggests the provider type as the key, or a numbered variant when it is taken. */
function suggestKey(providerType: string, used: Set<string>): string {
  let candidate = providerType;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${providerType}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

/**
 * Single-select dialog of connections this project can use: shared ones, the project's
 * own, and (root only) other projects' connections. Archived connections can't be bound.
 */
function EnableProviderDialog({
  isOpen,
  onClose,
  projectHash,
  projectName,
  bindings,
  onEnable,
}: EnableProviderDialogProps): React.JSX.Element {
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const list = useOAuthConnections({ limit: 200, enabled: isOpen });
  const [selected, setSelected] = React.useState<string | null>(null);
  const [connectionKey, setConnectionKey] = React.useState('');
  const [keyError, setKeyError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const usedKeys = React.useMemo(
    () => new Set(bindings.map((binding) => binding.connection_key)),
    [bindings]
  );
  const boundConnections = React.useMemo(
    () => new Set(bindings.map((binding) => binding.connection_hash)),
    [bindings]
  );

  // Reset the choice each time the dialog opens (adjust state during render).
  const [wasOpen, setWasOpen] = React.useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSelected(null);
      setConnectionKey('');
      setKeyError(null);
    }
  }

  const available = React.useMemo(
    () =>
      list.connections.filter(
        (item) =>
          item.status !== 'archived' &&
          !boundConnections.has(item.connection_hash) &&
          // Admins may only bind shared connections or this project's own.
          (isRoot ||
            !item.owner_project_hash ||
            item.owner_project_hash === projectHash)
      ),
    [list.connections, boundConnections, isRoot, projectHash]
  );

  const grouped = React.useMemo(() => {
    const byType = new Map<string, OAuthConnectionListItem[]>();
    available.forEach((item) => {
      byType.set(item.provider_type, [
        ...(byType.get(item.provider_type) ?? []),
        item,
      ]);
    });
    return Array.from(byType.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [available]);

  const choose = (item: OAuthConnectionListItem): void => {
    setSelected(item.connection_hash);
    setConnectionKey(suggestKey(item.provider_type, usedKeys));
    setKeyError(null);
  };

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!selected) return;
    const key = connectionKey.trim().toLowerCase();
    const problem =
      validateConnectionKey(key) ??
      (usedKeys.has(key) ? 'This project already uses that key' : null);
    if (problem) {
      setKeyError(problem);
      return;
    }
    setSaving(true);
    try {
      await onEnable(selected, key);
      showToast(
        'Provider added. It stays off until it has a redirect URI and a return origin and is enabled.',
        'success'
      );
      onClose();
    } catch (err) {
      if (isBindingConflict(err))
        setKeyError(
          errorMessage(err, 'This key or connection is already in use.')
        );
      else
        showToast(
          errorMessage(err, 'The provider could not be added.'),
          'error'
        );
    } finally {
      setSaving(false);
    }
  };

  const hasMore = Boolean(list.pagination?.has_more);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !saving && !open && onClose()}
    >
      <DialogContent size="lg">
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className="contents"
        >
          <DialogHeader>
            <DialogTitle>
              Add a sign-in provider{projectName ? ` to ${projectName}` : ''}
            </DialogTitle>
            <DialogDescription>
              Choose one connection. A connection without stored credentials
              can&apos;t complete a sign-in until a root administrator stores
              them.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[420px] space-y-4 overflow-y-auto px-0.5">
            {list.isLoading ? (
              <div
                className="space-y-2"
                aria-busy="true"
                aria-label="Loading connections"
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : list.error && list.connections.length === 0 ? (
              <ErrorState
                variant="inline"
                size="sm"
                title="Connections could not be loaded"
                message={list.error}
                onRetry={() => void list.refetch()}
                isRetrying={list.isRefreshing}
              />
            ) : grouped.length === 0 ? (
              <EmptyState
                icon={<KeyRound />}
                title="No connection available"
                description="Every connection this project can use is already added, or none exists yet. Root administrators create connections in the OAuth area."
                size="sm"
                action={
                  <Button asChild variant="secondary" size="sm">
                    <Link to={ROUTES.OAUTH}>Go to OAuth</Link>
                  </Button>
                }
              />
            ) : (
              <div
                role="radiogroup"
                aria-label="Connection"
                className="space-y-4"
              >
                {grouped.map(([providerType, items]) => (
                  <div key={providerType} className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      {providerTypeLabel(providerType)}
                    </div>
                    <ul className="m-0 list-none divide-y divide-border rounded-md border border-border p-0">
                      {items.map((item) => {
                        const status = connectionStatusPresentation(
                          item.status
                        );
                        const credentials = credentialStatusPresentation(
                          item.credential_status
                        );
                        const inputId = `enable-${item.connection_hash}`;
                        return (
                          <li key={item.connection_hash}>
                            <label
                              htmlFor={inputId}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 px-3 py-2.5 text-[13px] transition-colors',
                                selected === item.connection_hash
                                  ? 'bg-primary/5'
                                  : 'hover:bg-accent/50'
                              )}
                            >
                              <input
                                id={inputId}
                                type="radio"
                                name="oauth-enable-connection"
                                value={item.connection_hash}
                                checked={selected === item.connection_hash}
                                onChange={() => choose(item)}
                                disabled={saving}
                                className="h-4 w-4 accent-primary"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                  {item.display_name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {item.owner_project_hash
                                    ? `Owned by ${item.owner_project_name || 'another project'}`
                                    : 'Shared'}
                                  {item.scopes ? ` · ${item.scopes}` : ''}
                                </span>
                              </span>
                              <Badge variant={status.variant} size="sm">
                                {status.label}
                              </Badge>
                              <Badge variant={credentials.variant} size="sm">
                                {`Credentials ${credentials.label.toLowerCase()}`}
                              </Badge>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {hasMore && (
                  <p className="m-0 text-xs text-muted-foreground">
                    Showing the first 200 connections.
                  </p>
                )}
              </div>
            )}

            {selected && (
              <div className="space-y-1.5">
                <Label htmlFor="enable-connection-key">Connection key</Label>
                <Input
                  id="enable-connection-key"
                  value={connectionKey}
                  onChange={(event) => {
                    setConnectionKey(event.target.value);
                    if (keyError) setKeyError(null);
                  }}
                  error={keyError ?? undefined}
                  helperText="The name sign-in clients send as the connection for this project."
                  spellCheck={false}
                  autoComplete="off"
                  disabled={saving}
                  fullWidth
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selected} loading={saving}>
              Add provider
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectSignInTab;
