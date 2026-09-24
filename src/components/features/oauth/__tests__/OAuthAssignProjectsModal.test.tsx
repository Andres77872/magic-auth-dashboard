import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthAssignProjectsModal } from '../OAuthAssignProjectsModal';
import { isBindingConflict } from '../oauth-status';
import { projectService } from '@/services/project.service';
import { ApiError } from '@/utils/error-handler';
import type { ProjectListResponse } from '@/types/project.types';

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('@/services/project.service', () => ({
  projectService: { getProjects: vi.fn() },
}));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

const mockedProjectService = vi.mocked(projectService);

function projectsResponse(): ProjectListResponse {
  const project = (
    hash: string,
    name: string
  ): ProjectListResponse['projects'][number] => ({
    project_hash: hash,
    project_name: name,
    project_description: null,
    access_level: 'admin_access',
    access_through: 'admin_access',
  });
  return {
    success: true,
    user_access_level: 'admin',
    projects: [
      project('proj-a', 'Alpha'),
      project('proj-b', 'Bravo'),
      project('proj-c', 'Charlie'),
      project('proj-bound', 'Bound'),
    ],
    pagination: { limit: 500, offset: 0, total: 4, has_more: false },
  };
}

type Props = ComponentProps<typeof OAuthAssignProjectsModal>;

function renderModal(props: Partial<Props> = {}): Props {
  const merged: Props = {
    isOpen: true,
    onClose: vi.fn(),
    connectionName: 'Acme Google',
    providerType: 'google',
    boundProjectHashes: [],
    assignProject: vi.fn<Props['assignProject']>().mockResolvedValue(undefined),
    onAssigned: vi.fn(),
    ...props,
  };
  render(<OAuthAssignProjectsModal {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedProjectService.getProjects.mockResolvedValue(projectsResponse());
});

describe('OAuthAssignProjectsModal', () => {
  it('leaves out projects already bound to this connection', async () => {
    renderModal({ boundProjectHashes: ['proj-bound'] });

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

  it('assigns each selected project under the normalised key, then refetches once and closes', async () => {
    const { assignProject, onAssigned, onClose } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.change(screen.getByLabelText('Connection key'), {
      target: { value: ' Acme-Google ' },
    });
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Bravo'));
    fireEvent.click(screen.getByRole('button', { name: /assign \(2\)/i }));

    await waitFor(() => expect(assignProject).toHaveBeenCalledTimes(2));
    expect(assignProject).toHaveBeenNthCalledWith(1, 'proj-a', 'acme-google');
    expect(assignProject).toHaveBeenNthCalledWith(2, 'proj-b', 'acme-google');

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/redirect uri and a return origin/i),
        'success'
      )
    );
    expect(onAssigned).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('separates 409 conflicts from failures, names the failure cause and stays open', async () => {
    const assignProject = vi
      .fn<Props['assignProject']>()
      .mockImplementation((projectHash) => {
        if (projectHash === 'proj-b') {
          return Promise.reject(
            new ApiError(
              'This project already has a sign-in provider under the key "google".',
              409
            )
          );
        }
        if (projectHash === 'proj-c') {
          return Promise.reject(
            new ApiError(
              'This connection belongs to another project',
              403,
              'AUTHZ_4003'
            )
          );
        }
        return Promise.resolve();
      });
    const { onAssigned, onClose } = renderModal({ assignProject });

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Bravo'));
    fireEvent.click(screen.getByLabelText('Select Charlie'));
    fireEvent.click(screen.getByRole('button', { name: /assign \(3\)/i }));

    expect(await screen.findByText('Assigned')).toBeInTheDocument();
    expect(await screen.findByText('Key in use')).toBeInTheDocument();
    expect(await screen.findByText('Failed')).toBeInTheDocument();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/^1 project assigned/),
        'success'
      );
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/^1 project already uses the key "google"/),
        'warning'
      );
      expect(showToast).toHaveBeenCalledWith(
        '1 project could not be assigned: This connection belongs to another project',
        'error'
      );
    });
    expect(onAssigned).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('refuses an invalid connection key without calling the API', async () => {
    const { assignProject } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.change(screen.getByLabelText('Connection key'), {
      target: { value: 'Not A Slug!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /assign \(1\)/i }));

    expect(
      await screen.findByText(
        /use lowercase letters, digits, hyphens and underscores/i
      )
    ).toBeInTheDocument();
    expect(assignProject).not.toHaveBeenCalled();
  });
});

describe('isBindingConflict', () => {
  it('is true only for 409 API errors', () => {
    expect(
      isBindingConflict(
        new ApiError(
          'A project_oauth_bindings with ... already exists',
          409,
          'CONF_5004'
        )
      )
    ).toBe(true);
    expect(
      isBindingConflict(
        new ApiError('This connection belongs to another project', 403)
      )
    ).toBe(false);
    expect(isBindingConflict(new ApiError('Binding rejected', 400))).toBe(
      false
    );
  });

  it('does not guess from message text', () => {
    expect(
      isBindingConflict(
        new Error('This project already uses another connection')
      )
    ).toBe(false);
    expect(isBindingConflict('Duplicate entry')).toBe(false);
    expect(isBindingConflict(undefined)).toBe(false);
  });
});
