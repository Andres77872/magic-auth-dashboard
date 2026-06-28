import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonSyncWebhooksTab } from '../PatreonSyncWebhooksTab';
import type { PatreonSyncJob, PatreonWebhookDelivery } from '@/types/patreon.types';

const job: PatreonSyncJob = {
  jobId: 'psj-1',
  jobType: 'user_member',
  status: 'retry',
  priority: 5,
  attempts: 2,
  maxAttempts: 8,
  notBefore: null,
  source: 'manual',
  createdAt: '2026-06-20T00:00:00Z',
  updatedAt: null,
  completedAt: null,
  hasError: true,
};

const delivery: PatreonWebhookDelivery = {
  deliveryId: 'pwd-1',
  eventType: 'members:update',
  status: 'processed',
  signatureValid: true,
  receivedAt: '2026-06-20T00:00:00Z',
  processedAt: null,
};

const fetchSyncJobs = vi.fn();
const fetchWebhooks = vi.fn();

vi.mock('@/hooks', () => ({
  usePatreonSyncJobs: () => ({
    jobs: [job],
    pagination: { limit: 20, offset: 0, total: 1, has_more: false },
    isLoading: false,
    error: null,
    filters: { limit: 20, offset: 0, status: '' },
    fetchSyncJobs,
    setFilters: vi.fn(),
  }),
  usePatreonWebhooks: () => ({
    deliveries: [delivery],
    pagination: { limit: 20, offset: 0, total: 1, has_more: false },
    isLoading: false,
    error: null,
    filters: { limit: 20, offset: 0, status: '' },
    fetchWebhooks,
    setFilters: vi.fn(),
  }),
  useResyncPatreon: () => ({ resync: vi.fn(), isResyncing: false, error: null }),
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('PatreonSyncWebhooksTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders both the sync-job and webhook tables', () => {
    render(<PatreonSyncWebhooksTab />);
    expect(screen.getByText('Sync jobs')).toBeInTheDocument();
    expect(screen.getByText('Webhook deliveries')).toBeInTheDocument();
    expect(screen.getByText('user_member')).toBeInTheDocument();
    expect(screen.getByText('members:update')).toBeInTheDocument();
  });

  it('opens the resync modal from the top-level action', async () => {
    render(<PatreonSyncWebhooksTab />);
    fireEvent.click(screen.getByRole('button', { name: /resync…/i }));
    expect(await screen.findByText('Trigger Patreon resync')).toBeInTheDocument();
  });
});
