import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonSyncWebhooksTab } from '../PatreonSyncWebhooksTab';

const fetchSyncJobs = vi.fn();
const fetchWebhooks = vi.fn();
let jobsError: string | null = null;

vi.mock('@/hooks', () => ({
  useToast: () => ({ showToast: vi.fn() }),
  usePatreonSyncJobs: () => ({
    jobs: [
      {
        jobId: 'psj-0123456789abcdef',
        jobType: 'full_campaign',
        status: 'retry',
        priority: 5,
        attempts: 2,
        maxAttempts: 8,
        notBefore: '2099-01-01T00:00:00Z',
        source: 'manual',
        createdAt: '2026-06-20T00:00:00Z',
        updatedAt: null,
        completedAt: null,
        hasError: true,
      },
    ],
    pagination: { limit: 20, offset: 0, total: 1, has_more: false },
    isLoading: false,
    error: jobsError,
    filters: { limit: 20, offset: 0, status: '' },
    fetchSyncJobs,
    setFilters: vi.fn(),
  }),
  usePatreonWebhooks: () => ({
    deliveries: [
      {
        deliveryId: 'pwhd-0123456789abcdef',
        eventType: 'members:pledge:update',
        status: 'processed',
        signatureValid: true,
        receivedAt: '2026-06-20T00:00:00Z',
        processedAt: '2026-06-20T00:00:01Z',
      },
    ],
    pagination: { limit: 20, offset: 0, total: 1, has_more: false },
    isLoading: false,
    error: null,
    filters: { limit: 20, offset: 0, status: '' },
    fetchWebhooks,
    setFilters: vi.fn(),
  }),
}));

describe('PatreonSyncWebhooksTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobsError = null;
  });

  it('renders readable job and delivery rows', () => {
    render(<PatreonSyncWebhooksTab />);
    expect(screen.getByText('Full campaign sweep')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('2/8')).toBeInTheDocument();
    expect(screen.getByText('members:pledge:update')).toBeInTheDocument();
    // "Processed" is also a column header; the outcome badge is the non-header match.
    expect(
      screen
        .getAllByText('Processed')
        .some((element) => element.closest('th') === null)
    ).toBe(true);
    // Ids are truncated, not printed in full.
    expect(screen.queryByText('psj-0123456789abcdef')).not.toBeInTheDocument();
  });

  it('reloads both lists when the page refresh signal changes', () => {
    const { rerender } = render(<PatreonSyncWebhooksTab refreshSignal={0} />);
    expect(fetchSyncJobs).not.toHaveBeenCalled();
    rerender(<PatreonSyncWebhooksTab refreshSignal={1} />);
    expect(fetchSyncJobs).toHaveBeenCalledTimes(1);
    expect(fetchWebhooks).toHaveBeenCalledTimes(1);
  });

  it('shows a job-list failure as an error state', () => {
    jobsError = 'Network error';
    render(<PatreonSyncWebhooksTab />);
    expect(screen.getByText('Couldn’t load sync jobs')).toBeInTheDocument();
  });
});
