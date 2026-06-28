import React from 'react';
import { useLocation } from 'react-router-dom';
import type { UserType } from '@/types/auth.types';
import { NAVIGATION_SECTIONS } from '@/utils/routes';
import type { NavItem } from '@/utils/routes';
import { NavigationItem } from './NavigationItem';
import { usePermissions } from '@/hooks';

interface NavigationMenuProps {
  userType: UserType | null;
}

export function NavigationMenu({ userType }: NavigationMenuProps): React.JSX.Element {
  const location = useLocation();
  const { isAuthenticated } = usePermissions();

  // Recursively filter an item (and its children) by the user's role.
  const filterItemByRole = (item: NavItem): NavItem => ({
    ...item,
    children: item.children
      ?.filter((child) => userType && child.allowedUserTypes.includes(userType))
      .map(filterItemByRole),
  });

  // Build visible sections: drop sections/items the user can't access, and
  // drop any section left with no visible items.
  const visibleSections =
    !userType || !isAuthenticated
      ? []
      : NAVIGATION_SECTIONS.filter((section) =>
          section.allowedUserTypes.includes(userType)
        )
          .map((section) => ({
            ...section,
            items: section.items
              .filter((item) => item.allowedUserTypes.includes(userType))
              .map(filterItemByRole),
          }))
          .filter((section) => section.items.length > 0);

  const topLevelPaths = visibleSections.flatMap((section) =>
    section.items.map((item) => item.path.split('?')[0])
  );

  // Top-level active state uses prefix matching for detail pages, but a more
  // specific sibling route wins. That keeps /system from staying active while
  // /system/patreon is selected.
  const isItemActive = (item: NavItem): boolean => {
    const currentPath = location.pathname;
    const itemPath = item.path.split('?')[0];

    if (itemPath === '/') {
      return currentPath === '/';
    }

    const matches = currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
    if (!matches) return false;

    return !topLevelPaths.some(
      (candidatePath) =>
        candidatePath !== itemPath &&
        candidatePath.startsWith(`${itemPath}/`) &&
        (currentPath === candidatePath || currentPath.startsWith(`${candidatePath}/`))
    );
  };

  return (
    <nav className="flex flex-col gap-1" role="navigation" aria-label="Dashboard navigation">
      {visibleSections.map((section) => (
        <div key={section.id}>
          {/* Section overline (Meridian .sb-group) */}
          <div className="px-2.5 pb-1.5 pt-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
              {section.label}
            </span>
          </div>

          <ul className="m-0 list-none space-y-0.5 p-0">
            {section.items.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={isItemActive(item)}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default NavigationMenu;
