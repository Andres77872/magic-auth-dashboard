import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthCredentialsTab } from '../OAuthCredentialsTab';
import type { OAuthCredentialsStatus } from '@/types/oauth.types';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

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

type Props = ComponentProps<typeof OAuthCredentialsTab>;

function renderTab(props: Partial<Props> = {}): Props {
  const merged: Props = {
    credentials: ABSENT_CREDENTIALS,
    connectionName: 'Acme Google',
    isRoot: true,
    onSave: vi.fn<Props['onSave']>().mockResolvedValue(undefined),
    onTest: vi
      .fn<Props['onTest']>()
      .mockResolvedValue({ valid: true, problems: [] }),
    ...props,
  };
  render(<OAuthCredentialsTab {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('OAuthCredentialsTab', () => {
  it('never renders a secret — only presence and a fingerprint', () => {
    renderTab({ credentials: ACTIVE_CREDENTIALS });

    expect(screen.getByText('abc123def456')).toBeInTheDocument();
    expect(
      screen.getByText('Stored', { selector: 'span.rounded-full' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reveal|show secret/i })
    ).not.toBeInTheDocument();

    const secretInput = screen.getByLabelText('Client secret');
    expect(secretInput).toHaveAttribute('type', 'password');
    expect(secretInput).toHaveValue('');
  });

  it('shows the status and a note instead of the form for an admin', () => {
    renderTab({ credentials: ACTIVE_CREDENTIALS, isRoot: false });

    expect(
      screen.getByText(/only root users can store or rotate oauth credentials/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Client secret')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /save credentials|rotate credentials/i,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /test connection/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText('abc123def456')).toBeInTheDocument();
  });

  it('switches from "Save credentials" to "Rotate credentials" once credentials are stored', () => {
    const { unmount } = render(
      <OAuthCredentialsTab
        credentials={ABSENT_CREDENTIALS}
        connectionName="Acme Google"
        isRoot
        onSave={vi.fn()}
        onTest={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: /save credentials/i })
    ).toBeInTheDocument();
    unmount();

    renderTab({ credentials: ACTIVE_CREDENTIALS });
    expect(
      screen.getByRole('button', { name: /rotate credentials/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/replaces the stored secret immediately/i)
    ).toBeInTheDocument();
  });

  it('runs the non-persisting probe and compares the would-be fingerprint with the stored one', async () => {
    const onTest = vi.fn<Props['onTest']>().mockResolvedValue({
      valid: true,
      problems: [],
      client_secret_fingerprint: 'abc123def456',
    });
    const { onSave } = renderTab({ credentials: ACTIVE_CREDENTIALS, onTest });

    fireEvent.change(screen.getByLabelText('Client secret'), {
      target: { value: 'super-secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() =>
      expect(onTest).toHaveBeenCalledWith({ client_secret: 'super-secret' })
    );
    expect(
      await screen.findByText(/the same secret that is stored now/i)
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('lists the problems of an invalid configuration', async () => {
    const onTest = vi
      .fn<Props['onTest']>()
      .mockResolvedValue({ valid: false, problems: ['issuer is required'] });
    renderTab({ onTest });

    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    expect(await screen.findByText('issuer is required')).toBeInTheDocument();
    expect(onTest).toHaveBeenCalledWith({ client_secret: undefined });
  });

  it('clears the inputs only after a successful save', async () => {
    const { onSave } = renderTab();

    const secretInput = screen.getByLabelText('Client secret');
    fireEvent.change(secretInput, { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /save credentials/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        client_secret: 'super-secret',
        signing_key: undefined,
      })
    );
    await waitFor(() => expect(secretInput).toHaveValue(''));
    expect(screen.getByLabelText(/signing key/i)).toHaveValue('');
    expect(showToast).toHaveBeenCalledWith('Credentials saved', 'success');
  });

  it('keeps the typed secret and shows the backend message when saving fails', async () => {
    const onSave = vi
      .fn<Props['onSave']>()
      .mockRejectedValue(
        new Error('Server OAuth secret encryption keys are not configured')
      );
    renderTab({ onSave });

    const secretInput = screen.getByLabelText('Client secret');
    fireEvent.change(secretInput, { target: { value: 'super-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /save credentials/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Server OAuth secret encryption keys are not configured',
        'error'
      )
    );
    expect(secretInput).toHaveValue('super-secret');
  });

  it('refuses an empty submit without calling the API', async () => {
    const { onSave } = renderTab();

    fireEvent.click(screen.getByRole('button', { name: /save credentials/i }));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Enter a client secret or a signing key.',
        'error'
      )
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps line breaks in a pasted signing key', async () => {
    const { onSave } = renderTab();
    const pem = '-----BEGIN PRIVATE KEY-----\nMIGT\n-----END PRIVATE KEY-----';

    fireEvent.change(screen.getByLabelText(/signing key/i), {
      target: { value: pem },
    });
    fireEvent.click(screen.getByRole('button', { name: /save credentials/i }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        client_secret: undefined,
        signing_key: pem,
      })
    );
  });
});
