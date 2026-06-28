import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { NavigationMenu } from '@/components/navigation';
import { NAVIGATION_SECTIONS, ROUTES, type NavItem } from '@/utils/routes';
import { UserType } from '@/types/auth.types';

vi.mock('@/hooks', () => ({
  usePermissions: vi.fn(() => ({
    isAuthenticated: true,
  })),
}));

function visibleItemsFor(userType: string): NavItem[] {
  return NAVIGATION_SECTIONS
    .filter((section) => section.allowedUserTypes.includes(userType))
    .flatMap((section) =>
      section.items.filter((item) => item.allowedUserTypes.includes(userType))
    );
}

describe('Patreon system navigation', () => {
  it('adds Patreon as a ROOT-only System item', () => {
    const systemSection = NAVIGATION_SECTIONS.find((section) => section.id === 'system');
    const patreonItem = systemSection?.items.find((item) => item.id === 'patreon');

    expect(patreonItem).toMatchObject({
      label: 'Patreon',
      path: ROUTES.PATREON,
      icon: 'heart-handshake',
      allowedUserTypes: ['root'],
    });
  });

  it('is visible for root users and hidden from non-root admins', () => {
    expect(visibleItemsFor('root').some((item) => item.id === 'patreon')).toBe(true);
    expect(visibleItemsFor('admin').some((item) => item.id === 'patreon')).toBe(false);
  });

  it('marks only Patreon active on the Patreon system route', () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.PATREON] },
        React.createElement(NavigationMenu, { userType: UserType.ROOT })
      )
    );

    const systemLink = screen.getByRole('link', { name: /^System$/ });
    const patreonLink = screen.getByRole('link', { name: /^Patreon$/ });

    expect(systemLink).not.toHaveAttribute('aria-current', 'page');
    expect(patreonLink).toHaveAttribute('aria-current', 'page');
  });
});
