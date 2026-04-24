/**
 * Breadcrumbs Component
 *
 * Navigation breadcrumbs showing current location in the app hierarchy.
 * Automatically generates breadcrumbs from the current route path and query params.
 *
 * Per spec.md requirements for flat URLs (lines 427-490):
 * - `/` → "Overview" (single item, no prefix)
 * - `/users` → "Users" (single item, no Home prefix)
 * - `/users/:hash` → "Users > :hash" (parent-child)
 * - `/projects/:hash` → "Projects > :hash"
 * - `/groups?tab=project-groups` → "Groups > Project Groups" (query param reflected)
 * - `/profile` → "Profile" (single, no prefix — personal route)
 * - `/settings` → "Settings" (single, no prefix — personal route)
 *
 * @see .dev/sdd/changes/navigation-url-flattening/spec.md (lines 427-490)
 */
import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive: boolean;
}

// Personal routes without prefix per spec (lines 427-430)
const PERSONAL_ROUTES = ['/profile', '/settings'] as const;

// Section routes that get direct labels per spec (lines 441-474)
const SECTION_ROUTES = [
  '/users',
  '/projects',
  '/groups',
  '/permissions',
  '/roles',
  '/tokens',
  '/audit',
  '/system',
] as const;

export function Breadcrumbs(): React.JSX.Element {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Generate breadcrumbs from current path and query params
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathname = location.pathname;

    // Handle personal routes (/profile, /settings) — single breadcrumb per spec
    if (PERSONAL_ROUTES.includes(pathname)) {
      const label = pathname === '/profile' ? 'Profile' : 'Settings';
      return [{ label, isActive: true }];
    }

    // Handle root path — "Overview" per spec line 437
    if (pathname === '/') {
      return [{ label: 'Overview', path: ROUTES.HOME, isActive: true }];
    }

    // Handle section routes (top-level flat routes) — direct label per spec lines 441-474
    if (SECTION_ROUTES.includes(pathname)) {
      const tabParam = searchParams.get('tab');
      const sectionLabel = formatSegmentLabel(pathname.slice(1)); // Remove leading /

      // If there's a tab query param, add it as child breadcrumb
      if (tabParam) {
        const tabLabel = formatTabLabel(tabParam);
        return [
          { label: sectionLabel, path: pathname, isActive: false },
          { label: tabLabel, isActive: true },
        ];
      }

      return [{ label: sectionLabel, isActive: true }];
    }

    // Handle nested routes (entity detail pages) — parent-child pattern per spec
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const label = formatSegmentLabel(segment);

      // For entity hashes (last segment that looks like a hash), show truncated version
      const isEntityHash = isLast && segment.length > 8 && !isNaN(Number(segment.charAt(0)));

      breadcrumbs.push({
        label: isEntityHash ? truncateHash(segment) : label,
        path: isLast ? undefined : currentPath,
        isActive: isLast && !searchParams.get('tab'),
      });
    });

    // Handle tab query param for nested routes
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      breadcrumbs.push({
        label: formatTabLabel(tabParam),
        isActive: true,
      });
    }

    return breadcrumbs;
  };

  const formatSegmentLabel = (segment: string): string => {
    // Convert URL segment to display label
    const labelMap: Record<string, string> = {
      'users': 'Users',
      'projects': 'Projects',
      'groups': 'Groups',
      'permissions': 'Permissions',
      'roles': 'Roles',
      'tokens': 'API Tokens',
      'audit': 'Audit Logs',
      'system': 'System',
      'profile': 'Profile',
      'settings': 'Settings',
      'create': 'Create',
      'edit': 'Edit',
      'project-groups': 'Project Groups',
      'global-roles': 'Global Roles',
      'management': 'Management',
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const formatTabLabel = (tabParam: string): string => {
    // Convert tab query param to display label
    const tabLabelMap: Record<string, string> = {
      'project-groups': 'Project Groups',
      'global-roles': 'Global Roles',
      'assignments': 'Assignments',
      'analytics': 'Analytics',
      'security': 'Security',
      'admins': 'Admins',
      'members': 'Members',
      'groups': 'Groups',
      'activity': 'Activity',
      'details': 'Details',
    };

    return tabLabelMap[tabParam] || formatSegmentLabel(tabParam);
  };

  const truncateHash = (hash: string): string => {
    // Truncate entity hash for display (8 chars visible)
    if (hash.length <= 8) return hash;
    return `${hash.slice(0, 8)}...`;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Render breadcrumbs
  return (
    <nav
      className="flex items-center"
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="flex items-center list-none m-0 p-0 gap-1 flex-wrap">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.path && !item.isActive ? (
              <Link
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
                  'text-muted-foreground no-underline',
                  'transition-all duration-200',
                  'hover:text-foreground hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                )}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
                  'font-medium text-foreground'
                )}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <span>{item.label}</span>
              </span>
            )}

            {index < breadcrumbs.length - 1 && (
              <ChevronRight
                size={14}
                className="text-muted-foreground/50 shrink-0 mx-0.5"
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;