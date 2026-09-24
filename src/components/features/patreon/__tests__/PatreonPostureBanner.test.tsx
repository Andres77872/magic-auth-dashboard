import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PatreonPostureBanner } from '../PatreonPostureBanner';
import { disabledReadiness, makeStatus } from './fixtures';

describe('PatreonPostureBanner', () => {
  it('renders nothing when everything enabled is healthy', () => {
    const { container } = render(
      <PatreonPostureBanner status={makeStatus()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('explains an integration that is off', () => {
    render(
      <PatreonPostureBanner
        status={makeStatus({ readiness: disabledReadiness })}
      />
    );
    expect(
      screen.getByText('The Patreon integration is off')
    ).toBeInTheDocument();
  });

  it('distinguishes an unreadable configuration from a disabled one', () => {
    render(
      <PatreonPostureBanner
        status={makeStatus({
          readiness: { ...disabledReadiness, checkFailed: true },
        })}
      />
    );
    expect(
      screen.getByText('Patreon configuration could not be read')
    ).toBeInTheDocument();
  });

  it('lists missing settings when not ready', () => {
    render(
      <PatreonPostureBanner
        status={makeStatus({
          readiness: {
            status: 'not_ready',
            ready: false,
            missing: ['PATREON_ID_HMAC_SECRET'],
          },
        })}
      />
    );
    expect(screen.getByText('PATREON_ID_HMAC_SECRET')).toBeInTheDocument();
  });

  it('warns when sync is on but the worker is silent', () => {
    render(
      <PatreonPostureBanner
        status={makeStatus({ worker: { status: 'unknown', details: {} } })}
      />
    );
    expect(
      screen.getByText('The Patreon sync worker is not reporting')
    ).toBeInTheDocument();
  });
});
