import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenManagementPage } from '../TokenManagementPage';
import type { ApiKey } from '@/types/api-key.types';

const mocks = vi.hoisted(() => ({
  isRoot: false,
  showToast: vi.fn(),
}));

vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

const mockedKeys = vi.hoisted(() => ({
  listKeys: vi.fn(),
  getKey: vi.fn(),
  createKey: vi.fn(),
  updateKey: vi.fn(),
  revokeKey: vi.fn(),
}));
const mockedProjects = vi.hoisted(() => ({ getProjects: vi.fn() }));

vi.mock('@/services/api-key.service', () => ({ apiKeyService: mockedKeys }));
vi.mock('@/services/project.service', () => ({
  projectService: mockedProjects,
}));

vi.mock('@/services/user.service', () => ({
  userService: { getUsers: vi.fn() },
}));

function makeKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    id: 'pub1',
    public_id: 'pub1',
    name: 'Billing worker',
    description: null,
    project_id: 'proj-internal',
    owner_user_id: 'usr-internal',
    is_active: true,
    expires_at: null,
    last_used_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    revoked_at: null,
    revoke_reason: null,
    fingerprint: 'FP1234567890',
    secret_last4: 'abcd',
    hash_algorithm: 'hmac-sha256-v1',
    project_hash: 'proj-alpha',
    project_name: 'Alpha',
    owner_user_hash: 'usr-alice',
    owner_username: 'alice',
    ...overrides,
  };
}

function renderPage(path = '/tokens'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <TokenManagementPage />
    </MemoryRouter>
  );
}

describe('TokenManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isRoot = false;
    mockedProjects.getProjects.mockResolvedValue({
      success: true,
      projects: [
        {
          project_hash: 'proj-alpha',
          project_name: 'Alpha',
          project_description: null,
          access_level: 'admin_access',
          access_through: 'admin_access',
        },
      ],
      pagination: { limit: 500, offset: 0, total: 1, has_more: false },
      user_access_level: 'admin',
    });
    mockedKeys.getKey.mockImplementation((keyId: string) =>
      Promise.resolve(makeKey({ public_id: keyId, id: keyId }))
    );
  });

  it('asks root to choose an owner or project instead of calling the API', async () => {
    mocks.isRoot = true;
    renderPage();

    expect(
      await screen.findByText('Choose an owner or a project')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'API keys' })
    ).toBeInTheDocument();
    expect(mockedKeys.listKeys).not.toHaveBeenCalled();
  });

  it('lists a project for root when the project filter is in the URL', async () => {
    mocks.isRoot = true;
    mockedKeys.listKeys.mockResolvedValue({
      keys: [makeKey()],
      total: 1,
      limit: 25,
      offset: 0,
    });
    renderPage('/tokens?project=proj-alpha');

    expect(await screen.findByText('Billing worker')).toBeInTheDocument();
    expect(mockedKeys.listKeys).toHaveBeenCalledWith(
      expect.objectContaining({
        projectHash: 'proj-alpha',
        limit: 25,
        offset: 0,
      })
    );
  });

  it('loads the admin overview once and says when it is truncated', async () => {
    mockedKeys.listKeys.mockResolvedValue({
      keys: [makeKey()],
      total: 350,
      limit: 200,
      offset: 0,
    });
    renderPage();

    expect(await screen.findByText('Billing worker')).toBeInTheDocument();
    expect(mockedKeys.listKeys).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 200, offset: 0 })
    );
    expect(
      screen.getByText(/Showing the first 1 of 350 keys/)
    ).toBeInTheDocument();
  });

  it('revokes a key only after the name is typed, then refreshes', async () => {
    mockedKeys.listKeys.mockResolvedValue({
      keys: [makeKey()],
      total: 1,
      limit: 200,
      offset: 0,
    });
    mockedKeys.revokeKey.mockResolvedValue({
      key_id: 'pub1',
      revoked_at: '2026-02-01T00:00:00Z',
    });
    renderPage();

    fireEvent.click(await screen.findByText('Billing worker'));
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke key' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Revoke API key?',
    });
    const confirm = within(dialog).getByRole('button', { name: 'Revoke key' });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText(/to confirm/i), {
      target: { value: 'Billing worker' },
    });
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(mockedKeys.revokeKey).toHaveBeenCalledWith('pub1')
    );
    await waitFor(() => expect(mockedKeys.listKeys).toHaveBeenCalledTimes(2));
    expect(mocks.showToast).toHaveBeenCalledWith(
      expect.stringContaining('Revoked'),
      'success'
    );
  });

  it('sends the optional revoke reason', async () => {
    mockedKeys.listKeys.mockResolvedValue({
      keys: [makeKey()],
      total: 1,
      limit: 200,
      offset: 0,
    });
    mockedKeys.revokeKey.mockResolvedValue({
      key_id: 'pub1',
      revoked_at: '2026-02-01T00:00:00Z',
    });
    renderPage();

    fireEvent.click(await screen.findByText('Billing worker'));
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke key' }));

    const dialog = await screen.findByRole('dialog', {
      name: 'Revoke API key?',
    });
    fireEvent.change(within(dialog).getByLabelText(/reason/i), {
      target: { value: 'Leaked in CI logs' },
    });
    fireEvent.change(within(dialog).getByLabelText(/to confirm/i), {
      target: { value: 'Billing worker' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Revoke key' }));

    await waitFor(() =>
      expect(mockedKeys.revokeKey).toHaveBeenCalledWith(
        'pub1',
        'Leaked in CI logs'
      )
    );
  });
});
