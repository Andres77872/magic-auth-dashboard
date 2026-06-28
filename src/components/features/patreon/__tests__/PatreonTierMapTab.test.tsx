import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonTierMapTab } from '../PatreonTierMapTab';
import type { PatreonTierMapEntry } from '@/types/patreon.types';

const entry: PatreonTierMapEntry = {
  campaignFingerprint: 'abc123def456',
  campaignName: 'Main',
  tierFingerprint: 'fed654cba321',
  planCode: 'tier1',
  tierCode: 'gold',
  tierName: 'Gold',
  priority: 10,
  active: true,
  effectiveFrom: '2026-01-01T00:00:00Z',
  effectiveUntil: null,
};

let state: { entries: PatreonTierMapEntry[]; isLoading: boolean; error: string | null } = {
  entries: [entry],
  isLoading: false,
  error: null,
};
const refetch = vi.fn();

vi.mock('@/hooks', () => ({
  usePatreonTierMap: () => ({ ...state, refetch }),
}));

describe('PatreonTierMapTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state = { entries: [entry], isLoading: false, error: null };
  });

  it('renders tier-map columns', () => {
    render(<PatreonTierMapTab />);
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('tier1')).toBeInTheDocument();
    expect(screen.getByText('gold')).toBeInTheDocument();
    expect(screen.getByText('abc123def456')).toBeInTheDocument();
    // "Active" appears both as the column header and the row badge.
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(2);
  });

  it('renders an error state with retry', () => {
    state = { entries: [], isLoading: false, error: 'nope' };
    render(<PatreonTierMapTab />);
    expect(screen.getByText('Could not load tier map')).toBeInTheDocument();
  });
});
