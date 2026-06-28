import React, { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import type { NavItem } from '@/utils/routes';
import {
  ChevronDown,
  LayoutDashboard,
  User,
  FolderKanban,
  Users,
  ShieldCheck,
  Settings,
  UserCog,
  Key,
  FileText,
  HeartHandshake,
  Mail,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  level?: number;
}

export function NavigationItem({
  item,
  isActive,
  level = 0,
}: NavigationItemProps): React.JSX.Element {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasChildren = item.children && item.children.length > 0;

  // Exact, tab-aware active matching for a given item path. Used for child
  // items where one sibling's path may be a prefix of another (e.g.
  // /permissions vs /permissions/global-roles) or distinguished only by a
  // query tab (e.g. /groups vs /groups?tab=project-groups).
  const isPathActive = (rawPath: string): boolean => {
    const [pathname, query] = rawPath.split('?');
    const wantedTab = query ? new URLSearchParams(query).get('tab') : null;
    if (location.pathname !== pathname) return false;
    const currentTab = searchParams.get('tab');
    if (wantedTab) return currentTab === wantedTab;
    return !currentTab;
  };

  const isDescendantActive =
    !!item.children && item.children.some((child) => isPathActive(child.path));

  // A parent highlights when its own (prefix) route is active or any child is.
  const active = isActive || isDescendantActive;

  // Auto-expand when this branch becomes active; never force-collapse, so a
  // section a user opened manually stays open as they navigate. Uses the
  // "adjust state during render" pattern (no effect) to react to `active`
  // changing without a cascading re-render.
  const [expanded, setExpanded] = useState<boolean>(active);
  const [prevActive, setPrevActive] = useState<boolean>(active);
  if (active !== prevActive) {
    setPrevActive(active);
    if (active) setExpanded(true);
  }

  const childListId = `nav-children-${item.id}`;

  // Icon component based on icon name — Meridian nav icons are ~17px.
  const getIcon = (iconName: string): React.ReactElement => {
    const iconSize = 17;
    const icons: Record<string, React.ReactElement> = {
      dashboard: <LayoutDashboard size={iconSize} aria-hidden="true" />,
      users: <User size={iconSize} aria-hidden="true" />,
      folder: <FolderKanban size={iconSize} aria-hidden="true" />,
      'users-group': <Users size={iconSize} aria-hidden="true" />,
      shield: <ShieldCheck size={iconSize} aria-hidden="true" />,
      'user-badge': <UserCog size={iconSize} aria-hidden="true" />,
      key: <Key size={iconSize} aria-hidden="true" />,
      settings: <Settings size={iconSize} aria-hidden="true" />,
      document: <FileText size={iconSize} aria-hidden="true" />,
      'heart-handshake': <HeartHandshake size={iconSize} aria-hidden="true" />,
      mail: <Mail size={iconSize} aria-hidden="true" />,
      'credit-card': <CreditCard size={iconSize} aria-hidden="true" />,
    };

    return icons[iconName] || <LayoutDashboard size={iconSize} aria-hidden="true" />;
  };

  return (
    <li className="relative">
      <div className="relative flex items-center">
        <Link
          to={item.path}
          className={cn(
            'group relative flex flex-1 items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] font-medium no-underline transition-colors',
            'text-muted-foreground hover:bg-accent hover:text-foreground',
            active && 'bg-primary/15 text-foreground hover:bg-primary/15',
            level > 0 && 'text-[12.5px]'
          )}
          aria-current={!hasChildren && isActive ? 'page' : undefined}
        >
          {/* Active accent bar (Meridian .sb-item.active::before) */}
          {active && (
            <span
              className="absolute -left-2.5 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary"
              aria-hidden="true"
            />
          )}

          <span
            className={cn(
              'flex shrink-0 items-center justify-center',
              active
                ? 'text-primary'
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            {getIcon(item.icon)}
          </span>

          <span className="flex-1 truncate">{item.label}</span>
        </Link>

        {hasChildren && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-expanded={expanded}
            aria-controls={childListId}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${item.label} submenu`}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                expanded && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Nested sub-items */}
      {hasChildren && expanded && (
        <ul
          id={childListId}
          className="m-0 mt-0.5 list-none space-y-0.5 p-0 pl-5"
        >
          {item.children?.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isActive={isPathActive(child.path)}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default NavigationItem;
