import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityLogTab } from '../ActivityLogTab';
import type {
  ActivityDetail,
  ActivityLog,
  ActivityLogPage,
} from '@/types/audit.types';

const service = vi.hoisted(() => ({
  getActivityLogs: vi.fn(),
  getActivityTypes: vi.fn(),
  getActivityById: vi.fn(),
  exportAuditLogs: vi.fn(),
}));
const showToast = vi.hoisted(() => vi.fn());

vi.mock('@/services/audit.service', () => ({ auditService: service }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

const activity: ActivityLog = {
  id: 'act-0123456789abcdef0123456789abcdef',
  activityType: 'user_login',
  details: null,
  createdAt: '2026-03-01T10:00:00Z',
  user: { id: 'usr-internal-1', username: 'alice', userHash: 'usr-hash-alice' },
  project: null,
  targetUser: null,
  ipAddress: '10.0.0.1',
};

function page(total: number): ActivityLogPage {
  return {
    activities: [activity],
    pagination: { total, limit: 25, offset: 0, hasMore: total > 25 },
    filters: {},
    generatedAt: '2026-03-01T10:05:00Z',
  };
}

function renderTab(): void {
  render(
    <MemoryRouter>
      <ActivityLogTab />
    </MemoryRouter>
  );
}

describe('ActivityLogTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getActivityLogs.mockResolvedValue(page(42));
    service.getActivityTypes.mockResolvedValue(['user_login', 'user_logout']);
    service.getActivityById.mockResolvedValue({
      ...activity,
      severity: 'info',
      userAgent: null,
      metadata: null,
      activityName: 'User login',
      activityCategory: 'auth',
      activityDescription: null,
    } satisfies ActivityDetail);
    service.exportAuditLogs.mockResolvedValue(new Blob(['id\n']));
    URL.createObjectURL = vi.fn(() => 'blob:export');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined
    );
  });

  it('loads the first page for the last 30 days', async () => {
    renderTab();

    expect(await screen.findByText('Signed in')).toBeInTheDocument();
    expect(service.getActivityLogs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25, offset: 0, days: 30 })
    );
    expect(screen.getByText(/of 42 entries/)).toBeInTheDocument();
  });

  it('exports with the filters that are applied to the list', async () => {
    renderTab();

    // Narrow to one user from the detail sheet.
    fireEvent.click(await screen.findByText('Signed in'));
    fireEvent.click(await screen.findByRole('button', { name: 'Only alice' }));
    await waitFor(() =>
      expect(service.getActivityLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ user_id: 'usr-internal-1' })
      )
    );
    expect(screen.getByText('alice', { selector: 'span' })).toBeInTheDocument();

    const exportButton = screen.getByRole('button', { name: 'Export' });
    fireEvent.keyDown(exportButton, { key: 'Enter' });
    fireEvent.click(await screen.findByText('Download CSV'));

    await waitFor(() =>
      expect(service.exportAuditLogs).toHaveBeenCalledTimes(1)
    );
    expect(service.exportAuditLogs).toHaveBeenCalledWith({
      source: 'activity',
      format: 'csv',
      limit: 42,
      filters: {
        activity_type: undefined,
        days: 30,
        user_id: 'usr-internal-1',
        project_id: undefined,
      },
    });
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Downloaded activity-log-'),
      'success'
    );
  });

  it('disables export when more rows match than the API can export', async () => {
    service.getActivityLogs.mockResolvedValue(page(12_000));
    renderTab();

    await screen.findByText('Signed in');
    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });
});
