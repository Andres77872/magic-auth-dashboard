import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { UserType } from '@/types/auth.types';
import { NAVIGATION_ITEMS } from '@/utils/routes';
import { getVisibleSections, resolveActiveItemId } from '../nav-utils';
import { NavigationMenu } from '../NavigationMenu';

vi.mock('@/hooks', () => ({
  usePermissions: () => ({ isAuthenticated: true }),
}));

const active = (path: string): string | null => {
  const [pathname, search = ''] = path.split('?');
  return resolveActiveItemId(
    NAVIGATION_ITEMS,
    pathname,
    new URLSearchParams(search)
  );
};

describe('navigation visibility', () => {
  it('shows every section to root', () => {
    expect(getVisibleSections(UserType.ROOT).map((s) => s.id)).toEqual([
      'overview',
      'access-management',
      'operations',
      'system',
    ]);
  });

  it('hides the root-only System section from admins', () => {
    const ids = getVisibleSections(UserType.ADMIN).flatMap((s) =>
      s.items.map((i) => i.id)
    );
    expect(ids).toContain('users');
    expect(ids).toContain('permissions');
    expect(ids).not.toContain('system');
    expect(ids).not.toContain('email-templates');
    expect(ids).not.toContain('patreon');
  });

  it('shows nothing to consumers or signed-out visitors', () => {
    expect(getVisibleSections(UserType.CONSUMER)).toEqual([]);
    expect(getVisibleSections(null)).toEqual([]);
  });

  it('links every item exactly once', () => {
    const ids = NAVIGATION_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('active item resolution', () => {
  it.each([
    ['/', 'home'],
    ['/users', 'users'],
    ['/users/usr-1', 'users'],
    ['/groups', 'user-groups'],
    ['/groups/ug-1', 'user-groups'],
    ['/groups?tab=project-groups', 'project-groups'],
    ['/groups/project-groups/pg-1', 'project-groups'],
    ['/groups/project-groups/create', 'project-groups'],
    ['/projects/proj-1', 'projects'],
    ['/permissions?tab=permissions', 'permissions'],
    ['/roles', 'permissions'],
    ['/audit?tab=security', 'audit'],
    ['/system', 'system'],
    ['/system/patreon', 'patreon'],
    ['/email-templates/welcome', 'email-templates'],
  ])('%s highlights %s', (path, expected) => {
    expect(active(path)).toBe(expected);
  });

  it('highlights nothing for personal pages', () => {
    expect(active('/profile')).toBeNull();
    expect(active('/settings')).toBeNull();
  });
});

describe('NavigationMenu', () => {
  it('marks only the current item with aria-current', () => {
    render(
      <MemoryRouter initialEntries={['/groups?tab=project-groups']}>
        <NavigationMenu userType={UserType.ADMIN} />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('link', { name: 'Project groups' })
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('link', { name: 'User groups' })
    ).not.toHaveAttribute('aria-current');
    expect(
      screen.queryByRole('link', { name: 'System' })
    ).not.toBeInTheDocument();
  });

  it('calls onNavigate when a link is followed', () => {
    const onNavigate = vi.fn();
    render(
      <MemoryRouter>
        <NavigationMenu userType={UserType.ROOT} onNavigate={onNavigate} />
      </MemoryRouter>
    );
    screen.getByRole('link', { name: 'Users' }).click();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
