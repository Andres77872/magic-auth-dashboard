import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OAuthReadinessPanel } from '../OAuthReadinessPanel';
import { READINESS_CHECK_LABELS } from '../oauth-status';
import type { OAuthReadinessCheck } from '@/types/oauth.types';

/** The full check set api.auth returns, in its own order. */
const ALL_CHECKS: Array<[string, string]> = [
  ['oauth_globally_disabled', 'OAuth is disabled for the whole deployment (OAUTH_ENABLED).'],
  ['provider_type_disabled', 'The provider type is disabled in the provider catalog.'],
  ['adapter_not_registered', 'The running backend has no adapter for this provider type.'],
  ['connection_not_active', 'The connection is draft, disabled or archived.'],
  ['credentials_not_active', 'No client secret is stored, or the credentials were revoked.'],
  ['binding_disabled', 'The provider is not enabled for this project.'],
  ['project_inactive', 'The project is inactive or archived.'],
  ['no_redirect_uri', 'No redirect URI is configured.'],
  ['no_return_origin', 'No return origin is configured.'],
  [
    'default_group_missing',
    'Auto-create is on but the default user group is missing or inactive.',
  ],
  [
    'default_group_does_not_reach_project',
    'Auto-create is on but the default user group does not reach this project.',
  ],
];

function checks(failing: string[]): OAuthReadinessCheck[] {
  return ALL_CHECKS.map(([check, message]) => ({
    check,
    ok: !failing.includes(check),
    message: failing.includes(check) ? message : '',
  }));
}

describe('OAuthReadinessPanel', () => {
  it('renders every layer with a readable label when nothing fails', () => {
    render(<OAuthReadinessPanel checks={checks([])} ready />);

    expect(screen.getByText('ready')).toBeInTheDocument();
    ALL_CHECKS.forEach(([check]) => {
      expect(screen.getByText(READINESS_CHECK_LABELS[check])).toBeInTheDocument();
    });
    expect(screen.getAllByText('OK')).toHaveLength(ALL_CHECKS.length);
  });

  it('surfaces each failing layer with the server message for that layer', () => {
    const failing = ['credentials_not_active', 'no_redirect_uri', 'no_return_origin'];
    render(<OAuthReadinessPanel checks={checks(failing)} ready={false} />);

    expect(screen.getByText('not ready')).toBeInTheDocument();
    expect(screen.getByText('3 checks failing')).toBeInTheDocument();
    expect(
      screen.getByText('No client secret is stored, or the credentials were revoked.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No redirect URI is configured.')).toBeInTheDocument();
    expect(screen.getByText('No return origin is configured.')).toBeInTheDocument();
  });

  it('computes readiness as the AND across layers when the server roll-up is omitted', () => {
    const { unmount } = render(<OAuthReadinessPanel checks={checks([])} />);
    expect(screen.getByText('ready')).toBeInTheDocument();
    unmount();

    render(<OAuthReadinessPanel checks={checks(['binding_disabled'])} />);
    expect(screen.getByText('not ready')).toBeInTheDocument();
    expect(screen.getByText('1 check failing')).toBeInTheDocument();
  });

  it('can show only the blocking layers', () => {
    render(<OAuthReadinessPanel checks={checks(['adapter_not_registered'])} failuresOnly />);

    expect(screen.getByText(READINESS_CHECK_LABELS.adapter_not_registered)).toBeInTheDocument();
    expect(screen.queryByText(READINESS_CHECK_LABELS.no_redirect_uri)).not.toBeInTheDocument();
  });

  it('falls back to the raw check name for a check the frontend does not know yet', () => {
    render(
      <OAuthReadinessPanel
        checks={[{ check: 'some_future_check', ok: false, message: 'A new layer failed.' }]}
      />,
    );

    expect(screen.getByText('some_future_check')).toBeInTheDocument();
    expect(screen.getByText('A new layer failed.')).toBeInTheDocument();
  });
});
