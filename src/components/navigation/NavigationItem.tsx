import React from 'react';
import { Link } from 'react-router-dom';
import type { NavItem } from '@/utils/routes';
import { NavIcon } from './NavIcon';
import { cn } from '@/lib/utils';

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}

export function NavigationItem({
  item,
  isActive,
  onNavigate,
}: NavigationItemProps): React.JSX.Element {
  return (
    <li>
      <Link
        to={item.path}
        onClick={onNavigate}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium no-underline transition-colors',
          isActive
            ? 'bg-primary-subtle text-foreground before:absolute before:inset-y-1.5 before:-left-2.5 before:w-[3px] before:rounded-r-full before:bg-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
        )}
      >
        <NavIcon
          icon={item.icon}
          size={17}
          aria-hidden="true"
          className={cn(
            'shrink-0',
            isActive
              ? 'text-primary'
              : 'text-muted-foreground group-hover:text-foreground'
          )}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}

export default NavigationItem;
