import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  hidden?: boolean;
}

export interface ActionsMenuProps {
  items: ActionMenuItem[];
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  placement?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  usePortal?: boolean;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

const alignMap = {
  'bottom-right': 'end' as const,
  'bottom-left': 'start' as const,
  'top-right': 'end' as const,
  'top-left': 'start' as const,
};

const sideMap = {
  'bottom-right': 'bottom' as const,
  'bottom-left': 'bottom' as const,
  'top-right': 'top' as const,
  'top-left': 'top' as const,
};

export function ActionsMenu({
  items,
  triggerLabel,
  triggerIcon = <MoreHorizontal className="h-4 w-4" />,
  triggerClassName,
  menuClassName,
  placement = 'bottom-right',
  ariaLabel = 'Actions menu',
  size = 'md',
}: ActionsMenuProps): React.JSX.Element {
  const visibleItems = items.filter((item) => !item.hidden);
  const regularItems = visibleItems.filter((item) => !item.destructive);
  const destructiveItems = visibleItems.filter((item) => item.destructive);
  const hasDivider = regularItems.length > 0 && destructiveItems.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn('h-8 w-8 p-0', triggerClassName)}
          aria-label={ariaLabel}
        >
          {triggerIcon}
          {triggerLabel && <span className="ml-2">{triggerLabel}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={alignMap[placement]}
        side={sideMap[placement]}
        className={cn('min-w-[180px]', menuClassName)}
      >
        {regularItems.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={item.onClick}
            disabled={item.disabled}
            className="gap-2"
          >
            {item.icon && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
        {hasDivider && <DropdownMenuSeparator />}
        {destructiveItems.map((item) => (
          <DropdownMenuItem
            key={item.key}
            onClick={item.onClick}
            disabled={item.disabled}
            destructive
            className="gap-2"
          >
            {item.icon && (
              <span className="[&>svg]:h-4 [&>svg]:w-4" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActionsMenu;
