import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogMonitorPage } from '../AuditLogMonitorPage';
import type { User } from '@/types/auth.types';

const mocks = vi.hoisted(() => ({
  user: null as Pick<User, 'user_type'> | null,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock('../ActivityLogTab', () => ({
  ActivityLogTab: () => <div data-testid="activity-tab" />,
}));
vi.mock('../ApiRequestsTab', () => ({
  ApiRequestsTab: () => <div data-testid="requests-tab" />,
}));
vi.mock('../SecurityEventsTab', () => ({
  SecurityEventsTab: () => <div data-testid="security-tab" />,
}));
vi.mock('../AuditStatisticsTab', () => ({
  AuditStatisticsTab: () => <div data-testid="statistics-tab" />,
}));

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuditLogMonitorPage />
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('AuditLogMonitorPage', () => {
  beforeEach(() => {
    mocks.user = { user_type: 'admin' };
  });

  it('shows admins the activity log without a tab bar', () => {
    renderAt('/audit');

    expect(
      screen.getByRole('heading', { name: 'Audit log' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('activity-tab')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('falls back to activity when an admin opens a root-only tab', () => {
    renderAt('/audit?tab=security');

    expect(screen.getByTestId('activity-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('security-tab')).not.toBeInTheDocument();
  });

  it('gives root every section and keeps the tab in the URL', async () => {
    mocks.user = { user_type: 'root' };
    renderAt('/audit?tab=statistics&from=overview');

    expect(screen.getByTestId('statistics-tab')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual([
      'Activity',
      'API requests',
      'Security events',
      'Statistics',
    ]);

    fireEvent.click(screen.getByRole('tab', { name: 'Security events' }));
    await waitFor(() =>
      expect(screen.getByTestId('security-tab')).toBeInTheDocument()
    );
    expect(screen.getByTestId('location')).toHaveTextContent('tab=security');
    expect(screen.getByTestId('location')).toHaveTextContent('from=overview');
  });

  it('falls back to activity for an unknown tab value', () => {
    mocks.user = { user_type: 'root' };
    renderAt('/audit?tab=nope');

    expect(screen.getByTestId('activity-tab')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});
