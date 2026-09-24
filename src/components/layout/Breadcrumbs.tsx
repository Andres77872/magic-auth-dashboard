/**
 * Breadcrumb trail derived from the current URL.
 *
 * - `/` → "Overview"
 * - `/users` → "Users"; `/users/:hash` → "Users › <username>"
 * - `/groups?tab=project-groups` and `/groups/project-groups/...` → "Project groups ..."
 * - a `?tab=` value on any page is appended as the last crumb
 *
 * Detail pages publish a friendly leaf label (username, project name) through
 * BreadcrumbLabelContext; until then the opaque id is shown truncated.
 */
import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/utils/routes';
import { useBreadcrumbLabel } from '@/contexts';
import { truncateHash } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  path?: string;
}

const SECTION_LABELS: Record<string, string> = {
  users: 'Users',
  projects: 'Projects',
  groups: 'User groups',
  permissions: 'Roles & permissions',
  roles: 'Roles & permissions',
  tokens: 'API keys',
  audit: 'Audit log',
  billing: 'Billing',
  oauth: 'OAuth',
  system: 'System',
  'email-templates': 'Email templates',
  profile: 'Your profile',
  settings: 'Settings',
};

const WORD_LABELS: Record<string, string> = {
  create: 'New',
  edit: 'Edit',
  patreon: 'Patreon',
  'global-roles': 'Global roles',
  'permission-groups': 'Permission groups',
  'project-groups': 'Project groups',
  'user-groups': 'User groups',
  'sign-in': 'Sign-in',
  'api-keys': 'API keys',
  oauth: 'OAuth',
  sso: 'SSO',
};

/** kebab-case → Sentence case, with a few product terms kept intact. */
function humanizeSegment(segment: string): string {
  if (WORD_LABELS[segment]) return WORD_LABELS[segment];
  const words = decodeURIComponent(segment).replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const PROJECT_GROUPS_LIST = `${ROUTES.GROUPS}?tab=project-groups`;

function buildCrumbs(
  pathname: string,
  tab: string | null,
  entityLabel: string | null
): Crumb[] {
  if (pathname === '/') return [{ label: 'Overview' }];

  const segments = pathname.split('/').filter(Boolean);
  const [section, ...rest] = segments;
  const crumbs: Crumb[] = [];

  // Project groups live under /groups but are their own area in the UI.
  if (
    section === 'groups' &&
    (rest[0] === 'project-groups' || tab === 'project-groups')
  ) {
    crumbs.push({ label: 'Project groups', path: PROJECT_GROUPS_LIST });
    const [, action, id] = rest;
    if (action === 'create') crumbs.push({ label: 'New project group' });
    else if (action === 'edit' && id)
      crumbs.push({ label: entityLabel ? `Edit ${entityLabel}` : 'Edit' });
    else if (action)
      crumbs.push({
        label:
          entityLabel ?? truncateHash(action, { startChars: 10, endChars: 4 }),
      });
    return markLast(crumbs);
  }

  crumbs.push({
    label: SECTION_LABELS[section] ?? humanizeSegment(section),
    path: `/${section}`,
  });

  rest.forEach((segment, index) => {
    const isLast = index === rest.length - 1;
    const isKeyword = Boolean(WORD_LABELS[segment]);
    const label =
      isLast && entityLabel
        ? entityLabel
        : isKeyword
          ? humanizeSegment(segment)
          : truncateHash(decodeURIComponent(segment), {
              startChars: 10,
              endChars: 4,
            });
    crumbs.push({ label, path: `/${segments.slice(0, index + 2).join('/')}` });
  });

  if (tab && humanizeSegment(tab) !== crumbs[crumbs.length - 1]?.label) {
    crumbs.push({ label: humanizeSegment(tab) });
  }

  return markLast(crumbs);
}

/** The last crumb is the current page and never a link. */
function markLast(crumbs: Crumb[]): Crumb[] {
  return crumbs.map((crumb, index) =>
    index === crumbs.length - 1 ? { label: crumb.label } : crumb
  );
}

export function Breadcrumbs(): React.JSX.Element {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { label: entityLabel } = useBreadcrumbLabel();
  const crumbs = buildCrumbs(
    location.pathname,
    searchParams.get('tab'),
    entityLabel
  );

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="m-0 flex min-w-0 list-none items-center gap-1 p-0">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li
              key={`${index}-${crumb.label}`}
              className={cn(
                'flex min-w-0 items-center gap-1',
                !isLast && 'hidden sm:flex'
              )}
            >
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  className="truncate rounded px-1 py-0.5 text-[13px] text-muted-foreground no-underline transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className="truncate px-1 py-0.5 text-[13px] font-medium text-foreground"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  size={14}
                  className="shrink-0 text-muted-foreground/60"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
