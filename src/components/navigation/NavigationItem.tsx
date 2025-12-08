import React from 'react';
import { Link } from 'react-router-dom';
import type { NavItem } from '@/utils/routes';
import { 
  ChevronDown, 
  LayoutDashboard, 
  User, 
  FolderKanban, 
  Users, 
  ShieldCheck, 
  Settings, 
  UserCog 
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  level?: number;
}

export function NavigationItem({
  item,
  isActive,
  collapsed,
  level = 0,
}: NavigationItemProps): React.JSX.Element {
  const hasChildren = item.children && item.children.length > 0;

  // Get icon component based on icon name - consistent 20px size
  const getIcon = (iconName: string) => {
    const iconSize = 20;
    const icons: Record<string, React.ReactElement> = {
      dashboard: <LayoutDashboard size={iconSize} aria-hidden="true" />,
      users: <User size={iconSize} aria-hidden="true" />,
      folder: <FolderKanban size={iconSize} aria-hidden="true" />,
      'users-group': <Users size={iconSize} aria-hidden="true" />,
      shield: <ShieldCheck size={iconSize} aria-hidden="true" />,
      'user-badge': <UserCog size={iconSize} aria-hidden="true" />,
      settings: <Settings size={iconSize} aria-hidden="true" />,
    };

    return icons[iconName] || <LayoutDashboard size={iconSize} aria-hidden="true" />;
  };

  const linkContent = (
    <Link
      to={item.path}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg',
        'no-underline transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        // Default state
        'text-muted-foreground',
        // Hover state
        'hover:bg-muted hover:text-foreground',
        // Collapsed state centering
        collapsed && 'justify-center px-0',
        // Active state
        isActive && [
          'bg-primary text-primary-foreground shadow-md',
          'hover:bg-primary/90 hover:text-primary-foreground',
        ]
      )}
      aria-label={collapsed ? item.label : undefined}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active indicator bar */}
      {isActive && !collapsed && (
        <span 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground/30 rounded-r-full"
          aria-hidden="true" 
        />
      )}

      {/* Icon */}
      <span 
        className={cn(
          'flex items-center justify-center shrink-0 transition-transform duration-200',
          !collapsed && 'group-hover:scale-110',
          collapsed && 'w-10 h-10 rounded-lg',
          collapsed && !isActive && 'group-hover:bg-muted',
          collapsed && isActive && 'bg-primary-foreground/10'
        )}
      >
        {getIcon(item.icon)}
      </span>
      
      {/* Label */}
      {!collapsed && (
        <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
      )}

      {/* Expand indicator for items with children */}
      {!collapsed && hasChildren && (
        <span className="ml-auto transition-transform" aria-hidden="true">
          <ChevronDown className="h-4 w-4 opacity-50" />
        </span>
      )}
    </Link>
  );

  return (
    <li className="relative">
      {collapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkContent}
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              sideOffset={12}
              className="font-medium"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        linkContent
      )}

      {/* Nested items (for future expansion) */}
      {!collapsed && hasChildren && (
        <ul className="list-none m-0 p-0 pl-4 mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isActive={isActive}
              collapsed={false}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default NavigationItem; 