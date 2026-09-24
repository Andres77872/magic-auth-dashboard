import './resize-observer';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonEntitlementsTab } from '../PatreonEntitlementsTab';
import type { PatreonEntitlement } from '@/types/patreon.types';
import { entitlementRow } from './fixtures';

const fetchEntitlements = vi.fn();
const setFilters = vi.fn();
const resync = vi.fn();
const showToast = vi.fn();

let entitlements: PatreonEntitlement[] = [entitlementRow];
let listError: string | null = null;
let filters = { limit: 20, offset: 0, status: '', linkStatus: '', search: '' };

vi.mock('@/hooks', () => ({
  usePatreonEntitlements: () => ({
    entitlements,
    pagination: {
      limit: 20,
      offset: 0,
      total: entitlements.length,
      has_more: false,
    },
    isLoading: false,
    error: listError,
    filters,
    fetchEntitlements,
    setFilters,
  }),
  useResyncPatreon: () => ({ resync, isResyncing: false, error: null }),
  useToast: () => ({ showToast }),
  usePatreonEntitlement: () => ({
    detail: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePatreonEntitlementHistory: () => ({
    items: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

function renderTab(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <PatreonEntitlementsTab />
    </MemoryRouter>
  );
}

describe('PatreonEntitlementsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entitlements = [entitlementRow];
    listError = null;
    filters = { limit: 20, offset: 0, status: '', linkStatus: '', search: '' };
  });

  it('renders entitlement rows with readable statuses', () => {
    renderTab();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('tier1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Linked')).toBeInTheDocument();
    expect(screen.getByText('1 user')).toBeInTheDocument();
  });

  it('flags an active entitlement whose freshness window has passed', () => {
    entitlements = [{ ...entitlementRow, staleAfter: '2020-01-01T00:00:00Z' }];
    renderTab();
    expect(screen.getByText('Stale')).toBeInTheDocument();
  });

  it('distinguishes "no data yet" from "no matches"', () => {
    entitlements = [];
    const { unmount } = renderTab();
    expect(screen.getByText('No Patreon entitlements yet')).toBeInTheDocument();
    unmount();
    filters = { ...filters, status: 'former' };
    renderTab();
    expect(screen.getByText('No matching users')).toBeInTheDocument();
  });

  it('shows a load failure as an error with retry, not as an empty list', () => {
    listError = 'Access denied. Insufficient permissions.';
    renderTab();
    expect(screen.getByText('Couldn’t load entitlements')).toBeInTheDocument();
    expect(
      screen.queryByText('No Patreon entitlements yet')
    ).not.toBeInTheDocument();
  });

  it('queues a per-user resync through the resync dialog', async () => {
    resync.mockResolvedValue({
      accepted: true,
      status: 'queued',
      correlationId: 'psj-1',
      message: null,
    });
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /resync alice/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: /queue resync/i })
    );

    await waitFor(() => expect(resync).toHaveBeenCalledTimes(1));
    expect(resync).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'user', userHash: 'usr-aaa' })
    );
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/queued/i),
        'success'
      )
    );
    expect(fetchEntitlements).toHaveBeenCalled();
  });

  it('presents a declined resync (user not linked) as information, not an error', async () => {
    resync.mockResolvedValue({
      accepted: false,
      status: 'not_linked',
      correlationId: null,
      message: 'x',
    });
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /resync alice/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: /queue resync/i })
    );

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/no linked Patreon membership/i),
        'info'
      )
    );
  });
});
