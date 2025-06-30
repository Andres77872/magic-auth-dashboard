import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronIcon } from '@/components/icons';
import { ROUTES } from '@/utils/routes';

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
      label: 'Dashboard',
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

  if (breadcrumbs.length <= 1) {
    return <></>; // Don't show breadcrumbs for single-level pages
  }

  return (
    <nav 
      className="breadcrumbs" 
      aria-label="Breadcrumb navigation"
      role="navigation"
    >
      <ol className="breadcrumb-list">
        {breadcrumbs.map((item, index) => (
          <li 
            key={index} 
            className={`breadcrumb-item ${item.isActive ? 'active' : ''}`}
          >
            {item.path && !item.isActive ? (
              <Link 
                to={item.path} 
                className="breadcrumb-link"
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span 
                className="breadcrumb-text"
                aria-current={item.isActive ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            
            {index < breadcrumbs.length - 1 && (
              <ChevronIcon 
                className="breadcrumb-separator" 
                size="small"
                direction="right"
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