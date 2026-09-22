/**
 * OAuth connections list (admin reads, root writes).
 *
 * A CONNECTION is one registered OAuth client — a client id, an encrypted secret and
 * the endpoints for one provider. Projects use a connection through a BINDING, which
 * is managed from the connection's Projects tab or the project's sign-in tab.
 *
 * Structural sibling of the billing groups list: `DataView` for the table, `FilterBar`
 * for provider type and status, row click to detail, root-gated create.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  DataView,
  ErrorState,
  FilterBar,
  PageContainer,
  PageHeader,
  type DataViewColumn,
} from '@/components/common';
import {
  OAuthConnectionFormModal,
  connectionStatusVariant,
  credentialStatusVariant,
  providerTypeLabel,
} from '@/components/features/oauth';
import { useAuth, useOAuthConnections } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import { ROUTES } from '@/utils/routes';
import type { OAuthConnectionListItem, OAuthProviderCatalogEntry } from '@/types/oauth.types';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'archived', label: 'Archived' },
];

export function OAuthConnectionsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { userType } = useAuth();
  const isRoot = userType === 'root';

  const [providerType, setProviderType] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [providers, setProviders] = React.useState<OAuthProviderCatalogEntry[]>([]);

  const {
    connections,
    isLoading,
    error,
    totalCount,
    createConnection,
    updateConnection,
    refetch,
  } = useOAuthConnections({ providerType, status, limit: 100 });

  // The catalog drives the provider filter options and the create form's branching.
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

  const columns: DataViewColumn<OAuthConnectionListItem>[] = [
    {
      key: 'display_name',
      header: 'Connection',
      sortable: true,
      render: (_value, row) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.display_name}</div>
          {row.identity_namespace && (
            <div className="truncate font-mono text-xs text-muted-foreground">
              {row.identity_namespace}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'provider_type',
      header: 'Provider',
      sortable: true,
      render: (_value, row) => <Badge variant="secondary">{providerTypeLabel(row.provider_type)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (_value, row) => (
        <Badge variant={connectionStatusVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      key: 'credential_status',
      header: 'Credentials',
      sortable: true,
      render: (_value, row) => (
        <Badge variant={credentialStatusVariant(row.credential_status)}>
          {row.credential_status}
        </Badge>
      ),
    },
    {
      key: 'binding_count',
      header: 'Projects',
      sortable: true,
      render: (_value, row) => row.binding_count ?? 0,
    },
    {
      key: 'owner_project_name',
      header: 'Owner',
      render: (_value, row) => row.owner_project_name || row.owner_project_hash || 'Platform',
      hideOnMobile: true,
    },
    {
      key: 'updated_at',
      header: 'Updated',
      sortable: true,
      render: (_value, row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.updated_at || row.created_at || '—'}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  const providerOptions = providers
    .filter((entry) => entry.provider_type !== 'patreon')
    .map((entry) => ({
      value: entry.provider_type,
      label: entry.display_name || providerTypeLabel(entry.provider_type),
    }));

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="OAuth"
          subtitle="Connections — each holds one provider client and can be bound to many projects"
          icon={<KeyRound size={24} />}
          actions={
            isRoot ? (
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-1" /> New connection
              </Button>
            ) : undefined
          }
        />

        {error ? (
          <ErrorState
            title="Couldn’t load OAuth connections"
            message={error}
            onRetry={() => void refetch()}
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataView<OAuthConnectionListItem>
                data={connections}
                columns={columns}
                keyExtractor={(item) => item.connection_hash}
                isLoading={isLoading}
                showToolbar
                showSearch
                enableLocalSearch
                searchKeys={['display_name', 'identity_namespace', 'owner_project_name']}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search connections…"
                toolbarFilters={
                  <FilterBar
                    filters={[
                      {
                        key: 'provider_type',
                        label: 'Provider type',
                        options: providerOptions,
                        value: providerType,
                        onChange: setProviderType,
                      },
                      {
                        key: 'status',
                        label: 'Status',
                        options: STATUS_OPTIONS,
                        value: status,
                        onChange: setStatus,
                      },
                    ]}
                    onClearAll={() => {
                      setProviderType('');
                      setStatus('');
                    }}
                  />
                }
                onRowClick={(item) => {
                  void navigate(`${ROUTES.OAUTH}/${item.connection_hash}`);
                }}
                emptyIcon={<KeyRound />}
                emptyMessage="No OAuth connections"
                emptyDescription="A connection registers one OAuth client — its client id, its encrypted secret and its endpoints. Create one, store its credentials, then assign the projects that should use it."
                emptyAction={
                  isRoot ? (
                    <Button onClick={() => setShowCreate(true)}>
                      <Plus size={16} className="mr-1" /> New connection
                    </Button>
                  ) : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        {!isLoading && connections.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {connections.length} of {totalCount} connection{totalCount === 1 ? '' : 's'}
          </p>
        )}

        <OAuthConnectionFormModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={() => void refetch()}
          providers={providers}
          onCreate={createConnection}
          onUpdate={updateConnection}
        />
      </div>
    </PageContainer>
  );
}

export default OAuthConnectionsPage;
