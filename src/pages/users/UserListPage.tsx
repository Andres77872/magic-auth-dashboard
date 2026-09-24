import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw, Users } from 'lucide-react';
import {
  DataView,
  ErrorState,
  PageContainer,
  PageHeader,
  TabNavigation,
  TablePager,
  UserTypeBadge,
  type BulkAction,
  type DataViewColumn,
} from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { UserActionsMenu } from '@/components/features/users/UserActionsMenu';
import { CreateUserModal } from '@/components/features/users/CreateUserModal';
import { ConfirmDialog } from '@/components/common';
import {
  useAuth,
  useToast,
  useUserActions,
  useUserType,
  useUsers,
} from '@/hooks';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type { User } from '@/types/auth.types';
import type { UserListParams } from '@/types/user.types';

const TYPE_FILTERS = ['all', 'root', 'admin', 'consumer'] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];
const SORTABLE: ReadonlyArray<NonNullable<UserListParams['sort_by']>> = [
  'username',
  'email',
  'user_type',
  'created_at',
  'last_login',
];
const PAGE_SIZES = [25, 50, 100];

function readTypeFilter(value: string | null): TypeFilter {
  return (TYPE_FILTERS as readonly string[]).includes(value ?? '')
    ? (value as TypeFilter)
    : 'all';
}

function ChipList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}): React.JSX.Element {
  if (items.length === 0)
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>;
  return (
    // One chip plus an overflow count keeps every row a single line.
    <div className="flex min-w-0 max-w-[220px] items-center gap-1">
      <span
        className="min-w-0 truncate rounded border border-border bg-secondary/60 px-1.5 py-px text-[11px] text-foreground"
        title={items[0]}
      >
        {items[0]}
      </span>
      {items.length > 1 && (
        <span
          className="shrink-0 px-0.5 text-[11px] text-muted-foreground"
          title={items.slice(1).join(', ')}
        >
          +{items.length - 1}
        </span>
      )}
    </div>
  );
}

export function UserListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { isRoot, isAdminOrHigher } = useUserType();
  const { showToast } = useToast();
  const actions = useUserActions();

  // URL is the source of truth for filters, so views are shareable.
  const typeFilter = readTypeFilter(searchParams.get('type'));
  const includeInactive = searchParams.get('status') === 'all';
  const query = searchParams.get('q') ?? '';
  const limit = PAGE_SIZES.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 25;
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '1', 10) || 1
  );
  const offset = (page - 1) * limit;
  const [sortKey, sortDir] = (searchParams.get('sort') ?? '').split(':');
  const sortBy = (SORTABLE as readonly string[]).includes(sortKey)
    ? (sortKey as UserListParams['sort_by'])
    : undefined;
  const sortOrder = sortDir === 'desc' ? 'desc' : 'asc';

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === '') next.delete(key);
            else next.set(key, value);
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Debounce typing into the URL-backed search.
  const [searchInput, setSearchInput] = useState(query);
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setSearchInput(query);
  }
  useEffect(() => {
    if (searchInput.trim() === query) return;
    const id = window.setTimeout(
      () => updateParams({ q: searchInput.trim() || null }),
      300
    );
    return () => window.clearTimeout(id);
  }, [searchInput, query, updateParams]);

  const { users, pagination, isLoading, isRefreshing, error, refetch } =
    useUsers({
      limit,
      offset,
      search: query,
      userType: typeFilter === 'all' ? undefined : typeFilter,
      includeInactive,
      sortBy,
      sortOrder,
    });

  // `/users/list` totals ignore search, so only trust them without a query.
  const trustedTotal = query ? undefined : pagination?.total;

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<User[]>([]);
  const [bulkConfirm, setBulkConfirm] = useState<
    'deactivate' | 'delete' | null
  >(null);

  // Clear the selection whenever the visible page changes.
  const pageKey = `${typeFilter}|${includeInactive}|${query}|${page}|${limit}|${sortBy ?? ''}:${sortOrder}`;
  const [lastPageKey, setLastPageKey] = useState(pageKey);
  if (pageKey !== lastPageKey) {
    setLastPageKey(pageKey);
    setSelected([]);
  }

  const refresh = useCallback(() => void refetch(), [refetch]);

  const columns = useMemo<DataViewColumn<User>[]>(
    () => [
      {
        key: 'username',
        header: 'User',
        sortable: true,
        render: (_value, user) => (
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar username={user.username} size="sm" />
            <div className="min-w-0">
              <Link
                to={`${ROUTES.USERS}/${encodeURIComponent(user.user_hash)}`}
                onClick={(event) => event.stopPropagation()}
                className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
              >
                {user.username}
                {user.user_hash === currentUser?.user_hash && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    (you)
                  </span>
                )}
              </Link>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email || 'No email'}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: 'user_type',
        header: 'Type',
        sortable: true,
        width: '110px',
        render: (_value, user) => <UserTypeBadge userType={user.user_type} />,
      },
      {
        key: 'groups',
        header: 'Groups',
        hideOnMobile: true,
        render: (_value, user) => (
          <ChipList
            items={(user.groups ?? []).map((group) => group.group_name)}
            emptyLabel="No groups"
          />
        ),
      },
      {
        key: 'projects',
        header: 'Projects',
        hideOnMobile: true,
        render: (_value, user) => (
          <ChipList
            items={(user.projects ?? []).map((project) => project.project_name)}
            emptyLabel="No access"
          />
        ),
      },
      {
        key: 'is_active',
        header: 'Status',
        width: '120px',
        render: (_value, user) =>
          user.is_active ? (
            <Badge variant="success" size="sm" dot>
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm" dot>
              Deactivated
            </Badge>
          ),
      },
      {
        key: 'last_login',
        header: 'Last sign-in',
        sortable: true,
        width: '120px',
        render: (_value, user) => (
          <span
            className="whitespace-nowrap font-mono text-xs text-muted-foreground"
            title={
              user.last_login ? formatDateTime(user.last_login) : undefined
            }
          >
            {user.last_login ? formatRelativeTime(user.last_login) : 'Never'}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: 'Created',
        sortable: true,
        width: '120px',
        hideOnMobile: true,
        render: (_value, user) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(user.created_at)}
          </span>
        ),
      },
      {
        key: 'user_hash',
        header: '',
        width: '52px',
        align: 'right',
        render: (_value, user) => (
          <div
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <UserActionsMenu user={user} onUserUpdated={refresh} />
          </div>
        ),
      },
    ],
    [currentUser?.user_hash, refresh]
  );

  const bulkActions = useMemo<BulkAction<User>[]>(
    () =>
      isAdminOrHigher
        ? [
            {
              key: 'deactivate',
              label: 'Deactivate',
              onExecute: () => setBulkConfirm('deactivate'),
            },
            {
              key: 'delete',
              label: 'Delete',
              variant: 'destructive',
              onExecute: () => setBulkConfirm('delete'),
              isDisabled: (items) => items.length > 50,
            },
          ]
        : [],
    [isAdminOrHigher]
  );

  const runBulk = async (kind: 'deactivate' | 'delete'): Promise<void> => {
    const hashes = selected
      .map((user) => user.user_hash)
      .filter((hash) => hash !== currentUser?.user_hash);
    try {
      const result =
        kind === 'deactivate'
          ? await actions.bulkDeactivate(hashes)
          : await actions.bulkDelete(hashes);
      const verb = kind === 'deactivate' ? 'deactivated' : 'deleted';
      if (result.failed > 0) {
        showToast(
          `${result.succeeded} ${verb}, ${result.failed} could not be ${verb}.`,
          'warning'
        );
      } else {
        showToast(
          `${result.succeeded} user${result.succeeded === 1 ? '' : 's'} ${verb}.`,
          'success'
        );
      }
      setBulkConfirm(null);
      setSelected([]);
      refresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'The bulk action failed.',
        'error'
      );
    }
  };

  const hasFilters = typeFilter !== 'all' || includeInactive || Boolean(query);
  const clearFilters = (): void => {
    setSearchInput('');
    updateParams({ type: null, status: null, q: null });
  };

  const subtitle =
    trustedTotal !== undefined
      ? `${formatNumber(trustedTotal)} ${typeFilter === 'all' ? '' : `${typeFilter} `}${trustedTotal === 1 ? 'account' : 'accounts'}${includeInactive ? ' including deactivated' : ''}`
      : 'People who can sign in to your projects or this console';

  const selfSelected = selected.some(
    (user) => user.user_hash === currentUser?.user_hash
  );

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh users"
            >
              <RefreshCw
                className={cn(isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {isRoot && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus aria-hidden="true" />
                Create user
              </Button>
            )}
          </>
        }
      />

      {error && users.length === 0 ? (
        <ErrorState
          title="Users could not be loaded"
          message={error}
          onRetry={refresh}
          isRetrying={isRefreshing}
        />
      ) : (
        <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
          <DataView<User>
            data={users}
            columns={columns}
            keyExtractor={(user) => user.user_hash}
            showSearch
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by username or email"
            toolbarFilters={
              <>
                <TabNavigation
                  variant="segmented"
                  size="sm"
                  ariaLabel="Filter by user type"
                  activeTab={typeFilter}
                  onChange={(tab) =>
                    updateParams({ type: tab === 'all' ? null : tab })
                  }
                  tabs={[
                    { id: 'all', label: 'All' },
                    { id: 'root', label: 'Root' },
                    { id: 'admin', label: 'Admin' },
                    { id: 'consumer', label: 'Consumer' },
                  ]}
                />
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={includeInactive}
                    onCheckedChange={(checked) =>
                      updateParams({ status: checked === true ? 'all' : null })
                    }
                  />
                  Show deactivated
                </label>
              </>
            }
            onSort={(key, direction) =>
              updateParams({ sort: `${String(key)}:${direction}` })
            }
            onRowClick={(user) =>
              void navigate(
                `${ROUTES.USERS}/${encodeURIComponent(user.user_hash)}`
              )
            }
            rowClassName={(user) =>
              user.is_active ? 'cursor-pointer' : 'cursor-pointer opacity-60'
            }
            selectable={isAdminOrHigher}
            selectionKey="user_hash"
            selectedItems={selected}
            onSelectionChange={setSelected}
            isItemSelectable={(user) =>
              user.is_active && user.user_hash !== currentUser?.user_hash
            }
            bulkActions={bulkActions}
            isLoading={isLoading}
            skeletonRows={8}
            emptyIcon={<Users className="h-8 w-8" />}
            emptyMessage={
              hasFilters ? 'No users match these filters' : 'No users yet'
            }
            emptyDescription={
              hasFilters
                ? 'Try a different search or clear the filters.'
                : 'Consumers appear here after they sign up to a project.'
            }
            emptyAction={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
            caption="Users"
          />
          <TablePager
            offset={offset}
            limit={limit}
            pageCount={users.length}
            total={trustedTotal}
            hasMore={
              trustedTotal === undefined ? users.length === limit : undefined
            }
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
            itemLabel="users"
          />
        </div>
      )}

      <CreateUserModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={(userHash) => {
          refresh();
          if (userHash)
            void navigate(`${ROUTES.USERS}/${encodeURIComponent(userHash)}`);
        }}
      />

      <ConfirmDialog
        isOpen={bulkConfirm === 'deactivate'}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('deactivate')}
        variant="warning"
        title={`Deactivate ${selected.length} user${selected.length === 1 ? '' : 's'}?`}
        message={
          <>
            They&apos;ll be signed out everywhere and can&apos;t sign in. The
            API can&apos;t reactivate accounts yet.
            {selfSelected && ' Your own account is skipped.'}
          </>
        }
        confirmText="Deactivate"
        isLoading={actions.pending === 'bulkDeactivate'}
      />
      <ConfirmDialog
        isOpen={bulkConfirm === 'delete'}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => void runBulk('delete')}
        title={`Delete ${selected.length} user${selected.length === 1 ? '' : 's'}?`}
        message="The accounts are deactivated and removed from all groups. Records are kept for auditing."
        confirmText="Delete users"
        confirmationPhrase={`delete ${selected.length}`}
        isLoading={actions.pending === 'bulkDelete'}
      />
    </PageContainer>
  );
}

export default UserListPage;
