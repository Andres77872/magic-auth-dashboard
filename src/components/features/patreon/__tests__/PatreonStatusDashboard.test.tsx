import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PatreonStatusDashboard } from '../PatreonStatusDashboard';
import { disabledReadiness, makeStatus } from './fixtures';

function renderDashboard(
  status = makeStatus(),
  extra: Partial<{ isLoading: boolean; error: string | null }> = {}
): { onRetry: ReturnType<typeof vi.fn> } {
  const onRetry = vi.fn();
  render(
    <PatreonStatusDashboard
      status={status}
      isLoading={extra.isLoading ?? false}
      error={extra.error ?? null}
      onRetry={onRetry}
    />
  );
  return { onRetry };
}

describe('PatreonStatusDashboard', () => {
  it('says the integration is off when every feature is disabled', () => {
    renderDashboard(
      makeStatus({ status: 'disabled', readiness: disabledReadiness })
    );
    expect(screen.getByText(/integration is off/i)).toBeInTheDocument();
    expect(screen.queryByText(/need attention/i)).not.toBeInTheDocument();
    expect(screen.getByText(/never signs anyone in/i)).toBeInTheDocument();
  });

  it('shows headline numbers and no open issues when healthy', () => {
    renderDashboard();
    expect(
      screen.getByText('Everything that is enabled is working.')
    ).toBeInTheDocument();
    expect(screen.getByText('No open issues.')).toBeInTheDocument();
    expect(screen.getByText('Linked users')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(
      screen.getByText('Static token from server settings')
    ).toBeInTheDocument();
  });

  it('turns unhealthy signals into actionable attention items', () => {
    renderDashboard(
      makeStatus({
        status: 'degraded',
        readiness: { missing: ['PATREON_WEBHOOK_SECRET'] },
        creatorToken: {
          status: 'revoked',
          configured: true,
          degraded: true,
          details: {},
        },
        worker: { status: 'unknown', details: {} },
        syncQueue: {
          status: 'degraded',
          details: { failed_jobs: 2, failed_jobs_window_hours: 24 },
        },
        tierMap: {
          status: 'degraded',
          details: { misses_24h: 1, configured_entries: 3 },
        },
      })
    );
    expect(screen.getByText(/5 things need attention/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Missing configuration: PATREON_WEBHOOK_SECRET/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Patreon rejected the creator token/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sync worker has no recent heartbeat/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 sync jobs failed in the last 24h/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/1 tier-map miss in 24h/i)).toBeInTheDocument();
  });

  it('shows an error state with retry when status cannot be loaded', () => {
    const { onRetry } = renderDashboard(null as never, {
      error: 'Access denied',
    });
    expect(
      screen.getByText('Couldn’t load Patreon status')
    ).toBeInTheDocument();
    screen.getByRole('button', { name: /retry|try again/i }).click();
    expect(onRetry).toHaveBeenCalled();
  });
});
