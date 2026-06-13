/**
 * API Tokens overview
 *
 * Unified, filterable management view for API tokens. Admins see all
 * tokens across the projects they administer; root users pick an owner user
 * or project to scope the list (the backend requires a filter for root).
 *
 * Mirrors the Users / Projects list pages: stats row, filter bar + search,
 * table/grid DataView, a detail drawer, and the create/reveal/edit/revoke flow.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  Key,
  Plus,
  Edit,
  Trash2,
  Eye,
  FolderKanban,
  ShieldCheck,
  Clock,
  Ban,
  KeyRound,
} from 'lucide-react';
import {
  PageHeader,
  StatsGrid,
  FilterBar,
  DataView,
  DataViewCard,
  Pagination,
  ErrorState,
  EmptyState,
  ActionsMenu,
  ConfirmDialog,
  Button,
  Badge,
} from '@/components/common';
import type { Filter, StatCardProps, DataViewColumn } from '@/components/common';
import { Avatar } from '@/components/ui/avatar';
import { useApiKeys, useUsers, useUserType } from '@/hooks';
import { ApiKeyCreateModal } from './ApiKeyCreateModal';
import { DelegatedAuthTokenCreateModal } from './DelegatedAuthTokenCreateModal';
import { ApiKeyEditModal } from './ApiKeyEditModal';
import { ApiKeyRevealModal } from './ApiKeyRevealModal';
import { ApiKeyDetailSheet } from './ApiKeyDetailSheet';
import { computeApiKeyStatus } from '@/types/api-key.types';
import type {
  ApiKey,
  ApiKeyStatus,
  CreateApiKeyResponse,
  DelegatedAuthRevealConfig,
} from '@/types/api-key.types';
import type { ProjectDetails } from '@/types/project.types';
import { projectService } from '@/services/project.service';
import { formatDateTime } from '@/utils/component-utils';

type StatusFilter = 'all' | 'active' | 'expired' | 'revoked';

const statusBadgeConfig: Record<
  ApiKeyStatus,
  { variant: 'subtleSuccess' | 'subtleWarning' | 'subtleDestructive'; label: string }
> = {
  active: { variant: 'subtleSuccess', label: 'Active' },
  expired: { variant: 'subtleWarning', label: 'Expired' },
  revoked: { variant: 'subtleDestructive', label: 'Revoked' },
  revoking: { variant: 'subtleWarning', label: 'Revoking…' },
};

const ITEMS_PER_PAGE = 10;

export function ApiKeysTab(): React.JSX.Element {
  const { isRoot } = useUserType();

  // View + filter state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUserHash, setFilterUserHash] = useState<string | undefined>(undefined);
  const [filterProjectHash, setFilterProjectHash] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal / drawer state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDelegatedCreateModalOpen, setIsDelegatedCreateModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState<CreateApiKeyResponse | null>(null);
  const [createdDelegatedAuthConfig, setCreatedDelegatedAuthConfig] =
    useState<DelegatedAuthRevealConfig | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [detailKey, setDetailKey] = useState<ApiKey | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Filter option sources
  const { users } = useUsers({ limit: 100 });
  const [availableProjects, setAvailableProjects] = useState<ProjectDetails[]>([]);
  useEffect(() => {
    projectService
      .getProjects()
      .then((result) => setAvailableProjects(result.projects))
      .catch(() => setAvailableProjects([]));
  }, []);

  // Root must scope the list to a user or project; until then we don't fetch.
  const rootNeedsFilter = isRoot && !filterUserHash && !filterProjectHash;
  const activeOnly = statusFilter === 'active';

  const { keys, isLoading, error, revokeKey, refetch, totalCount } = useApiKeys({
    userHash: filterUserHash,
    projectHash: filterProjectHash,
    activeOnly,
    enabled: !rootNeedsFilter,
  });

  // 'expired' / 'revoked' have no server filter — narrow the loaded page client-side.
  const displayedKeys = useMemo(() => {
    if (statusFilter === 'expired')
      return keys.filter((k) => computeApiKeyStatus(k) === 'expired');
    if (statusFilter === 'revoked')
      return keys.filter((k) => computeApiKeyStatus(k) === 'revoked');
    return keys;
  }, [keys, statusFilter]);

  // Status breakdown over the loaded page (no all-keys count endpoint exists).
  const statusCounts = useMemo(() => {
    const counts = { active: 0, expired: 0, revoked: 0 };
    keys.forEach((k) => {
      const status = computeApiKeyStatus(k);
      if (status === 'active') counts.active += 1;
      else if (status === 'expired') counts.expired += 1;
      else counts.revoked += 1;
    });
    return counts;
  }, [keys]);

  const stats: StatCardProps[] = useMemo(
    () => [
      {
        title: 'Total Tokens',
        value: totalCount,
        icon: <Key size={20} />,
        variant: 'primary',
        gradient: true,
      },
      {
        title: 'Active',
        value: statusCounts.active,
        subValue: 'on this page',
        icon: <ShieldCheck size={20} />,
        variant: 'success',
      },
      {
        title: 'Expired',
        value: statusCounts.expired,
        subValue: 'on this page',
        icon: <Clock size={20} />,
        variant: 'warning',
      },
      {
        title: 'Revoked',
        value: statusCounts.revoked,
        subValue: 'on this page',
        icon: <Ban size={20} />,
      },
    ],
    [totalCount, statusCounts]
  );

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter handlers — user and project are mutually exclusive (the backend lists
  // by user OR by project, never both).
  const handleSelectUser = useCallback((value: string) => {
    setFilterUserHash(value || undefined);
    setFilterProjectHash(undefined);
    setCurrentPage(1);
  }, []);

  const handleSelectProject = useCallback((value: string) => {
    setFilterProjectHash(value || undefined);
    setFilterUserHash(undefined);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter((value || 'all') as StatusFilter);
    setCurrentPage(1);
  }, []);

  const handleClearAll = useCallback(() => {
    setFilterUserHash(undefined);
    setFilterProjectHash(undefined);
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      void refetch({ limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE });
    },
    [refetch]
  );

  // Create / reveal / edit / revoke / detail handlers
  const handleCreateClick = useCallback(() => setIsCreateModalOpen(true), []);
  const handleDelegatedCreateClick = useCallback(
    () => setIsDelegatedCreateModalOpen(true),
    []
  );

  const handleCreateSuccess = useCallback((response: CreateApiKeyResponse) => {
    setCreatedKeyData(response);
    setCreatedDelegatedAuthConfig(null);
    setIsCreateModalOpen(false);
    setIsRevealModalOpen(true);
  }, []);

  const handleDelegatedCreateSuccess = useCallback(
    (response: CreateApiKeyResponse, config: DelegatedAuthRevealConfig) => {
      setCreatedKeyData(response);
      setCreatedDelegatedAuthConfig(config);
      setIsDelegatedCreateModalOpen(false);
      setIsRevealModalOpen(true);
    },
    []
  );

  const handleRevealConfirm = useCallback(() => {
    setIsRevealModalOpen(false);
    setCreatedKeyData(null);
    setCreatedDelegatedAuthConfig(null);
    void refetch();
  }, [refetch]);

  const openDetail = useCallback((key: ApiKey) => {
    setDetailKey(key);
    setIsDetailOpen(true);
  }, []);

  const handleEditClick = useCallback((key: ApiKey) => {
    setSelectedKey(key);
    setIsEditModalOpen(true);
  }, []);

  const handleRevokeClick = useCallback((key: ApiKey) => {
    setSelectedKey(key);
    setIsRevokeDialogOpen(true);
  }, []);

  const handleRevokeConfirm = useCallback(() => {
    if (!selectedKey) return;
    setIsRevoking(true);
    void revokeKey(selectedKey.public_id).then((success) => {
      setIsRevoking(false);
      if (success) {
        setIsRevokeDialogOpen(false);
        setSelectedKey(null);
        void refetch();
      }
    });
  }, [selectedKey, revokeKey, refetch]);

  const handleDetailEdit = useCallback(
    (key: ApiKey) => {
      setIsDetailOpen(false);
      handleEditClick(key);
    },
    [handleEditClick]
  );

  const handleDetailRevoke = useCallback(
    (key: ApiKey) => {
      setIsDetailOpen(false);
      handleRevokeClick(key);
    },
    [handleRevokeClick]
  );

  // Shared per-row actions menu (table column + grid card).
  const renderActions = useCallback(
    (row: ApiKey): ReactNode => {
      const status = computeApiKeyStatus(row);
      if (status === 'revoked') return null;
      const canEdit = status === 'active' || status === 'expired';
      return (
        <ActionsMenu
          items={[
            {
              key: 'view',
              label: 'View details',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => openDetail(row),
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <Edit className="h-4 w-4" />,
              onClick: () => handleEditClick(row),
              disabled: !canEdit,
            },
            {
              key: 'revoke',
              label: 'Revoke',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => handleRevokeClick(row),
              destructive: true,
              disabled: !canEdit,
            },
          ]}
          ariaLabel={`Actions for token ${row.fingerprint}`}
        />
      );
    },
    [openDetail, handleEditClick, handleRevokeClick]
  );

  const renderStatusBadge = useCallback((row: ApiKey): ReactNode => {
    const wasRecentlyRevoked =
      row.revoked_at &&
      new Date().getTime() - new Date(row.revoked_at).getTime() < 60000;
    const status = wasRecentlyRevoked ? 'revoking' : computeApiKeyStatus(row);
    const config = statusBadgeConfig[status];
    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }, []);

  const columns: DataViewColumn<ApiKey>[] = useMemo(() => {
    const cols: DataViewColumn<ApiKey>[] = [
      {
        key: 'fingerprint',
        header: 'Token',
        render: (_value, row) => (
          <button
            type="button"
            onClick={() => openDetail(row)}
            className="flex flex-col items-start gap-0.5 text-left"
            aria-label={`View details for token ${row.name || row.fingerprint}`}
          >
            <span className="text-sm font-medium text-primary hover:underline">
              {row.name || 'Unnamed'}
            </span>
            <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Key className="h-3 w-3" aria-hidden="true" />
              {row.fingerprint}
            </span>
          </button>
        ),
      },
      {
        key: 'project_name',
        header: 'Project',
        render: (_value, row) => (
          <Badge variant="info" size="sm" className="gap-1">
            <FolderKanban size={12} aria-hidden="true" />
            <span className="truncate max-w-[160px]">
              {row.project_name || row.project_id}
            </span>
          </Badge>
        ),
      },
      {
        key: 'secret_last4',
        header: 'Key',
        render: (_value, row) => (
          <span className="font-mono text-xs text-muted-foreground">
            …{row.secret_last4}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: 'Created',
        hideOnMobile: true,
        render: (_value, row) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.created_at)}
          </span>
        ),
      },
      {
        key: 'last_used_at',
        header: 'Last used',
        hideOnMobile: true,
        render: (_value, row) => (
          <span className="text-sm text-muted-foreground">
            {row.last_used_at ? formatDateTime(row.last_used_at) : 'Never'}
          </span>
        ),
      },
      {
        key: 'expires_at',
        header: 'Expires',
        render: (_value, row): ReactNode => {
          const status = computeApiKeyStatus(row);
          const dimmed = status === 'revoked' ? 'opacity-50' : '';
          if (!row.expires_at)
            return <span className={`text-muted-foreground ${dimmed}`}>Never</span>;
          const expiry = new Date(row.expires_at);
          const isExpired = expiry < new Date();
          return (
            <span className={`${isExpired ? 'text-warning' : ''} ${dimmed}`}>
              {expiry.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        key: 'is_active',
        header: 'Status',
        render: (_value, row) => renderStatusBadge(row),
      },
      {
        key: 'public_id',
        header: '',
        align: 'center',
        width: '60px',
        render: (_value, row) => renderActions(row),
      },
    ];

    // Owner is only meaningful when listing across users; when a single user
    // is filtered the owner is constant (and the by-user list omits it).
    if (!filterUserHash) {
      cols.splice(2, 0, {
        key: 'owner_username',
        header: 'Owner',
        render: (_value, row) => (
          <span className="flex items-center gap-2">
            <Avatar name={row.owner_username || row.owner_user_id} size="xs" />
            <span className="truncate text-sm">
              {row.owner_username || row.owner_user_id}
            </span>
          </span>
        ),
      });
    }

    return cols;
  }, [filterUserHash, openDetail, renderActions, renderStatusBadge]);

  const renderCard = useCallback(
    (key: ApiKey) => {
      const status = computeApiKeyStatus(key);
      const config = statusBadgeConfig[status];
      return (
        <DataViewCard
          title={key.name || 'Unnamed token'}
          subtitle={key.fingerprint}
          description={key.description}
          icon={<Key size={20} />}
          badges={[
            <Badge key="status" variant={config.variant} size="sm">
              {config.label}
            </Badge>,
            <Badge key="project" variant="info" size="sm">
              {key.project_name || key.project_id}
            </Badge>,
          ]}
          stats={[
            { label: 'Created', value: formatDateTime(key.created_at) },
            {
              label: 'Last used',
              value: key.last_used_at ? formatDateTime(key.last_used_at) : 'Never',
            },
          ]}
          onClick={() => openDetail(key)}
          actions={
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {renderActions(key)}
            </div>
          }
        />
      );
    },
    [openDetail, renderActions]
  );

  const keyExtractor = useCallback((key: ApiKey) => key.public_id, []);

  const rowClassName = useCallback((key: ApiKey) => {
    const status = computeApiKeyStatus(key);
    return status === 'revoked' ? 'opacity-60' : '';
  }, []);

  const filters: Filter[] = [
    {
      key: 'user',
      label: 'All owners',
      value: filterUserHash || '',
      onChange: handleSelectUser,
      options: [
        { value: '', label: 'All owners' },
        ...users.map((u) => ({ value: u.user_hash, label: u.username })),
      ],
    },
    {
      key: 'project',
      label: 'All projects',
      value: filterProjectHash || '',
      onChange: handleSelectProject,
      options: [
        { value: '', label: 'All projects' },
        ...availableProjects.map((p) => ({
          value: p.project_hash,
          label: p.project_name,
        })),
      ],
    },
    {
      key: 'status',
      label: 'All statuses',
      value: statusFilter === 'all' ? '' : statusFilter,
      onChange: handleStatusChange,
      options: [
        { value: '', label: 'All statuses' },
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'revoked', label: 'Revoked' },
      ],
    },
  ];

  const hasActiveFilters = Boolean(
    filterUserHash || filterProjectHash || statusFilter !== 'all' || searchQuery
  );

  const emptyAction = (
    <Button onClick={handleCreateClick} leftIcon={<Plus size={16} />}>
      Create Token
    </Button>
  );

  return (
    <>
      <PageHeader
        title="API Tokens"
        subtitle="View and manage project-scoped API tokens and delegated auth tokens"
        icon={<Key size={28} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<KeyRound size={16} />}
              onClick={handleDelegatedCreateClick}
              aria-label="Create a new delegation token"
            >
              Create Delegation Token
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleCreateClick}
              aria-label="Create a new API token"
            >
              Create Token
            </Button>
          </div>
        }
      />

      {!rootNeedsFilter && (
        <div className="mb-6">
          <StatsGrid stats={stats} columns={4} loading={isLoading} />
        </div>
      )}

      <div className="mb-4">
        <FilterBar
          filters={filters}
          onClearAll={handleClearAll}
          showClearButton={hasActiveFilters}
        />
      </div>

      {error && !isLoading ? (
        <ErrorState
          icon={<Key size={24} />}
          title="Failed to load tokens"
          message={error}
          onRetry={() => void refetch()}
          retryLabel="Try Again"
          variant="card"
          size="md"
        />
      ) : rootNeedsFilter ? (
        <EmptyState
          icon={<Key size={32} />}
          title="Select a user or project"
          description="Choose an owner user or a project above to view and manage its API tokens."
        />
      ) : (
        <>
          <DataView<ApiKey>
            data={displayedKeys}
            columns={columns}
            keyExtractor={keyExtractor}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showViewToggle
            showSearch
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search tokens by name, fingerprint, project, or owner…"
            enableLocalSearch
            searchKeys={['name', 'fingerprint', 'description', 'owner_username', 'project_name']}
            renderCard={renderCard}
            gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
            rowClassName={rowClassName}
            isLoading={isLoading}
            emptyMessage={
              hasActiveFilters ? 'No tokens match your filters' : 'No API tokens found'
            }
            emptyDescription="Create a token to grant programmatic project access"
            emptyIcon={<Key size={32} />}
            emptyAction={emptyAction}
            skeletonRows={8}
          />

          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <span className="text-sm text-muted-foreground">
                Showing {displayedKeys.length} of {totalCount} tokens
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                itemLabelSingular="token"
                itemLabelPlural="tokens"
                size="sm"
              />
            </div>
          )}
        </>
      )}

      {/* Create modal — prefill the active user filter when present */}
      <ApiKeyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        accessibleProjects={availableProjects}
        prefilledUserHash={filterUserHash}
      />

      <DelegatedAuthTokenCreateModal
        isOpen={isDelegatedCreateModalOpen}
        onClose={() => setIsDelegatedCreateModalOpen(false)}
        onSuccess={handleDelegatedCreateSuccess}
        availableProjects={availableProjects}
        availableUsers={users}
      />

      {/* One-time reveal modal */}
      {createdKeyData && (
        <ApiKeyRevealModal
          isOpen={isRevealModalOpen}
          onClose={handleRevealConfirm}
          keyData={createdKeyData}
          delegatedAuthConfig={createdDelegatedAuthConfig || undefined}
        />
      )}

      {/* Edit modal */}
      <ApiKeyEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedKey(null);
        }}
        keyData={selectedKey}
        onSuccess={() => void refetch()}
      />

      {/* Revoke confirmation */}
      <ConfirmDialog
        isOpen={isRevokeDialogOpen}
        onClose={() => {
          setIsRevokeDialogOpen(false);
          setSelectedKey(null);
        }}
        onConfirm={handleRevokeConfirm}
        title="Revoke API Token"
        message={
          selectedKey
            ? `Are you sure you want to revoke token "${selectedKey.fingerprint}"? This action cannot be undone. Any services using this token will lose access immediately. Changes may take up to 60 seconds to propagate due to cache.`
            : ''
        }
        confirmText="Revoke"
        cancelText="Cancel"
        variant="danger"
        isLoading={isRevoking}
      />

      {/* Detail drawer */}
      <ApiKeyDetailSheet
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailKey(null);
        }}
        keyData={detailKey}
        onEdit={handleDetailEdit}
        onRevoke={handleDetailRevoke}
      />
    </>
  );
}

export default ApiKeysTab;
