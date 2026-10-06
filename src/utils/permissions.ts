import type { UserType } from '@/types/auth.types';

/**
 * Route prefixes reserved for ROOT users. Keep in sync with the RootOnlyRoute
 * guards in App.tsx (currently /system, /system/patreon, /email-templates).
 */
const ROOT_ONLY_ROUTE_PREFIXES = ['/system', '/email-templates'] as const;

// Check if user can access route (UX-only hint; real enforcement is in guards)
export function canAccessRoute(userType: UserType, routePath: string): boolean {
  if (userType === 'root') {
    return true;
  }

  if (userType === 'admin') {
    return !ROOT_ONLY_ROUTE_PREFIXES.some((prefix) =>
      routePath.startsWith(prefix)
    );
  }

  return false; // CONSUMER cannot access dashboard
}
