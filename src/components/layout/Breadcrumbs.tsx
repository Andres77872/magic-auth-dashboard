/**
 * Breadcrumbs Component
 * 
 * Navigation breadcrumbs showing current location in the app hierarchy.
 * Automatically generates breadcrumbs from the current route path.
 * 
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ROUTES } from '@/utils/routes';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isActive: boolean;
}

export function Breadcrumbs(): React.JSX.Element {
  const location = useLocation();

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Home/Dashboard
    breadcrumbs.push({
      label: 'Home',
      path: ROUTES.DASHBOARD,
      isActive: location.pathname === ROUTES.DASHBOARD,
    });

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the first "dashboard" segment as it's already added
      if (segment === 'dashboard') return;

      const isLast = index === pathSegments.length - 1;
      const label = formatSegmentLabel(segment);

      breadcrumbs.push({
        label,
        path: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    });

    return breadcrumbs;
  };

  const formatSegmentLabel = (segment: string): string => {
    // Convert URL segment to display label
    const labelMap: Record<string, string> = {
      'users': 'Users',
      'projects': 'Projects',
      'groups': 'Groups',
      'permissions': 'Permissions',
      'system': 'System',
      'profile': 'Profile',
      'create': 'Create',
      'edit': 'Edit',
      'list': 'List',
      'details': 'Details',
      'overview': 'Overview',
      'roles': 'Roles',
      'assignments': 'Assignments',
      'health': 'Health',
      'admins': 'Admins',
      'settings': 'Settings',
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const breadcrumbs = generateBreadcrumbs();

  // Always show at least the home breadcrumb for context
  return (
    <nav 
      className="flex items-center" 
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="flex items-center list-none m-0 p-0 gap-1 flex-wrap">
        {breadcrumbs.map((item, index) => (
          <li 
            key={index} 
            className="flex items-center"
          >
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
                {index === 0 && <Home size={14} className="shrink-0" aria-hidden="true" />}
                <span className={cn(index === 0 && 'sr-only sm:not-sr-only')}>{item.label}</span>
              </Link>
            ) : (
              <span 
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md text-sm',
                  'font-medium text-foreground'
                )}
                aria-current={item.isActive ? 'page' : undefined}
              >
                {index === 0 && <Home size={14} className="shrink-0" aria-hidden="true" />}
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