import {
  CreditCard,
  FileText,
  FolderKanban,
  HeartHandshake,
  Key,
  KeyRound,
  Layers,
  LayoutDashboard,
  Mail,
  Settings,
  ShieldCheck,
  User,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserType } from '@/types/auth.types';
import {
  NAVIGATION_SECTIONS,
  type NavItem,
  type NavSection,
} from '@/utils/routes';

export const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  users: User,
  'users-group': Users,
  folder: FolderKanban,
  layers: Layers,
  shield: ShieldCheck,
  'user-badge': UserCog,
  key: Key,
  'key-round': KeyRound,
  document: FileText,
  settings: Settings,
  mail: Mail,
  'heart-handshake': HeartHandshake,
  'credit-card': CreditCard,
};

export function getNavIcon(icon: string): LucideIcon {
  return NAV_ICONS[icon] ?? LayoutDashboard;
}

/** Sections and items the given user type may see, empty sections dropped. */
export function getVisibleSections(userType: UserType | null): NavSection[] {
  if (!userType) return [];
  return NAVIGATION_SECTIONS.filter((section) =>
    section.allowedUserTypes.includes(userType)
  )
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.allowedUserTypes.includes(userType)
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * Resolve the single active item. Items with a custom matcher decide for
 * themselves; the rest use prefix matching where the longest path wins, so
 * `/system/patreon` highlights Patreon rather than System.
 */
export function resolveActiveItemId(
  items: NavItem[],
  pathname: string,
  searchParams: URLSearchParams
): string | null {
  const custom = items.find((item) => item.isActive?.(pathname, searchParams));
  if (custom) return custom.id;

  let best: { id: string; length: number } | null = null;
  for (const item of items) {
    if (item.isActive) continue;
    const itemPath = item.path.split('?')[0];
    const matches =
      itemPath === '/'
        ? pathname === '/'
        : pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    if (matches && (!best || itemPath.length > best.length)) {
      best = { id: item.id, length: itemPath.length };
    }
  }
  return best?.id ?? null;
}
