import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonEntitlementsTab } from '../PatreonEntitlementsTab';
import type { PatreonEntitlement } from '@/types/patreon.types';

const row: PatreonEntitlement = {
  userHash: 'usr-aaa',
  displayName: 'alice',
  status: 'active',
  linkStatus: 'linked',
  planCode: 'tier1',
  tierCode: 'gold',
  tierName: 'Gold',
  lastSyncedAt: '2026-06-20T00:00:00Z',
  updatedAt: '2026-06-20T01:00:00Z',
};

const fetchEntitlements = vi.fn();
const setFilters = vi.fn();
const resync = vi.fn();
const showToast = vi.fn();

let entitlements: PatreonEntitlement[] = [row];

vi.mock('@/hooks', () => ({
  usePatreonEntitlements: () => ({
    entitlements,
    pagination: { limit: 20, offset: 0, total: entitlements.length, has_more: false },
    isLoading: false,
    error: null,
    filters: { limit: 20, offset: 0, status: '' },
    fetchEntitlements,
    setFilters,
  }),
  useResyncPatreon: () => ({ resync, isResyncing: false, error: null }),
  useToast: () => ({ showToast }),
  usePatreonEntitlement: () => ({ detail: null, isLoading: false, error: null, refetch: vi.fn() }),
}));

describe('PatreonEntitlementsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    entitlements = [row];
  });

  it('renders entitlement rows', () => {
    render(<PatreonEntitlementsTab />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('tier1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Linked')).toBeInTheDocument();
  });

  it('renders an empty state when there are no entitlements', () => {
    entitlements = [];
    render(<PatreonEntitlementsTab />);
    expect(screen.getByText('No Patreon entitlements')).toBeInTheDocument();
  });

  it('opens a confirm dialog and triggers a per-user resync', async () => {
    resync.mockResolvedValue({ accepted: true, status: 'queued', correlationId: 'psj-1', message: null });
    render(<PatreonEntitlementsTab />);

    fireEvent.click(screen.getByRole('button', { name: /^resync$/i }));

    // Confirm dialog appears
    const confirmButton = await screen.findByRole('button', { name: /queue resync/i });
    fireEvent.click(confirmButton);

    await waitFor(() => expect(resync).toHaveBeenCalledTimes(1));
    expect(resync).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'user', userHash: 'usr-aaa' })
    );
    await waitFor(() => expect(showToast).toHaveBeenCalledWith(expect.stringContaining('queued'), 'success'));
  });
});
