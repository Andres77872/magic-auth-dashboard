import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DelegatedAuthTokenCreateModal } from '../DelegatedAuthTokenCreateModal';
import type { CreateApiKeyResponse } from '@/types/api-key.types';
import type { User } from '@/types/auth.types';
import type { ProjectDetails } from '@/types/project.types';

const mocks = vi.hoisted(() => ({
  createKey: vi.fn(),
}));

vi.mock('@/hooks', () => ({
  useApiKeys: () => ({
    createKey: mocks.createKey,
  }),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

const projects: ProjectDetails[] = [
  {
    project_hash: 'target-prj',
    project_name: 'Magic LLM',
    project_description: '',
    created_at: '2026-01-01',
  },
  {
    project_hash: 'source-prj',
    project_name: 'Magic Worlds',
    project_description: '',
    created_at: '2026-01-01',
  },
];

const users: User[] = [
  {
    user_hash: 'usr-service',
    username: 'magic-llm-service',
    email: 'service@example.test',
    user_type: 'admin',
    created_at: '2026-01-01',
    is_active: true,
  },
];

const createResponse: CreateApiKeyResponse = {
  success: true,
  message: 'Created',
  data: {
    id: 'public123',
    public_id: 'public123',
    name: 'Magic LLM delegation token',
    fingerprint: 'FP1234567890',
    secret_last4: 'abcd',
    project_id: 'target-prj',
    owner_user_id: 'usr-service',
    expires_at: '',
    is_active: true,
    created_at: '2026-01-01',
    api_key: 'sk_public123.secret',
  },
};

describe('DelegatedAuthTokenCreateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createKey.mockResolvedValue(createResponse);
  });

  it('creates a normal API key and keeps source project out of the request payload', async () => {
    const onSuccess = vi.fn();

    render(
      <DelegatedAuthTokenCreateModal
        isOpen
        onClose={vi.fn()}
        onSuccess={onSuccess}
        availableProjects={projects}
        availableUsers={users}
      />
    );

    fireEvent.change(screen.getByLabelText('Owner User Hash *'), {
      target: { value: 'usr-service' },
    });
    fireEvent.change(screen.getByLabelText('Target Service Project *'), {
      target: { value: 'target-prj' },
    });
    fireEvent.change(screen.getByLabelText('Source Caller Project *'), {
      target: { value: 'source-prj' },
    });

    fireEvent.submit(screen.getByTestId('delegated-auth-token-form'));

    await waitFor(() => expect(mocks.createKey).toHaveBeenCalledTimes(1));

    expect(mocks.createKey).toHaveBeenCalledWith({
      user_hash: 'usr-service',
      project_hash: 'target-prj',
      name: 'Magic LLM delegation token',
      description: undefined,
      expires_at: undefined,
    });
    expect(JSON.stringify(mocks.createKey.mock.calls[0][0])).not.toContain('source-prj');
    expect(onSuccess).toHaveBeenCalledWith(
      createResponse,
      expect.objectContaining({
        ownerUserHash: 'usr-service',
        targetProjectHash: 'target-prj',
        targetProjectName: 'Magic LLM',
        sourceProjectHash: 'source-prj',
        sourceProjectName: 'Magic Worlds',
      })
    );
  });

  it('validates required delegated auth fields before creating a key', async () => {
    render(
      <DelegatedAuthTokenCreateModal
        isOpen
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        availableProjects={projects}
        availableUsers={users}
      />
    );

    fireEvent.submit(screen.getByTestId('delegated-auth-token-form'));

    expect(await screen.findByText('Owner user hash is required')).toBeInTheDocument();
    expect(mocks.createKey).not.toHaveBeenCalled();
  });
});
