import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  CornerDownLeft,
  FolderKanban,
  Layers,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import { useUserType } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  groupService,
  projectGroupService,
  projectService,
  userService,
} from '@/services';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { Avatar } from '@/components/ui/avatar';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';
import { getVisibleSections } from './nav-utils';
import { NavIcon } from './NavIcon';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResultKind = 'page' | 'user' | 'project' | 'user-group' | 'project-group';

interface CommandResult {
  id: string;
  kind: ResultKind;
  label: string;
  hint?: string;
  path: string;
  icon: React.ReactNode;
  meta?: React.ReactNode;
}

const GROUP_LABELS: Record<ResultKind, string> = {
  page: 'Pages',
  user: 'Users',
  project: 'Projects',
  'user-group': 'User groups',
  'project-group': 'Project groups',
};

const SEARCH_LIMIT = 5;
const MIN_QUERY = 2;

/**
 * Global ⌘K / Ctrl+K palette: jump to any page, or find a user, project or
 * group by name. Entity search runs server-side with small result limits.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps): React.JSX.Element {
  const navigate = useNavigate();
  const { userType } = useUserType();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [entitySearch, setEntitySearch] = useState<{
    query: string;
    results: CommandResult[];
    failed: boolean;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 250);

  const pageResults = useMemo<CommandResult[]>(() => {
    const q = query.trim().toLowerCase();
    const extra = [
      {
        id: 'profile',
        label: 'Your profile',
        description: 'Account and access',
        path: ROUTES.PROFILE,
        icon: 'users',
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Session and preferences',
        path: ROUTES.SETTINGS,
        icon: 'settings',
      },
    ];
    const items = [
      ...getVisibleSections(userType).flatMap((section) =>
        section.items.map((item) => ({ ...item, section: section.label }))
      ),
      ...extra.map((item) => ({ ...item, section: 'Account' })),
    ];
    return items
      .filter(
        (item) =>
          !q ||
          item.label.toLowerCase().includes(q) ||
          (item.description ?? '').toLowerCase().includes(q)
      )
      .map((item) => ({
        id: `page-${item.id}`,
        kind: 'page' as const,
        label: item.label,
        hint: item.description,
        path: item.path,
        icon: (
          <NavIcon icon={item.icon} className="h-4 w-4" aria-hidden="true" />
        ),
      }));
  }, [query, userType]);

  // Server-side entity search.
  useEffect(() => {
    if (!open || debouncedQuery.length < MIN_QUERY) return;

    let cancelled = false;

    void Promise.allSettled([
      userService.searchUsers({ q: debouncedQuery, limit: SEARCH_LIMIT }),
      projectService.getProjects({
        search: debouncedQuery,
        limit: SEARCH_LIMIT,
      }),
      groupService.getGroups({ search: debouncedQuery, limit: SEARCH_LIMIT }),
      projectGroupService.getProjectGroups({
        search: debouncedQuery,
        limit: SEARCH_LIMIT,
      }),
    ]).then(([users, projects, groups, projectGroups]) => {
      if (cancelled) return;
      const next: CommandResult[] = [];

      if (users.status === 'fulfilled') {
        for (const user of users.value.users ?? []) {
          next.push({
            id: `user-${user.user_hash}`,
            kind: 'user',
            label: user.username,
            hint: user.email ?? undefined,
            path: `${ROUTES.USERS}/${encodeURIComponent(user.user_hash)}`,
            icon: <Avatar name={user.username} size="xs" />,
            meta: <UserTypeBadge userType={user.user_type} />,
          });
        }
      }
      if (projects.status === 'fulfilled') {
        for (const project of (projects.value.projects ?? []).slice(
          0,
          SEARCH_LIMIT
        )) {
          next.push({
            id: `project-${project.project_hash}`,
            kind: 'project',
            label: project.project_name,
            hint: project.project_description ?? undefined,
            path: `${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}`,
            icon: <FolderKanban className="h-4 w-4" aria-hidden="true" />,
          });
        }
      }
      if (groups.status === 'fulfilled') {
        for (const group of groups.value.user_groups ?? []) {
          next.push({
            id: `user-group-${group.group_hash}`,
            kind: 'user-group',
            label: group.group_name,
            hint: group.description ?? undefined,
            path: `${ROUTES.GROUPS}/${encodeURIComponent(group.group_hash)}`,
            icon: <Users className="h-4 w-4" aria-hidden="true" />,
          });
        }
      }
      if (projectGroups.status === 'fulfilled') {
        for (const group of projectGroups.value.project_groups ?? []) {
          next.push({
            id: `project-group-${group.group_hash}`,
            kind: 'project-group',
            label: group.group_name,
            hint: group.description ?? undefined,
            path: `${ROUTES.PROJECT_GROUPS}/${encodeURIComponent(group.group_hash)}`,
            icon: <Layers className="h-4 w-4" aria-hidden="true" />,
          });
        }
      }

      setEntitySearch({
        query: debouncedQuery,
        results: next,
        failed: [users, projects, groups, projectGroups].every(
          (r) => r.status === 'rejected'
        ),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const trimmedQuery = query.trim();
  const wantsEntities = open && trimmedQuery.length >= MIN_QUERY;
  // Keep the previous results on screen while the next search is in flight.
  const entityResults = useMemo(
    () => (wantsEntities && entitySearch ? entitySearch.results : []),
    [wantsEntities, entitySearch]
  );
  const searching = wantsEntities && entitySearch?.query !== trimmedQuery;
  const searchFailed =
    wantsEntities && !searching && Boolean(entitySearch?.failed);

  const results = useMemo(
    () => [...pageResults, ...entityResults],
    [pageResults, entityResults]
  );

  // Reset the highlighted row when the result set changes.
  const resultKey = results.map((r) => r.id).join('|');
  const [prevResultKey, setPrevResultKey] = useState(resultKey);
  if (resultKey !== prevResultKey) {
    setPrevResultKey(resultKey);
    setActiveIndex(0);
  }

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setQuery('');
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const select = useCallback(
    (result: CommandResult | undefined) => {
      if (!result) return;
      handleOpenChange(false);
      void navigate(result.path);
    },
    [handleOpenChange, navigate]
  );

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  const grouped = useMemo(() => {
    const groups: {
      kind: ResultKind;
      items: { result: CommandResult; index: number }[];
    }[] = [];
    results.forEach((result, index) => {
      let group = groups.find((g) => g.kind === result.kind);
      if (!group) {
        group = { kind: result.kind, items: [] };
        groups.push(group);
      }
      group.items.push({ result, index });
    });
    return groups;
  }, [results]);

  const activeId = results[activeIndex]
    ? `cmd-${results[activeIndex].id}`
    : undefined;
  const showEntityHint =
    trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Search and navigate
          </DialogPrimitive.Title>
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, users, projects, groups…"
              className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-palette-results"
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-label="Search pages, users, projects and groups"
            />
            {searching && (
              <Loader2
                className="h-4 w-4 animate-spin text-muted-foreground"
                aria-label="Searching"
              />
            )}
          </div>

          <div
            ref={listRef}
            id="command-palette-results"
            role="listbox"
            aria-label="Results"
            className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5"
          >
            {grouped.map((group) => (
              <div
                key={group.kind}
                role="group"
                aria-label={GROUP_LABELS[group.kind]}
                className="pb-1"
              >
                <div className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                  {GROUP_LABELS[group.kind]}
                </div>
                {group.items.map(({ result, index }) => (
                  <div
                    key={result.id}
                    id={`cmd-${result.id}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    data-index={index}
                    onMouseMove={() => setActiveIndex(index)}
                    onClick={() => select(result)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-[13px]',
                      index === activeIndex
                        ? 'bg-accent text-foreground'
                        : 'text-foreground/90'
                    )}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
                      {result.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {result.label}
                      </span>
                      {result.hint && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {result.hint}
                        </span>
                      )}
                    </span>
                    {result.meta}
                    {index === activeIndex && (
                      <CornerDownLeft
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {results.length === 0 && !searching && (
              <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
                {searchFailed
                  ? 'Search is unavailable right now. Try again in a moment.'
                  : `No matches for “${trimmedQuery}”.`}
              </p>
            )}
            {showEntityHint && (
              <p className="px-3 pb-2 pt-1 text-xs text-muted-foreground">
                Type at least {MIN_QUERY} characters to search users, projects
                and groups.
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <span>
              <kbd className="font-mono">↑↓</kbd> to move
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> to open
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> to close
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default CommandPalette;
