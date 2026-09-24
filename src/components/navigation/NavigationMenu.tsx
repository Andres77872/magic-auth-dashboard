import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { UserType } from '@/types/auth.types';
import { NavigationItem } from './NavigationItem';
import { getVisibleSections, resolveActiveItemId } from './nav-utils';
import { usePermissions } from '@/hooks';

interface NavigationMenuProps {
  userType: UserType | null;
  /** Called after a link is followed (closes the mobile drawer). */
  onNavigate?: () => void;
}

export function NavigationMenu({
  userType,
  onNavigate,
}: NavigationMenuProps): React.JSX.Element {
  const location = useLocation();
  const { isAuthenticated } = usePermissions();

  const visibleSections = useMemo(
    () => (isAuthenticated ? getVisibleSections(userType) : []),
    [isAuthenticated, userType]
  );

  const activeId = resolveActiveItemId(
    visibleSections.flatMap((section) => section.items),
    location.pathname,
    new URLSearchParams(location.search)
  );

  return (
    <nav className="flex flex-col gap-3" aria-label="Dashboard navigation">
      {visibleSections.map((section) => (
        <div key={section.id}>
          <div className="px-2.5 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground/80">
              {section.label}
            </span>
          </div>
          <ul className="m-0 list-none space-y-px p-0">
            {section.items.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={item.id === activeId}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default NavigationMenu;
