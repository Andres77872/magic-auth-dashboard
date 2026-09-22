import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthCredentialsTab } from '../OAuthCredentialsTab';
import { oauthService } from '@/services/oauth.service';
import { useToast } from '@/hooks';
import type { OAuthCredentialsStatus } from '@/types/oauth.types';

vi.mock('@/services/oauth.service', () => ({
  oauthService: {
    setCredentials: vi.fn(),
    testCredentials: vi.fn(),
  },
}));

vi.mock('@/hooks', () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const mockedService = vi.mocked(oauthService);

const ACTIVE_CREDENTIALS: OAuthCredentialsStatus = {
  credential_status: 'active',
  has_client_secret: true,
  has_signing_key: false,
  client_secret_fingerprint: 'abc123def456',
  signing_key_fingerprint: null,
  credential_key_id: 'oauth-key-1',
  credentials_set_at: '2026-01-02T03:04:05Z',
};

const ABSENT_CREDENTIALS: OAuthCredentialsStatus = {
  credential_status: 'absent',
  has_client_secret: false,
  has_signing_key: false,
  credentials_set_at: null,
};

function renderTab(
  props: Partial<ComponentProps<typeof OAuthCredentialsTab>> = {},
): ComponentProps<typeof OAuthCredentialsTab> {
  const merged: ComponentProps<typeof OAuthCredentialsTab> = {
    connectionHash: 'conn_1',
    providerType: 'google',
    credentials: ABSENT_CREDENTIALS,
    isRoot: true,
    onChanged: vi.fn(),
    ...props,
  };
  render(<OAuthCredentialsTab {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({ showToast });
});

describe('OAuthCredentialsTab', () => {
  it('never renders a secret — only presence flags and a fingerprint', () => {
    renderTab({ credentials: ACTIVE_CREDENTIALS });

    expect(screen.getByText('abc123def456')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    // There is no reveal control, because the server cannot return the value.
    expect(screen.queryByRole('button', { name: /reveal|show secret/i })).not.toBeInTheDocument();

    const secretInput = screen.getByLabelText('Client secret');
    expect(secretInput).toHaveAttribute('type', 'password');
    expect(secretInput).toHaveValue('');
  });

  it('shows a warning panel instead of the form for a non-root user', () => {
    renderTab({ credentials: ACTIVE_CREDENTIALS, isRoot: false });

    expect(
      screen.getByText(/only root users can set or rotate oauth credentials/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Client secret')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save credentials/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /test connection/i })).not.toBeInTheDocument();
    // Read-only status is still visible to an admin.
    expect(screen.getByText('abc123def456')).toBeInTheDocument();
  });

  it('flips the save verb from "Save credentials" to "Rotate credentials" when active', () => {
    const { unmount } = render(
      <OAuthCredentialsTab
        connectionHash="conn_1"
        providerType="google"
        credentials={ABSENT_CREDENTIALS}
        isRoot
        onChanged={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /save credentials/i })).toBeInTheDocument();
    unmount();

    renderTab({ credentials: ACTIVE_CREDENTIALS });
    expect(screen.getByRole('button', { name: /rotate credentials/i })).toBeInTheDocument();
    expect(screen.getByText(/rotating replaces the stored secret immediately/i)).toBeInTheDocument();
  });

  it('runs the non-persisting probe before saving and reports the would-be fingerprint', async () => {
    mockedService.testCredentials.mockResolvedValue({
      success: true,
      message: 'ok',
      result: { valid: true, problems: [], client_secret_fingerprint: 'feed0000beef' },
    });
    renderTab();

    fireEvent.change(screen.getByLabelText('Client secret'), {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() =>
      expect(mockedService.testCredentials.mock.calls[0]).toEqual([
        'conn_1',
        { client_secret: 'super-secret', signing_key: undefined },
      ]),
    );
    expect(await screen.findByText(/feed0000beef/)).toBeInTheDocument();
    expect(mockedService.setCredentials.mock.calls).toHaveLength(0);
  });

  it('clears the inputs after a successful submit and refreshes the parent', async () => {
    mockedService.setCredentials.mockResolvedValue({
      success: true,
      message: 'ok',
      credentials: ACTIVE_CREDENTIALS,
    });
    const { onChanged } = renderTab();

    const secretInput = screen.getByLabelText('Client secret');
    fireEvent.change(secretInput, { target: { value: 'super-secret' } });
    expect(secretInput).toHaveValue('super-secret');

    fireEvent.click(screen.getByRole('button', { name: /save credentials/i }));

    await waitFor(() =>
      expect(mockedService.setCredentials.mock.calls[0]).toEqual([
        'conn_1',
        { client_secret: 'super-secret', signing_key: undefined },
      ]),
    );
    await waitFor(() => expect(secretInput).toHaveValue(''));
    expect(screen.getByLabelText(/signing key/i)).toHaveValue('');
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(
      'Credentials saved (encrypted; never echoed)',
      'success',
    );
  });

  it('refuses an empty submit without calling the API', async () => {
    renderTab();

    fireEvent.click(screen.getByRole('button', { name: /save credentials/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith('Enter a client secret or a signing key', 'error'),
    );
    expect(mockedService.setCredentials.mock.calls).toHaveLength(0);
  });

  it('discloses that secrets are encrypted and never returned', () => {
    renderTab();

    expect(
      screen.getByText(/secrets are encrypted server-side and never returned/i),
    ).toBeInTheDocument();
  });
});
