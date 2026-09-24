import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiKeyRevealModal } from '../ApiKeyRevealModal';
import type { CreatedApiKey } from '@/types/api-key.types';

const createdKey: CreatedApiKey = {
  id: 'public123',
  public_id: 'public123',
  name: 'Magic LLM delegation key',
  description: null,
  fingerprint: 'FP1234567890',
  secret_last4: 'cret',
  project_id: 'proj-internal',
  owner_user_id: 'usr-internal',
  expires_at: null,
  last_used_at: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: null,
  revoked_at: null,
  revoke_reason: null,
  hash_algorithm: 'hmac-sha256-v1',
  api_key: 'sk_public123.secret',
};

describe('ApiKeyRevealModal', () => {
  it('shows the one-time key and keeps the dialog open until it is copied or confirmed', () => {
    const onClose = vi.fn();
    render(<ApiKeyRevealModal created={createdKey} onClose={onClose} />);

    expect(
      screen.getByRole('heading', { name: 'API key created' })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('sk_public123.secret')).toBeInTheDocument();

    const done = screen.getByRole('button', { name: 'Done' });
    expect(done).toBeDisabled();

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I have stored this key somewhere safe',
      })
    );
    expect(done).toBeEnabled();
    fireEvent.click(done);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders caller and target service env values for delegation keys', () => {
    render(
      <ApiKeyRevealModal
        created={createdKey}
        onClose={vi.fn()}
        delegatedAuthConfig={{
          ownerUserHash: 'usr-service',
          targetProjectHash: 'target-prj',
          targetProjectName: 'Magic LLM',
          sourceProjectHash: 'source-prj',
          sourceProjectName: 'Magic Worlds',
        }}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Delegation key created' })
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'MAGIC_LLM_DELEGATION_API_KEY=sk_public123.secret'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        'DELEGATED_AUTH_TRUSTED_CLIENTS=source-prj:public123'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Target project: Magic LLM')).toBeInTheDocument();
    expect(
      screen.getByText('Source project: Magic Worlds')
    ).toBeInTheDocument();
  });

  it('renders nothing when there is no created key', () => {
    render(<ApiKeyRevealModal created={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
