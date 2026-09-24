import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DelegatedAuthTokenCreateModal,
  DEFAULT_DELEGATION_KEY_NAME,
} from '../DelegatedAuthTokenCreateModal';
import { ApiError } from '@/utils/error-handler';
import type { ComboboxOption } from '@/components/features/shared-pickers';
import type { CreatedApiKey } from '@/types/api-key.types';

const mocks = vi.hoisted(() => ({
  createKey: vi.fn(),
}));

vi.mock('@/hooks/useApiKeys', () => ({
  useApiKeyMutations: () => ({ createKey: mocks.createKey, pending: null }),
}));

// Swap the network-backed pickers for plain selects; keep the other fields real.
vi.mock('../ApiKeyFormFields', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../ApiKeyFormFields')>();
  const { createElement } = await import('react');
  const stub =
    (options: ComboboxOption[]) =>
    ({
      id,
      onChange,
    }: {
      id: string;
      onChange: (option: ComboboxOption | null) => void;
    }) =>
      createElement(
        'select',
        {
          id,
          defaultValue: '',
          onChange: (event: { target: { value: string } }) =>
            onChange(
              options.find((option) => option.value === event.target.value) ??
                null
            ),
        },
        createElement('option', { value: '' }, 'None'),
        ...options.map((option) =>
          createElement(
            'option',
            { key: option.value, value: option.value },
            option.label
          )
        )
      );
  return {
    ...actual,
    OwnerPicker: stub([{ value: 'usr-service', label: 'magic-llm-service' }]),
    ProjectPicker: stub([
      { value: 'target-prj', label: 'Magic LLM' },
      { value: 'source-prj', label: 'Magic Worlds' },
    ]),
  };
});

const createdKey: CreatedApiKey = {
  id: 'public123',
  public_id: 'public123',
  name: DEFAULT_DELEGATION_KEY_NAME,
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

function renderModal(onCreated = vi.fn()): ReturnType<typeof vi.fn> {
  render(
    <DelegatedAuthTokenCreateModal
      isOpen
      onClose={vi.fn()}
      onCreated={onCreated}
    />
  );
  return onCreated;
}

describe('DelegatedAuthTokenCreateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createKey.mockResolvedValue(createdKey);
  });

  it('creates a key on the target project and keeps the caller project out of the request', async () => {
    const onCreated = renderModal();

    fireEvent.change(screen.getByLabelText('Owner'), {
      target: { value: 'usr-service' },
    });
    fireEvent.change(screen.getByLabelText('Target service project'), {
      target: { value: 'target-prj' },
    });
    fireEvent.change(screen.getByLabelText('Caller project'), {
      target: { value: 'source-prj' },
    });
    fireEvent.submit(screen.getByTestId('delegated-auth-token-form'));

    await waitFor(() => expect(mocks.createKey).toHaveBeenCalledTimes(1));
    expect(mocks.createKey).toHaveBeenCalledWith({
      user_hash: 'usr-service',
      project_hash: 'target-prj',
      name: DEFAULT_DELEGATION_KEY_NAME,
      description: undefined,
      expires_at: undefined,
    });
    expect(JSON.stringify(mocks.createKey.mock.calls[0][0])).not.toContain(
      'source-prj'
    );
    expect(onCreated).toHaveBeenCalledWith(
      createdKey,
      expect.objectContaining({
        ownerUserHash: 'usr-service',
        targetProjectHash: 'target-prj',
        targetProjectName: 'Magic LLM',
        sourceProjectHash: 'source-prj',
        sourceProjectName: 'Magic Worlds',
      })
    );
  });

  it('validates the required pickers before creating a key', async () => {
    renderModal();

    fireEvent.submit(screen.getByTestId('delegated-auth-token-form'));

    expect(
      await screen.findByText('Choose the service user who will own the key.')
    ).toBeInTheDocument();
    expect(mocks.createKey).not.toHaveBeenCalled();
  });

  it('explains when the API asks for a recent sign-in', async () => {
    mocks.createKey.mockRejectedValue(
      new ApiError('Recent reauthentication required', 401, 'AUTH_1008')
    );
    renderModal();

    fireEvent.change(screen.getByLabelText('Owner'), {
      target: { value: 'usr-service' },
    });
    fireEvent.change(screen.getByLabelText('Target service project'), {
      target: { value: 'target-prj' },
    });
    fireEvent.change(screen.getByLabelText('Caller project'), {
      target: { value: 'source-prj' },
    });
    fireEvent.submit(screen.getByTestId('delegated-auth-token-form'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /needs a recent sign-in/i
    );
  });
});
