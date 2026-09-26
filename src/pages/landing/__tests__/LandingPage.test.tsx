import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UseApiStatusReturn } from '@/hooks/useApiStatus';
import { NAVIGATION_ITEMS } from '@/utils/routes';
import { LandingPage } from '../LandingPage';

const state = {
  isAuthenticated: false,
  apiStatus: { status: 'online', latencyMs: 42 } as UseApiStatusReturn,
};
const toggleTheme = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: state.isAuthenticated }),
}));
vi.mock('@/hooks/useApiStatus', () => ({
  useApiStatus: () => state.apiStatus,
}));
vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ resolvedTheme: 'dark', toggleTheme }),
}));

function renderPage(): void {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    state.isAuthenticated = false;
    state.apiStatus = { status: 'online', latencyMs: 42 };
    toggleTheme.mockClear();
  });

  it('introduces the platform and links every header anchor to a section', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /identity and access/i })
    ).toBeInTheDocument();

    const sections = screen.getByRole('navigation', { name: 'Page sections' });
    for (const link of within(sections).getAllByRole('link')) {
      const id = link.getAttribute('href')?.slice(1) ?? '';
      expect(document.getElementById(id)).toBeInstanceOf(HTMLElement);
    }
  });

  it('sends signed-out visitors to sign in', () => {
    renderPage();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(
      screen.getByRole('link', { name: 'Sign in to the console' })
    ).toHaveAttribute('href', '/login');
  });

  it('offers signed-in operators a way back to the console', () => {
    state.isAuthenticated = true;
    renderPage();
    const links = screen.getAllByRole('link', { name: 'Open the console' });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
  });

  it.each([
    [{ status: 'checking', latencyMs: null }, 'Checking the API…'],
    [{ status: 'online', latencyMs: 42 }, 'API online · 42 ms'],
    [
      { status: 'offline', latencyMs: null },
      'API unreachable from this browser',
    ],
  ] as Array<[UseApiStatusReturn, string]>)(
    'reports API status %o',
    (apiStatus, text) => {
      state.apiStatus = apiStatus;
      renderPage();
      expect(screen.getByRole('status')).toHaveTextContent(text);
    }
  );

  it('lists every console area and marks the root-only ones', () => {
    renderPage();
    const consoleSection = screen.getByRole('region', {
      name: 'A screen for every part of the API.',
    });
    for (const item of NAVIGATION_ITEMS) {
      const label = within(consoleSection).getByText(item.label, {
        selector: 'p',
      });
      const rootOnly = !item.allowedUserTypes.includes('admin');
      expect(within(label).queryByText('Root') !== null).toBe(rootOnly);
    }
  });

  it('opens external links in a new tab without an opener', () => {
    renderPage();
    const external = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('http'));
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('toggles the theme from the header', () => {
    renderPage();
    screen.getByRole('button', { name: 'Switch to light theme' }).click();
    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });
});
