import React from 'react';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { NavIcon } from '@/components/navigation/NavIcon';
import { UserType } from '@/types/auth.types';
import { NAVIGATION_SECTIONS } from '@/utils/routes';

/** Every console area, grouped exactly as the sidebar groups them. */
export function ConsoleAreas(): React.JSX.Element {
  return (
    <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {NAVIGATION_SECTIONS.map((section) => (
        <div key={section.id} className="min-w-0">
          <h3 className="ds-overline m-0 border-b border-border pb-3 text-muted-foreground">
            {section.label}
          </h3>
          <ul className="m-0 mt-4 list-none space-y-4 p-0">
            {section.items.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                  <NavIcon
                    icon={item.icon}
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <p className="m-0 flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                    {item.label}
                    {!item.allowedUserTypes.includes(UserType.ADMIN) && (
                      <UserTypeBadge userType={UserType.ROOT} />
                    )}
                  </p>
                  {item.description && (
                    <p className="m-0 mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ConsoleAreas;
