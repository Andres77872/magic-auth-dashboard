import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthAssignProjectsModal } from '../OAuthAssignProjectsModal';
import { isBindingConflict } from '../oauth-status';
import { projectService } from '@/services';
import { oauthService } from '@/services/oauth.service';
import { useToast } from '@/hooks';
import type { ProjectListResponse } from '@/types/project.types';

vi.mock('@/services', () => ({
  projectService: { getProjects: vi.fn() },
}));

vi.mock('@/services/oauth.service', () => ({
  oauthService: { upsertBinding: vi.fn() },
}));

vi.mock('@/hooks', () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const mockedProjectService = vi.mocked(projectService);
const mockedOAuthService = vi.mocked(oauthService);

function projectsResponse(): ProjectListResponse {
  const created_at = '2026-01-01T00:00:00Z';
  return {
    success: true,
    message: 'ok',
    user_access_level: 'admin_access',
    projects: [
      { project_hash: 'proj_a', project_name: 'Alpha', project_description: 'A', created_at },
      { project_hash: 'proj_b', project_name: 'Bravo', project_description: 'B', created_at },
      { project_hash: 'proj_c', project_name: 'Charlie', project_description: 'C', created_at },
      { project_hash: 'proj_bound', project_name: 'Bound', project_description: 'E', created_at },
    ],
    pagination: { limit: 500, offset: 0, total: 4, has_more: false },
  };
}

function renderModal(
  props: Partial<ComponentProps<typeof OAuthAssignProjectsModal>> = {},
): ComponentProps<typeof OAuthAssignProjectsModal> {
  const merged: ComponentProps<typeof OAuthAssignProjectsModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    connectionHash: 'conn_1',
    connectionName: 'Acme Google',
    providerType: 'google',
    boundProjectHashes: [],
    ...props,
  };
  render(<OAuthAssignProjectsModal {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useToast).mockReturnValue({ showToast });
  mockedProjectService.getProjects.mockResolvedValue(projectsResponse());
});

describe('OAuthAssignProjectsModal', () => {
  it('excludes projects already bound to this connection', async () => {
    renderModal({ boundProjectHashes: ['proj_bound'] });

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Bound')).not.toBeInTheDocument();
  });

  it('defaults the connection key to the provider type and lets it be edited', async () => {
    renderModal();

    const keyInput = await screen.findByLabelText('Connection key');
    expect(keyInput).toHaveValue('google');

    fireEvent.change(keyInput, { target: { value: 'acme-google' } });
    expect(keyInput).toHaveValue('acme-google');
  });

  it('creates one DISABLED binding per selected project via the upsert endpoint', async () => {
    mockedOAuthService.upsertBinding.mockResolvedValue({
      success: true,
      message: 'ok',
    } as never);
    const { onSuccess, onClose } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Bravo'));

    fireEvent.click(screen.getByRole('button', { name: /assign \(2\)/i }));

    await waitFor(() => expect(mockedOAuthService.upsertBinding.mock.calls).toHaveLength(2));
    expect(mockedOAuthService.upsertBinding.mock.calls[0]).toEqual([
      'proj_a',
      'google',
      {
        connection_hash: 'conn_1',
        enabled: false,
        login_enabled: true,
        link_enabled: true,
        provisioning_mode: 'disabled',
        existing_user_policy: 'deny',
      },
    ]);

    // The summary must say the binding is not yet usable.
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/redirect uri and a return origin/i),
        'success',
      ),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('distinguishes a same-provider-type conflict from a generic failure and stays open', async () => {
    mockedOAuthService.upsertBinding.mockImplementation((projectHash: string) => {
      if (projectHash === 'proj_b') {
        return Promise.reject(
          new Error('This project already uses another google connection'),
        );
      }
      if (projectHash === 'proj_c') {
        return Promise.reject(new Error('Internal error'));
      }
      return Promise.resolve({ success: true, message: 'ok' } as never);
    });
    const { onSuccess, onClose } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Bravo'));
    fireEvent.click(screen.getByLabelText('Select Charlie'));

    fireEvent.click(screen.getByRole('button', { name: /assign \(3\)/i }));

    await waitFor(() => expect(mockedOAuthService.upsertBinding.mock.calls).toHaveLength(3));

    // Per-row outcome badges, with the conflict distinct from the failure.
    expect(await screen.findByText('Assigned')).toBeInTheDocument();
    expect(await screen.findByText('Already uses another connection')).toBeInTheDocument();
    expect(await screen.findByText('Failed')).toBeInTheDocument();

    // One aggregate toast per non-empty bucket.
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/^Assigned 1 project/),
        'success',
      );
      expect(showToast).toHaveBeenCalledWith(
        '1 project already use another Google connection',
        'warning',
      );
      expect(showToast).toHaveBeenCalledWith('Failed to assign 1 project', 'error');
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    // Stays open so the badges explaining the conflict remain visible.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('refuses an invalid connection key without calling the API', async () => {
    renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.change(screen.getByLabelText('Connection key'), {
      target: { value: 'Not A Slug!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /assign \(1\)/i }));

    expect(
      await screen.findByText(/use lowercase letters, digits, hyphens and underscores/i),
    ).toBeInTheDocument();
    expect(mockedOAuthService.upsertBinding.mock.calls).toHaveLength(0);
  });
});

describe('isBindingConflict', () => {
  it('matches the "already uses" conflict phrasing', () => {
    expect(isBindingConflict(new Error('This project already uses another connection'))).toBe(true);
    expect(isBindingConflict(new Error('Duplicate entry for key uk_project_oauth_key'))).toBe(true);
    expect(isBindingConflict(new Error('This connection belongs to another project'))).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isBindingConflict(new Error('Network request failed'))).toBe(false);
    expect(isBindingConflict(undefined)).toBe(false);
    expect(isBindingConflict('Resource not found.')).toBe(false);
  });
});
