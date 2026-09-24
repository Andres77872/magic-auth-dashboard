import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonTierMapTab } from '../PatreonTierMapTab';
import type { PatreonTierMapEntry } from '@/types/patreon.types';

const refetch = vi.fn();
const setFilters = vi.fn();
let error: string | null = null;

const entry: PatreonTierMapEntry = {
  campaignFingerprint: 'abc123def456',
  campaignName: 'Main campaign',
  tierFingerprint: 'fed654cba321',
  planCode: 'tier1',
  tierCode: 'gold',
  tierName: 'Gold',
  priority: 10,
  active: true,
  effectiveFrom: '2026-01-01T00:00:00Z',
  effectiveUntil: null,
};

vi.mock('@/hooks', () => ({
  usePatreonTierMap: () => ({
    entries: error ? [] : [entry],
    pagination: { limit: 100, offset: 0, total: 1, has_more: false },
    isLoading: false,
    error,
    filters: { limit: 100, offset: 0, active: '' },
    refetch,
    setFilters,
  }),
}));

describe('PatreonTierMapTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    error = null;
  });

  it('renders mappings with fingerprints (never raw ids) and explains where they come from', () => {
    render(<PatreonTierMapTab />);
    expect(screen.getByText('Main campaign')).toBeInTheDocument();
    expect(screen.getByText('abc123def456')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('tier1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/mirrors it/i)).toBeInTheDocument();
    expect(screen.getByText('1 entry')).toBeInTheDocument();
  });

  it('renders an error state with retry', () => {
    error = 'boom';
    render(<PatreonTierMapTab />);
    expect(screen.getByText('Couldn’t load the tier map')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry|try again/i }));
    expect(refetch).toHaveBeenCalled();
  });
});
