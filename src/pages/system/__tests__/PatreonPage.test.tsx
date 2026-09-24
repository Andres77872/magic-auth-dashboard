import type React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { PatreonPage } from '../PatreonPage';
import { makeStatus } from '@/components/features/patreon/__tests__/fixtures';

let status = makeStatus();

vi.mock('@/hooks', () => ({
  usePatreonStatus: () => ({
    status,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('@/components/features/patreon', async () => {
  const actual = await vi.importActual<
    typeof import('@/components/features/patreon')
  >('@/components/features/patreon');
  return {
    ...actual,
    PatreonEntitlementsTab: () => <div>entitlements-tab</div>,
    PatreonTierMapTab: () => <div>tier-map-tab</div>,
    PatreonSyncWebhooksTab: () => <div>sync-tab</div>,
    PatreonResyncModal: () => null,
  };
});

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{location.search}</div>;
}

function renderAt(url: string): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/system/patreon"
          element={
            <>
              <PatreonPage />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('PatreonPage', () => {
  it('opens the tab named in ?tab=', () => {
    renderAt('/system/patreon?tab=sync');
    expect(screen.getByText('sync-tab')).toBeInTheDocument();
  });

  it('falls back to Overview and cleans up an unknown ?tab= value', async () => {
    renderAt('/system/patreon?tab=bogus&keep=1');
    expect(screen.getByText('Patreon integration')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('?keep=1')
    );
  });

  it('disables queuing a resync while sync is turned off', () => {
    status = makeStatus({ readiness: { featureFlags: { sync: false } } });
    renderAt('/system/patreon');
    expect(screen.getByRole('button', { name: /resync/i })).toBeDisabled();
    status = makeStatus();
  });
});
