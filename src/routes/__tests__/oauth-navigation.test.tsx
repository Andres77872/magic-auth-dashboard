import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { NavigationMenu } from '@/components/navigation';
import {
  NAVIGATION_ITEMS,
  NAVIGATION_SECTIONS,
  ROUTES,
  type NavItem,
} from '@/utils/routes';
import { canAccessRoute } from '@/utils/permissions';
import { UserType } from '@/types/auth.types';

vi.mock('@/hooks', () => ({
  usePermissions: vi.fn(() => ({
    isAuthenticated: true,
  })),
}));

function visibleItemsFor(userType: string): NavItem[] {
  return NAVIGATION_SECTIONS.filter((section) =>
    section.allowedUserTypes.includes(userType)
  ).flatMap((section) =>
    section.items.filter((item) => item.allowedUserTypes.includes(userType))
  );
}

describe('OAuth navigation', () => {
  it('adds OAuth to the operations section next to Billing, for root and admin', () => {
    const operations = NAVIGATION_SECTIONS.find(
      (section) => section.id === 'operations'
    );
    const oauthItem = operations?.items.find((item) => item.id === 'oauth');

    expect(oauthItem).toMatchObject({
      label: 'OAuth',
      path: ROUTES.OAUTH,
      icon: 'key-round',
      allowedUserTypes: ['root', 'admin'],
    });
    expect(ROUTES.OAUTH).toBe('/oauth');
  });

  it('also appears in the legacy flat navigation list, as Billing does', () => {
    expect(NAVIGATION_ITEMS.some((item) => item.id === 'billing')).toBe(true);
    expect(NAVIGATION_ITEMS.find((item) => item.id === 'oauth')).toMatchObject({
      path: ROUTES.OAUTH,
      allowedUserTypes: ['root', 'admin'],
    });
  });

  it('is visible for both root and admin users', () => {
    expect(visibleItemsFor('root').some((item) => item.id === 'oauth')).toBe(
      true
    );
    expect(visibleItemsFor('admin').some((item) => item.id === 'oauth')).toBe(
      true
    );
  });

  it('is an admin-reachable route, unlike the root-only system prefixes', () => {
    expect(canAccessRoute(UserType.ADMIN, ROUTES.OAUTH)).toBe(true);
    expect(canAccessRoute(UserType.ROOT, ROUTES.OAUTH)).toBe(true);
    // The root-only guards stay root-only; adding OAuth must not widen them.
    expect(canAccessRoute(UserType.ADMIN, ROUTES.SYSTEM)).toBe(false);
    expect(canAccessRoute(UserType.ADMIN, ROUTES.EMAIL_TEMPLATES)).toBe(false);
    expect(canAccessRoute(UserType.CONSUMER, ROUTES.OAUTH)).toBe(false);
  });

  it('marks only OAuth active on the OAuth route', () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.OAUTH] },
        React.createElement(NavigationMenu, { userType: UserType.ADMIN })
      )
    );

    const oauthLink = screen.getByRole('link', { name: /^OAuth$/ });
    const billingLink = screen.getByRole('link', { name: /^Billing$/ });

    expect(oauthLink).toHaveAttribute('aria-current', 'page');
    expect(billingLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('renders the OAuth item for an admin without rendering root-only system items', () => {
    render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [ROUTES.OAUTH] },
        React.createElement(NavigationMenu, { userType: UserType.ADMIN })
      )
    );

    expect(screen.getByRole('link', { name: /^OAuth$/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /^System$/ })
    ).not.toBeInTheDocument();
  });
});
