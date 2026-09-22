/**
 * OAuth connection detail — Overview, Projects (binding assignment) and (root-gated
 * write) Credentials.
 *
 * Sub-views are `?tab=` query state, never nested routes, per the repository's flat
 * URL convention. An unknown tab value falls back to `overview` deterministically and
 * is rewritten in the URL so back/forward stay coherent.
 */

import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
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
  PageContainer,
  PageHeader,
} from '@/components/common';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import {
  OAuthAssignProjectsModal,
  OAuthConnectionFormModal,
  OAuthCredentialsTab,
  bindingEffectiveState,
  connectionStatusVariant,
  credentialStatusVariant,
  providerTypeLabel,
} from '@/components/features/oauth';
import { useAuth, useToast } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import { ROUTES } from '@/utils/routes';
import type {
  OAuthBindingInfo,
  OAuthConnectionInfo,
  OAuthProviderCatalogEntry,
} from '@/types/oauth.types';

const TABS = ['overview', 'projects', 'credentials'] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OAuthConnectionDetailsPage(): React.JSX.Element {
  const { connectionHash = '' } = useParams<{ connectionHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { userType } = useAuth();
  const isRoot = userType === 'root';

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: Tab = isTab(rawTab) ? rawTab : 'overview';

  const [connection, setConnection] = React.useState<OAuthConnectionInfo | null>(null);
  const [bindings, setBindings] = React.useState<OAuthBindingInfo[]>([]);
  const [providers, setProviders] = React.useState<OAuthProviderCatalogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);

  const [showEdit, setShowEdit] = React.useState(false);
  const [showAssign, setShowAssign] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [statusBusy, setStatusBusy] = React.useState(false);

  const reload = React.useCallback((): void => setVersion((value) => value + 1), []);

  // Normalise an unknown ?tab= value in the URL rather than silently ignoring it.
  React.useEffect(() => {
    if (rawTab !== null && !isTab(rawTab)) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'overview');
      setSearchParams(next, { replace: true });
    }
  }, [rawTab, searchParams, setSearchParams]);

  const selectTab = (value: string): void => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', isTab(value) ? value : 'overview');
    setSearchParams(next);
  };

  React.useEffect(() => {
    if (!connectionHash) return undefined;
    let active = true;
    void (async (): Promise<void> => {
      try {
        const [connectionResponse, bindingsResponse] = await Promise.all([
          oauthService.getConnection(connectionHash),
          oauthService.listConnectionBindings(connectionHash),
        ]);
        if (active) {
          setConnection(connectionResponse.connection);
          setBindings(bindingsResponse.bindings || []);
          setError(null);
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load OAuth connection'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [connectionHash, version]);

  React.useEffect(() => {
    let active = true;
    void (async (): Promise<void> => {
      try {
        const response = await oauthService.listProviders();
        if (active) setProviders(response.providers || []);
      } catch {
        if (active) setProviders([]);
      }
    })();
    return (): void => {
      active = false;
    };
  }, []);

  const setStatus = async (next: 'active' | 'disabled'): Promise<void> => {
    setStatusBusy(true);
    try {
      if (next === 'active') {
        await oauthService.activateConnection(connectionHash);
        showToast('Connection activated', 'success');
      } else {
        await oauthService.disableConnection(connectionHash);
        showToast('Connection disabled', 'success');
      }
      reload();
    } catch (err) {
      showToast(errorMessage(err, 'Status change failed'), 'error');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    try {
      await oauthService.deleteConnection(connectionHash);
      showToast('Connection removed', 'success');
      void navigate(ROUTES.OAUTH);
    } catch (err) {
      showToast(errorMessage(err, 'Delete failed (remove its project bindings first)'), 'error');
      setDeleting(false);
      setConfirmDelete(false);
      reload();
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  if (error || !connection) {
    return (
      <PageContainer>
        <ErrorState
          title="Couldn’t load OAuth connection"
          message={error || 'Connection not found'}
          onRetry={reload}
        >
          <Button
            variant="outline"
            onClick={() => {
              void navigate(ROUTES.OAUTH);
            }}
          >
            Back to OAuth
          </Button>
        </ErrorState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={connection.display_name}
          subtitle={`${providerTypeLabel(connection.provider_type)} connection — client, credentials and the projects that use it`}
          icon={<KeyRound size={24} />}
          badge={
            <Badge variant={connectionStatusVariant(connection.status)}>{connection.status}</Badge>
          }
          actions={
            <Button
              variant="outline"
              onClick={() => {
                void navigate(ROUTES.OAUTH);
              }}
            >
              Back to OAuth
            </Button>
          }
        />

        <Tabs value={tab} onValueChange={selectTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects ({bindings.length})</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>Overview</CardTitle>
                {isRoot && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                      <Pencil size={14} className="mr-1" /> Edit
                    </Button>
                    {connection.status === 'active' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={statusBusy}
                        onClick={() => void setStatus('disabled')}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button size="sm" loading={statusBusy} onClick={() => void setStatus('active')}>
                        Activate
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={14} className="mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Provider type:</span>
                    <Badge variant="secondary">{providerTypeLabel(connection.provider_type)}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Catalog status:</span>
                    <span>{connection.catalog_status || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Credentials:</span>
                    <Badge variant={credentialStatusVariant(connection.credentials?.credential_status)}>
                      {connection.credentials?.credential_status || 'absent'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Owner:</span>
                    <span>
                      {connection.owner_project_name || connection.owner_project_hash || 'Platform'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Client id:</span>
                    {connection.client_id ? (
                      <CopyableId id={connection.client_id} label="Client id" />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Scopes:</span>
                    <span className="font-mono text-xs">{connection.scopes || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Linked identities:</span>
                    <span>{connection.linked_identity_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Connection hash:</span>
                    <CopyableId id={connection.connection_hash} label="Connection hash" />
                  </div>
                </div>

                <div className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground">Identity namespace:</span>
                    <span className="font-mono text-xs">
                      {connection.identity_namespace || '—'}
                    </span>
                    {connection.namespace_locked && <Badge variant="warning">locked</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The namespace is computed by the adapter and identifies WHO this connection&apos;s
                    subjects are.{' '}
                    {connection.namespace_locked
                      ? `It is frozen because ${connection.linked_identity_count} identities are already linked — create a new connection instead of re-pointing this one.`
                      : 'It freezes as soon as the first identity is linked.'}
                  </p>
                </div>

                <div className="rounded-md border border-border p-3 text-sm">
                  <div className="font-medium">Endpoints</div>
                  {connection.tenant_endpoints_allowed ? (
                    <dl className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                      {(
                        [
                          ['Issuer', connection.issuer],
                          ['Discovery', connection.discovery_url],
                          ['Authorize', connection.authorize_endpoint],
                          ['Token', connection.token_endpoint],
                          ['JWKS', connection.jwks_uri],
                          ['Userinfo', connection.userinfo_endpoint],
                        ] as Array<[string, string | null | undefined]>
                      ).map(([label, value]) => (
                        <div key={label} className="flex gap-2">
                          <dt className="text-muted-foreground">{label}:</dt>
                          <dd className="min-w-0 truncate font-mono">{value || '—'}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Provided by the adapter for this provider type.
                    </p>
                  )}
                </div>

                {connection.restrictions && Object.keys(connection.restrictions).length > 0 && (
                  <div className="rounded-md border border-border p-3 text-sm">
                    <div className="font-medium">Restrictions</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(connection.restrictions).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {key}: {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>

              <ConfirmDialog
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => void handleDelete()}
                title="Delete OAuth connection"
                message="Delete this connection? This is blocked while any project is still bound to it."
                confirmText="Delete"
                variant="danger"
                isLoading={deleting}
              />
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle>Projects</CardTitle>
                <Button onClick={() => setShowAssign(true)} aria-label="Assign projects to connection">
                  <Plus size={16} className="mr-1" /> Assign projects
                </Button>
              </CardHeader>
              <CardContent>
                {bindings.length === 0 ? (
                  <EmptyState
                    icon={<KeyRound />}
                    title="No projects bound"
                    description="Assign a project to let its users sign in through this connection. Each new binding starts disabled and still needs a redirect URI and a return origin."
                    action={
                      <Button onClick={() => setShowAssign(true)}>
                        <Plus size={16} className="mr-1" /> Assign projects
                      </Button>
                    }
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Provisioning</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>URLs</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bindings.map((binding) => {
                        const effective = bindingEffectiveState(binding);
                        return (
                          <TableRow key={binding.connection_key + binding.project_hash}>
                            <TableCell className="font-medium">
                              {binding.project_name || binding.project_hash}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {binding.connection_key}
                            </TableCell>
                            <TableCell className="text-sm">{binding.provisioning_mode}</TableCell>
                            <TableCell>
                              <Badge variant={effective.variant}>{effective.label}</Badge>
                              {effective.blockedBy && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {effective.blockedBy}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{binding.urls.length}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void navigate(
                                    `${ROUTES.PROJECTS}/${binding.project_hash}?tab=sign-in`,
                                  );
                                }}
                                aria-label={`Configure ${binding.project_name || binding.project_hash}`}
                              >
                                Configure
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>

              <OAuthAssignProjectsModal
                isOpen={showAssign}
                onClose={() => setShowAssign(false)}
                onSuccess={reload}
                connectionHash={connection.connection_hash}
                connectionName={connection.display_name}
                providerType={connection.provider_type}
                boundProjectHashes={bindings.map((binding) => binding.project_hash)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="credentials">
            <OAuthCredentialsTab
              connectionHash={connection.connection_hash}
              providerType={connection.provider_type}
              credentials={connection.credentials ?? null}
              isRoot={isRoot}
              onChanged={reload}
            />
          </TabsContent>
        </Tabs>

        <OAuthConnectionFormModal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={reload}
          providers={providers}
          connection={connection}
          onCreate={async (request) => (await oauthService.createConnection(request)).connection}
          onUpdate={async (hash, request) =>
            (await oauthService.updateConnection(hash, request)).connection
          }
        />
      </div>
    </PageContainer>
  );
}

export default OAuthConnectionDetailsPage;
