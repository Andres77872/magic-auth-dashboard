import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, RefreshCw } from 'lucide-react';
import {
  DataView,
  ErrorState,
  PageContainer,
  PageHeader,
  TablePager,
  type DataViewColumn,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import { ProjectAccessBadge } from '@/components/features/projects/ProjectAccessBadge';
import { ProjectActionsMenu } from '@/components/features/projects/ProjectActionsMenu';
import { ProjectFormModal } from '@/components/features/projects/ProjectFormModal';
import { DeleteProjectDialog } from '@/components/features/projects/DeleteProjectDialog';
import { useProjects, type ProjectSortKey } from '@/hooks/useProjects';
import { useUserType } from '@/hooks/useUserType';
import { PROJECT_LIST_MAX_LIMIT } from '@/services/project.service';
import { formatCount, formatNumber } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import type { ProjectSummary } from '@/types/project.types';

const PAGE_SIZES = [25, 50, 100];
const SORT_KEYS: readonly ProjectSortKey[] = ['project_name', 'access_level'];

function projectPath(projectHash: string): string {
  return `${ROUTES.PROJECTS}/${encodeURIComponent(projectHash)}`;
}

export function ProjectListPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { isRoot } = useUserType();
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL holds search, page, page size and sort so views are shareable.
  const query = searchParams.get('q') ?? '';
  const limit = PAGE_SIZES.includes(Number(searchParams.get('limit')))
    ? Number(searchParams.get('limit'))
    : 25;
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get('page') ?? '1', 10) || 1
  );
  const requestedOffset = (page - 1) * limit;
  const [sortKey, sortDir] = (searchParams.get('sort') ?? '').split(':');
  const sortBy = (SORT_KEYS as readonly string[]).includes(sortKey)
    ? (sortKey as ProjectSortKey)
    : 'project_name';
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

  const {
    projects,
    offset,
    total,
    truncated,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useProjects({
    search: query,
    offset: requestedOffset,
    limit,
    sortBy,
    sortOrder,
  });
  const refresh = useCallback(() => void refetch(), [refetch]);

  // The dialog keeps its last mode while it animates closed.
  const [form, setForm] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    project: ProjectSummary | null;
  }>({
    open: false,
    mode: 'create',
    project: null,
  });
  const openCreate = (): void =>
    setForm({ open: true, mode: 'create', project: null });
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);

  const columns = useMemo<DataViewColumn<ProjectSummary>[]>(
    () => [
      {
        key: 'project_name',
        header: 'Project',
        sortable: true,
        render: (_value, project) => (
          <div className="min-w-0">
            <Link
              to={projectPath(project.project_hash)}
              onClick={(event) => event.stopPropagation()}
              className="block truncate text-[13px] font-medium text-foreground no-underline hover:underline"
            >
              {project.project_name}
            </Link>
            <span className="block max-w-[640px] truncate text-xs text-muted-foreground">
              {project.project_description || 'No description'}
            </span>
          </div>
        ),
      },
      {
        key: 'access_level',
        header: 'Your access',
        sortable: true,
        width: '150px',
        render: (_value, project) => (
          <ProjectAccessBadge accessLevel={project.access_level} />
        ),
      },
      {
        key: 'project_hash',
        header: '',
        width: '52px',
        align: 'right',
        render: (_value, project) => (
          <ProjectActionsMenu
            project={project}
            onEdit={(row) =>
              setForm({ open: true, mode: 'edit', project: row })
            }
            onDelete={setDeleteTarget}
          />
        ),
      },
    ],
    []
  );

  const subtitle = isLoading
    ? 'Loading projects…'
    : [
        query
          ? `${formatCount(total, 'project')} matching “${query}”`
          : isRoot
            ? formatCount(total, 'project')
            : `${formatCount(total, 'project')} you administer`,
        truncated
          ? `showing the first ${formatNumber(PROJECT_LIST_MAX_LIMIT)}`
          : null,
        isRoot ? null : 'New projects are created by root users',
      ]
        .filter(Boolean)
        .join(' · ');

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        subtitle={subtitle}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh projects"
            >
              <RefreshCw
                className={cn(isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {isRoot && (
              <Button onClick={openCreate}>
                <Plus aria-hidden="true" />
                Create project
              </Button>
            )}
          </>
        }
      />

      {error && total === 0 ? (
        <ErrorState
          title="Projects could not be loaded"
          message={error}
          onRetry={refresh}
          isRetrying={isRefreshing}
        />
      ) : (
        <div className={cn('transition-opacity', isRefreshing && 'opacity-70')}>
          {error && (
            <p className="mb-3 text-xs text-destructive" role="alert">
              The list could not be refreshed: {error}
            </p>
          )}
          <DataView<ProjectSummary>
            data={projects}
            columns={columns}
            keyExtractor={(project) => project.project_hash}
            showSearch
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Search by name or description"
            onSort={(key, direction) =>
              updateParams({ sort: `${String(key)}:${direction}` })
            }
            onRowClick={(project) =>
              void navigate(projectPath(project.project_hash))
            }
            isLoading={isLoading}
            skeletonRows={8}
            emptyIcon={<FolderKanban className="h-8 w-8" />}
            emptyMessage={
              query
                ? 'No projects match this search'
                : isRoot
                  ? 'No projects yet'
                  : 'No projects assigned'
            }
            emptyDescription={
              query
                ? 'Try a different name or description.'
                : isRoot
                  ? 'Create a project for each application your users sign in to.'
                  : 'A root user makes you a project administrator by adding you to its admin group.'
            }
            emptyAction={
              query ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSearchInput('')}
                >
                  Clear search
                </Button>
              ) : isRoot ? (
                <Button size="sm" onClick={openCreate}>
                  Create project
                </Button>
              ) : undefined
            }
            caption="Projects"
          />
          <TablePager
            offset={offset}
            limit={limit}
            pageCount={projects.length}
            total={total}
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
            itemLabel="projects"
          />
          {truncated && (
            <p className="mt-2 text-xs text-muted-foreground">
              The API returns at most {formatNumber(PROJECT_LIST_MAX_LIMIT)}{' '}
              projects per request, so some may not be listed. Search by name to
              find them.
            </p>
          )}
        </div>
      )}

      <ProjectFormModal
        open={form.open}
        onOpenChange={(open) => setForm((prev) => ({ ...prev, open }))}
        mode={form.mode}
        project={form.project}
        onSaved={(saved) => {
          if (form.mode === 'create') {
            void navigate(projectPath(saved.project_hash));
          } else {
            refresh();
          }
        }}
      />

      {deleteTarget && (
        <DeleteProjectDialog
          project={deleteTarget}
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            refresh();
          }}
        />
      )}
    </PageContainer>
  );
}

export default ProjectListPage;
