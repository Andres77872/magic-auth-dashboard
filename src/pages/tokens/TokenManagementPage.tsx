/**
 * API keys (`/tokens`): project-scoped machine credentials across the
 * projects the operator can manage.
 *
 * Listing rules come from `GET /api-keys`: root must pick an owner or a
 * project; admins without filters get the keys of every project they
 * administer (only the first page of that listing is reliable, so it is
 * fetched once and paged locally).
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { KeyRound, Plus, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataView } from '@/components/common/DataView';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { TablePager } from '@/components/common/TablePager';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  EntityCombobox,
  useProjectOptions,
  type ComboboxOption,
} from '@/components/features/shared-pickers';
import {
  ApiKeyCreateModal,
  ApiKeyDetailSheet,
  ApiKeyEditModal,
  ApiKeyRevealModal,
  DelegatedAuthTokenCreateModal,
  OwnerPicker,
  buildApiKeyColumns,
  describeApiKeyError,
} from '@/components/features/tokens';
import { useApiKeyMutations, useApiKeys } from '@/hooks/useApiKeys';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { cn } from '@/lib/utils';
import { formatNumber, truncateHash } from '@/utils/formatters';
import type {
  ApiKey,
  CreatedApiKey,
  DelegatedAuthRevealConfig,
} from '@/types/api-key.types';

const PAGE_SIZES = [25, 50, 100];
/** Backend maximum; used for the admin overview, which is paged locally. */
const OVERVIEW_LIMIT = 200;

export function TokenManagementPage(): React.JSX.Element {
  const { isRoot } = useUserType();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const ownerHash = searchParams.get('user') ?? '';
  const projectHash = searchParams.get('project') ?? '';
  const activeOnly = searchParams.get('active') === '1' && !ownerHash;
  const limit = PAGE_SIZES.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 25;
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '1', 10) || 1
  );
  const offset = (page - 1) * limit;

  const hasFilter = Boolean(ownerHash || projectHash);
  const rootNeedsFilter = isRoot && !hasFilter;
  const overviewMode = !isRoot && !hasFilter;

  const [ownerLabel, setOwnerLabel] = useState<string | null>(null);
  const projects = useProjectOptions();

  const list = useApiKeys({
    userHash: ownerHash || undefined,
    projectHash: projectHash || undefined,
    activeOnly: activeOnly || undefined,
    limit: overviewMode ? OVERVIEW_LIMIT : limit,
    offset: overviewMode ? 0 : offset,
    enabled: !rootNeedsFilter,
  });
  const loadedKeys = rootNeedsFilter ? [] : list.keys;
  const rows = overviewMode
    ? loadedKeys.slice(offset, offset + limit)
    : loadedKeys;

  const { revokeKey, pending } = useApiKeyMutations();
  const [createOpen, setCreateOpen] = useState(false);
  const [delegationOpen, setDelegationOpen] = useState(false);
  const [created, setCreated] = useState<CreatedApiKey | null>(null);
  const [delegatedConfig, setDelegatedConfig] =
    useState<DelegatedAuthRevealConfig | null>(null);
  const [detailKey, setDetailKey] = useState<ApiKey | null>(null);
  const [editKey, setEditKey] = useState<ApiKey | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        if (resetPage) next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  const ownerOption: ComboboxOption | null = ownerHash
    ? {
        value: ownerHash,
        label:
          ownerLabel ??
          loadedKeys.find((key) => key.owner_user_hash === ownerHash)
            ?.owner_username ??
          truncateHash(ownerHash),
      }
    : null;

  const refresh = (): void => {
    if (!rootNeedsFilter) void list.refetch();
  };

  const columns = useMemo(
    () =>
      buildApiKeyColumns({
        showOwner: !ownerHash,
        onOpen: setDetailKey,
        onEdit: setEditKey,
        onRevoke: setRevokeTarget,
      }),
    [ownerHash, setDetailKey, setEditKey, setRevokeTarget]
  );

  const confirmRevoke = async (): Promise<void> => {
    if (!revokeTarget) return;
    try {
      await (revokeReason.trim()
        ? revokeKey(revokeTarget.public_id, revokeReason)
        : revokeKey(revokeTarget.public_id));
      showToast(
        `Revoked “${revokeTarget.name}”. It stops working immediately.`,
        'success'
      );
      setRevokeTarget(null);
      setDetailKey(null);
      void list.refetch();
    } catch (err) {
      showToast(
        describeApiKeyError(err, 'The key could not be revoked.'),
        'error'
      );
    }
  };

  const subtitle = rootNeedsFilter
    ? 'Project-scoped keys for server-to-server access. Choose an owner or a project to list keys.'
    : list.isLoading
      ? 'Project-scoped keys for server-to-server access'
      : overviewMode
        ? `${formatNumber(list.total)} ${list.total === 1 ? 'key' : 'keys'} across the projects you administer`
        : `${formatNumber(list.total)} ${list.total === 1 ? 'key' : 'keys'}${activeOnly ? ' still active' : ''}`;

  const overviewTruncated = overviewMode && list.total > loadedKeys.length;

  return (
    <PageContainer>
      <PageHeader
        title="API keys"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={rootNeedsFilter || list.isRefreshing}
              aria-label="Refresh API keys"
            >
              <RefreshCw
                className={cn(list.isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="secondary" onClick={() => setDelegationOpen(true)}>
              <KeyRound aria-hidden="true" />
              Delegation key
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden="true" />
              Create key
            </Button>
          </>
        }
      />

      {list.error && !rootNeedsFilter && loadedKeys.length === 0 ? (
        <ErrorState
          title="API keys could not be loaded"
          message={list.error}
          onRetry={refresh}
          isRetrying={list.isRefreshing}
        />
      ) : (
        <div
          className={cn(
            'transition-opacity',
            list.isRefreshing && 'opacity-70'
          )}
        >
          <DataView<ApiKey>
            data={rows}
            columns={columns}
            keyExtractor={(key) => key.public_id}
            toolbarFilters={
              <>
                <div className="w-full sm:w-56">
                  <OwnerPicker
                    id="api-keys-owner-filter"
                    ariaLabel="Filter by owner"
                    placeholder={isRoot ? 'Choose an owner' : 'All owners'}
                    clearable
                    value={ownerOption}
                    onChange={(option) => {
                      setOwnerLabel(option?.label ?? null);
                      updateParams({ user: option?.value ?? null });
                    }}
                  />
                </div>
                <div className="w-full sm:w-56">
                  <EntityCombobox
                    id="api-keys-project-filter"
                    aria-label="Filter by project"
                    value={projectHash}
                    options={projects.options}
                    isLoading={projects.isLoading}
                    error={projects.error}
                    onChange={(option) =>
                      updateParams({ project: option?.value ?? null })
                    }
                    placeholder={isRoot ? 'Choose a project' : 'All projects'}
                    searchPlaceholder="Search projects"
                    emptyText="No projects match"
                    clearable
                  />
                </div>
                <label
                  className={cn(
                    'flex items-center gap-2 text-xs text-muted-foreground',
                    ownerHash
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  )}
                  title={
                    ownerHash
                      ? 'Owner listings always include revoked and expired keys.'
                      : undefined
                  }
                >
                  <Checkbox
                    checked={activeOnly}
                    disabled={Boolean(ownerHash)}
                    onCheckedChange={(checked) =>
                      updateParams({ active: checked === true ? '1' : null })
                    }
                  />
                  Active only
                </label>
                {hasFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOwnerLabel(null);
                      updateParams({ user: null, project: null, active: null });
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </>
            }
            onRowClick={setDetailKey}
            rowClassName={(key) => (key.is_active ? '' : 'opacity-60')}
            isLoading={list.isLoading}
            skeletonRows={6}
            emptyIcon={<KeyRound className="h-8 w-8" />}
            emptyMessage={
              rootNeedsFilter
                ? 'Choose an owner or a project'
                : hasFilter || activeOnly
                  ? 'No keys match these filters'
                  : 'No API keys yet'
            }
            emptyDescription={
              rootNeedsFilter
                ? 'Root sees keys across every project, so pick an owner or a project above to list them.'
                : hasFilter || activeOnly
                  ? 'Try another owner or project, or clear the filters.'
                  : 'Create a key to give a service access to one of your projects.'
            }
            emptyAction={
              !rootNeedsFilter && !hasFilter && !activeOnly ? (
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus aria-hidden="true" />
                  Create key
                </Button>
              ) : undefined
            }
            caption="API keys"
          />
          {!rootNeedsFilter && (
            <TablePager
              offset={offset}
              limit={limit}
              pageCount={rows.length}
              total={overviewMode ? loadedKeys.length : list.total}
              onOffsetChange={(nextOffset) =>
                updateParams(
                  { page: String(Math.floor(nextOffset / limit) + 1) },
                  false
                )
              }
              pageSizeOptions={PAGE_SIZES}
              onLimitChange={(nextLimit) =>
                updateParams({ limit: String(nextLimit) })
              }
              itemLabel="keys"
            />
          )}
          {overviewTruncated && (
            <p className="m-0 mt-2 text-xs text-muted-foreground">
              Showing the first {formatNumber(loadedKeys.length)} of{' '}
              {formatNumber(list.total)} keys. Filter by project or owner to see
              the rest.
            </p>
          )}
        </div>
      )}

      <ApiKeyCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        initialOwner={ownerOption}
        initialProjectHash={projectHash}
        onCreated={(key) => {
          setCreateOpen(false);
          setDelegatedConfig(null);
          setCreated(key);
          void list.refetch();
        }}
      />

      <DelegatedAuthTokenCreateModal
        isOpen={delegationOpen}
        onClose={() => setDelegationOpen(false)}
        onCreated={(key, config) => {
          setDelegationOpen(false);
          setDelegatedConfig(config);
          setCreated(key);
          void list.refetch();
        }}
      />

      <ApiKeyRevealModal
        created={created}
        delegatedAuthConfig={delegatedConfig}
        onClose={() => {
          setCreated(null);
          setDelegatedConfig(null);
        }}
      />

      <ApiKeyDetailSheet
        apiKey={detailKey}
        onClose={() => setDetailKey(null)}
        onEdit={(key) => {
          setDetailKey(null);
          setEditKey(key);
        }}
        onRevoke={(key) => {
          setDetailKey(null);
          setRevokeTarget(key);
        }}
      />

      <ApiKeyEditModal
        apiKey={editKey}
        onClose={() => setEditKey(null)}
        onSaved={(updated) => {
          setEditKey(null);
          showToast(`Saved “${updated.name}”.`, 'success');
          void list.refetch();
        }}
      />

      <ConfirmDialog
        isOpen={revokeTarget !== null}
        onClose={() => {
          setRevokeTarget(null);
          setRevokeReason('');
        }}
        onConfirm={() => void confirmRevoke()}
        title="Revoke API key?"
        message={
          revokeTarget ? (
            <>
              Services using{' '}
              <span className="font-medium text-foreground">
                {revokeTarget.name}
              </span>{' '}
              are rejected immediately. Revoked keys can&apos;t be restored or
              edited.
            </>
          ) : (
            ''
          )
        }
        confirmText="Revoke key"
        confirmationPhrase={revokeTarget?.name}
        isLoading={pending === 'revoke'}
      >
        <div className="space-y-1.5">
          <label
            htmlFor="revoke-reason"
            className="text-xs text-muted-foreground"
          >
            Reason (optional, kept with the key)
          </label>
          <Textarea
            id="revoke-reason"
            rows={2}
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            placeholder="Leaked in CI logs"
            disabled={pending === 'revoke'}
          />
        </div>
      </ConfirmDialog>
    </PageContainer>
  );
}

export default TokenManagementPage;
