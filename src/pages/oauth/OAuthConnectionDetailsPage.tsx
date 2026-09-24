/**
 * OAuth connection detail — Overview, Projects (bindings) and Credentials.
 *
 * Sections are `?tab=` state via `useTabParam` (unknown values fall back to Overview).
 * Every read and write goes through `useOAuthConnection`; writes other than project
 * assignment are root-only server-side, so their controls are hidden from admins.
 */

import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CopyableId } from '@/components/common/CopyableId';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { ErrorState } from '@/components/common/ErrorState';
import { FactList, type Fact } from '@/components/common/FactList';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { TabNavigation } from '@/components/common/TabNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  OAuthAssignProjectsModal,
  OAuthConnectionFormModal,
  OAuthCredentialsTab,
  allowListSummary,
  bindingEffectiveState,
  catalogStatusPresentation,
  connectionStatusPresentation,
  credentialStatusPresentation,
  provisioningModeLabel,
  providerTypeLabel,
  restrictionLabel,
} from '@/components/features/oauth';
import { useSetBreadcrumbLabel } from '@/contexts';
import { useOAuthConnection } from '@/hooks/useOAuthConnections';
import { useTabParam } from '@/hooks/useTabParam';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import {
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import type {
  OAuthBindingInfo,
  OAuthConnectionInfo,
} from '@/types/oauth.types';

const TABS = ['overview', 'projects', 'credentials'] as const;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function listValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ');
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function DetailsSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading connection">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-56" />
    </div>
  );
}

/** The next setup step for a connection that is not serving sign-in yet. */
function SetupNotice({
  connection,
  isRoot,
  onOpenCredentials,
}: {
  connection: OAuthConnectionInfo;
  isRoot: boolean;
  onOpenCredentials: () => void;
}): React.JSX.Element | null {
  const credentialsActive =
    connection.credentials.credential_status === 'active';
  let text: string | null = null;
  let showCredentialsLink = false;
  if (connection.status === 'draft' && !credentialsActive) {
    text = isRoot
      ? 'Draft: store the client secret, then activate the connection.'
      : 'Draft: a root administrator still has to store the client secret and activate the connection.';
    showCredentialsLink = isRoot;
  } else if (connection.status === 'draft') {
    text = isRoot
      ? 'Draft: credentials are stored. Activate the connection so bound projects can use it.'
      : 'Draft: a root administrator still has to activate the connection.';
  } else if (connection.status === 'disabled') {
    text =
      'Disabled: no project can sign in through this connection. Credentials and bindings are kept.';
  } else if (connection.status === 'archived') {
    text =
      'Archived: people have signed in through this connection, so it is kept for their identities. Its credentials were erased.';
  }
  if (!text) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 px-4 py-3 text-[13px]">
      <span className="text-foreground">{text}</span>
      {showCredentialsLink && (
        <Button variant="secondary" size="sm" onClick={onOpenCredentials}>
          Store credentials
        </Button>
      )}
    </div>
  );
}

export function OAuthConnectionDetailsPage(): React.JSX.Element {
  const { connectionHash } = useParams<{ connectionHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const [activeTab, setTab] = useTabParam(TABS, 'overview');
  const details = useOAuthConnection(connectionHash);
  const { connection, bindings, pending } = details;

  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useSetBreadcrumbLabel(connection?.display_name);

  const boundProjectHashes = useMemo(
    () => bindings.map((binding) => binding.project_hash),
    [bindings]
  );

  const bindingColumns = useMemo<DataViewColumn<OAuthBindingInfo>[]>(
    () => [
      {
        key: 'project_name',
        header: 'Project',
        render: (_value, binding) => (
          <div className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-foreground">
              {binding.project_name || binding.project_hash}
            </span>
            <span className="block truncate font-mono text-xs text-muted-foreground">
              {binding.connection_key}
            </span>
          </div>
        ),
      },
      {
        key: 'ready',
        header: 'Sign-in',
        render: (_value, binding) => {
          const effective = bindingEffectiveState(binding);
          return (
            <div className="min-w-0">
              <Badge variant={effective.variant} size="sm">
                {effective.label}
              </Badge>
              {effective.blockedBy && (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {effective.blockedBy}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'provisioning_mode',
        header: 'Provisioning',
        hideOnMobile: true,
        render: (_value, binding) => (
          <span className="text-[13px]">
            {provisioningModeLabel(binding.provisioning_mode)}
          </span>
        ),
      },
      {
        key: 'urls',
        header: 'Allowed URLs',
        hideOnMobile: true,
        render: (_value, binding) => (
          <span className="text-xs text-muted-foreground">
            {allowListSummary(binding)}
          </span>
        ),
      },
      {
        key: 'project_hash',
        header: '',
        width: '110px',
        align: 'right',
        render: (_value, binding) => (
          <Button asChild variant="secondary" size="sm">
            <Link
              to={`${ROUTES.PROJECTS}/${encodeURIComponent(binding.project_hash)}?tab=sign-in`}
              aria-label={`Configure sign-in for ${binding.project_name || binding.project_hash}`}
            >
              Configure
            </Link>
          </Button>
        ),
      },
    ],
    []
  );

  if (details.isLoading) {
    return (
      <PageContainer>
        <DetailsSkeleton />
      </PageContainer>
    );
  }

  if (!connection) {
    return (
      <PageContainer>
        <ErrorState
          title="This connection could not be loaded"
          message={details.error ?? undefined}
          onRetry={() => void details.refetch()}
          isRetrying={details.isRefreshing}
        />
      </PageContainer>
    );
  }

  const status = connectionStatusPresentation(connection.status);
  const credentialsStatus = credentialStatusPresentation(
    connection.credentials.credential_status
  );
  const catalogStatus = catalogStatusPresentation(connection.catalog_status);
  const credentialsActive =
    connection.credentials.credential_status === 'active';
  const isArchived = connection.status === 'archived';
  // Admins may bind shared connections to their projects; a project-owned connection
  // can only be bound elsewhere by root, and archived connections can't be bound.
  const canAssign = !isArchived && (isRoot || !connection.owner_project_hash);

  const runStatus = async (next: 'activate' | 'disable'): Promise<void> => {
    try {
      if (next === 'activate') {
        await details.activateConnection();
        showToast(`${connection.display_name} is active`, 'success');
      } else {
        await details.disableConnection();
        showToast(`${connection.display_name} is disabled`, 'success');
      }
      setConfirmDisable(false);
    } catch (err) {
      showToast(errorMessage(err, 'The status could not be changed.'), 'error');
    }
  };

  const runDelete = async (): Promise<void> => {
    try {
      const outcome = await details.deleteConnection();
      setConfirmDelete(false);
      if (outcome === 'archived') {
        showToast(
          `${connection.display_name} was archived: people have signed in through it, so it is kept and its credentials were erased.`,
          'warning'
        );
      } else {
        showToast(`${connection.display_name} deleted`, 'success');
        void navigate(ROUTES.OAUTH);
      }
    } catch (err) {
      showToast(
        errorMessage(err, 'The connection could not be deleted.'),
        'error'
      );
    }
  };

  const requestDelete = (): void => {
    if (connection.binding_count > 0) {
      showToast(
        `Remove ${connection.display_name} from its ${formatNumber(connection.binding_count)} project${
          connection.binding_count === 1 ? '' : 's'
        } before deleting it.`,
        'warning'
      );
      setTab('projects');
      return;
    }
    setConfirmDelete(true);
  };

  const subtitle = (
    <>
      {providerTypeLabel(connection.provider_type)} ·{' '}
      {connection.owner_project_hash ? (
        <>
          Owned by{' '}
          {connection.owner_project_name || connection.owner_project_hash}
        </>
      ) : (
        'Shared'
      )}
      {connection.updated_at && (
        <>
          {' '}
          ·{' '}
          <span title={formatDateTime(connection.updated_at)}>
            Updated {formatRelativeTime(connection.updated_at)}
          </span>
        </>
      )}
    </>
  );

  const headerActions = isRoot ? (
    <>
      {!isArchived &&
        (connection.status === 'active' ? (
          <Button
            variant="secondary"
            onClick={() => setConfirmDisable(true)}
            loading={pending === 'disable'}
          >
            Disable
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => void runStatus('activate')}
            loading={pending === 'activate'}
            // api.auth refuses to activate without active credentials; the setup notice says why.
            disabled={!credentialsActive}
          >
            Activate
          </Button>
        ))}
      <Button variant="secondary" onClick={() => setShowEdit(true)}>
        <Pencil aria-hidden="true" />
        Edit
      </Button>
      {!isArchived && (
        <ActionsMenu
          ariaLabel="More connection actions"
          items={[
            {
              key: 'delete',
              label: 'Delete connection',
              icon: <Trash2 />,
              destructive: true,
              onClick: requestDelete,
            },
          ]}
        />
      )}
    </>
  ) : undefined;

  const configurationFacts: Fact[] = [
    { label: 'Provider', value: providerTypeLabel(connection.provider_type) },
    {
      label: 'Client ID',
      value: connection.client_id ? (
        <CopyableId id={connection.client_id} label="Client ID" />
      ) : (
        '—'
      ),
    },
    { label: 'Scopes', value: connection.scopes || '—', mono: true },
    {
      label: 'Owner',
      value: connection.owner_project_hash ? (
        <Link
          to={`${ROUTES.PROJECTS}/${encodeURIComponent(connection.owner_project_hash)}`}
          className="text-foreground no-underline hover:underline"
        >
          {connection.owner_project_name || connection.owner_project_hash}
        </Link>
      ) : (
        'Shared with every project'
      ),
    },
    {
      label: 'Provider catalog',
      value: (
        <Badge variant={catalogStatus.variant} size="sm">
          {catalogStatus.label}
        </Badge>
      ),
    },
    {
      label: 'Credentials',
      value: (
        <Badge variant={credentialsStatus.variant} size="sm">
          {credentialsStatus.label}
        </Badge>
      ),
    },
    { label: 'Projects', value: formatNumber(connection.binding_count) },
    {
      label: 'Linked identities',
      value: formatNumber(connection.linked_identity_count),
    },
    {
      label: 'Connection ID',
      value: (
        <CopyableId id={connection.connection_hash} label="Connection ID" />
      ),
    },
    {
      label: 'Created',
      value: (
        <span title={formatDateTime(connection.created_at)}>
          {formatRelativeTime(connection.created_at)}
        </span>
      ),
    },
  ];

  const endpointFacts: Fact[] = [
    { label: 'Issuer', value: connection.issuer || '—', mono: true },
    {
      label: 'Discovery URL',
      value: connection.discovery_url || '—',
      mono: true,
    },
    {
      label: 'Authorize endpoint',
      value: connection.authorize_endpoint || '—',
      mono: true,
    },
    {
      label: 'Token endpoint',
      value: connection.token_endpoint || '—',
      mono: true,
    },
    { label: 'JWKS URI', value: connection.jwks_uri || '—', mono: true },
    {
      label: 'Userinfo endpoint',
      value: connection.userinfo_endpoint || '—',
      mono: true,
    },
  ];

  const restrictionFacts: Fact[] = [
    ...Object.entries(connection.provider_params ?? {}).map(([key, value]) => ({
      label: restrictionLabel(key),
      value: listValue(value),
      mono: true,
    })),
    ...Object.entries(connection.restrictions ?? {}).map(([key, value]) => ({
      label: restrictionLabel(key),
      value: listValue(value),
      mono: true,
    })),
  ];

  return (
    <PageContainer>
      <PageHeader
        title={connection.display_name}
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
            <KeyRound className="h-5 w-5" />
          </span>
        }
        badge={
          <Badge variant={status.variant} size="sm" dot>
            {status.label}
          </Badge>
        }
        subtitle={subtitle}
        actions={headerActions}
      />

      <TabNavigation
        className="mb-6"
        ariaLabel="Connection sections"
        activeTab={activeTab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'projects', label: 'Projects', count: bindings.length },
          { id: 'credentials', label: 'Credentials' },
        ]}
      />

      <div role="tabpanel" aria-label={activeTab}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <SetupNotice
              connection={connection}
              isRoot={isRoot}
              onOpenCredentials={() => setTab('credentials')}
            />

            <Panel title="Configuration">
              <FactList layout="grid" facts={configurationFacts} />
            </Panel>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Panel
                title="Identity namespace"
                description="Computed by the adapter; identifies whose accounts this connection signs in."
                actions={
                  connection.namespace_locked ? (
                    <Badge variant="warning" size="sm">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Locked
                    </Badge>
                  ) : undefined
                }
              >
                <p className="m-0 break-all font-mono text-[13px] text-foreground">
                  {connection.identity_namespace || '—'}
                </p>
                <p className="m-0 mt-2 text-xs text-muted-foreground">
                  {connection.namespace_locked
                    ? `Frozen because ${formatNumber(connection.linked_identity_count)} identities are linked. To change the issuer, tenant or team, create a new connection.`
                    : 'It freezes as soon as the first identity is linked.'}
                </p>
              </Panel>

              <Panel
                title="Restrictions"
                description="Provider-specific limits on who can sign in."
              >
                {restrictionFacts.length > 0 ? (
                  <FactList facts={restrictionFacts} />
                ) : (
                  <p className="m-0 text-[13px] text-muted-foreground">
                    None. Any account the provider authenticates can sign in,
                    subject to each project&apos;s policy.
                  </p>
                )}
              </Panel>
            </div>

            <Panel title="Endpoints">
              {connection.tenant_endpoints_allowed ? (
                <FactList facts={endpointFacts} />
              ) : (
                <p className="m-0 text-[13px] text-muted-foreground">
                  {providerTypeLabel(connection.provider_type)} uses the
                  adapter&apos;s built-in issuer and endpoints.
                </p>
              )}
            </Panel>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="m-0 text-[15px] font-semibold text-foreground">
                  Projects
                </h2>
                <p className="m-0 mt-0.5 text-xs text-muted-foreground">
                  {isRoot
                    ? 'Projects that offer sign-in through this connection.'
                    : 'Projects you manage that offer sign-in through this connection.'}
                </p>
              </div>
              {canAssign && (
                <Button onClick={() => setShowAssign(true)}>
                  <Plus aria-hidden="true" />
                  Assign projects
                </Button>
              )}
            </div>
            {!canAssign && !isArchived && (
              <p className="m-0 text-xs text-muted-foreground">
                This connection belongs to{' '}
                {connection.owner_project_name || 'another project'}; only root
                can bind it to other projects.
              </p>
            )}
            <DataView<OAuthBindingInfo>
              data={bindings}
              columns={bindingColumns}
              keyExtractor={(binding) =>
                `${binding.project_hash}:${binding.connection_key}`
              }
              emptyIcon={<KeyRound className="h-8 w-8" />}
              emptyMessage="No projects use this connection yet"
              emptyDescription="Assigned projects start disabled; each needs a redirect URI and a return origin before people can sign in."
              emptyAction={
                canAssign ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowAssign(true)}
                  >
                    Assign projects
                  </Button>
                ) : undefined
              }
              caption="Projects bound to this connection"
            />
          </div>
        )}

        {activeTab === 'credentials' && (
          <OAuthCredentialsTab
            credentials={connection.credentials}
            connectionName={connection.display_name}
            isRoot={isRoot}
            onSave={details.setCredentials}
            onTest={details.testCredentials}
          />
        )}
      </div>

      {isRoot && (
        <OAuthConnectionFormModal
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          connection={connection}
          onUpdate={details.updateConnection}
        />
      )}

      {canAssign && (
        <OAuthAssignProjectsModal
          isOpen={showAssign}
          onClose={() => setShowAssign(false)}
          connectionName={connection.display_name}
          providerType={connection.provider_type}
          boundProjectHashes={boundProjectHashes}
          assignProject={details.assignProject}
          onAssigned={() => void details.refetch()}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        onConfirm={() => void runStatus('disable')}
        variant="warning"
        title={`Disable ${connection.display_name}?`}
        message={`Every project that signs in through it stops accepting those sign-ins until it is activated again${
          connection.binding_count > 0
            ? ` (${formatNumber(connection.binding_count)} project${connection.binding_count === 1 ? '' : 's'})`
            : ''
        }. Credentials and bindings are kept.`}
        confirmText="Disable connection"
        isLoading={pending === 'disable'}
      />

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void runDelete()}
        title={`Delete ${connection.display_name}?`}
        message={
          connection.linked_identity_count > 0
            ? `${formatNumber(connection.linked_identity_count)} identities were linked through this connection, so it will be archived instead: it is kept for those identities and its credentials are erased.`
            : 'The connection and its encrypted credentials are removed permanently. This cannot be undone.'
        }
        confirmText="Delete connection"
        confirmationPhrase={connection.display_name}
        isLoading={pending === 'delete'}
      />
    </PageContainer>
  );
}

export default OAuthConnectionDetailsPage;
