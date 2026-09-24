import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingAttachProjectsModal } from '../BillingAttachProjectsModal';
import { isAttachConflict } from '../billing-status';
import { ApiError } from '@/utils/error-handler';
import type {
  ProjectListResponse,
  ProjectSummary,
} from '@/types/project.types';

const projectService = vi.hoisted(() => ({ getProjects: vi.fn() }));
const billingService = vi.hoisted(() => ({ attachProject: vi.fn() }));
const showToast = vi.hoisted(() => vi.fn());

vi.mock('@/services/project.service', () => ({ projectService }));
vi.mock('@/services/billing.service', () => ({ billingService }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

function project(hash: string, name: string): ProjectSummary {
  return {
    project_hash: hash,
    project_name: name,
    project_description: `${name} project`,
    access_level: 'admin_access',
    access_through: 'admin_access',
  };
}

function projectsResponse(): ProjectListResponse {
  return {
    success: true,
    message: 'ok',
    user_access_level: 'admin',
    projects: [
      project('proj_a', 'Alpha'),
      project('proj_b', 'Bravo'),
      project('proj_c', 'Charlie'),
      project('proj_existing', 'Existing'),
    ],
    pagination: { limit: 500, offset: 0, total: 4, has_more: false },
  };
}

function renderModal(
  props: Partial<ComponentProps<typeof BillingAttachProjectsModal>> = {}
): ComponentProps<typeof BillingAttachProjectsModal> {
  const merged: ComponentProps<typeof BillingAttachProjectsModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    groupHash: 'bg_1',
    groupName: 'Group One',
    attachedProjectHashes: [],
    ...props,
  };
  render(<BillingAttachProjectsModal {...merged} />);
  return merged;
}

beforeEach(() => {
  vi.clearAllMocks();
  projectService.getProjects.mockResolvedValue(projectsResponse());
});

describe('BillingAttachProjectsModal', () => {
  it('requests a full page of projects and hides the ones already attached', async () => {
    renderModal({ attachedProjectHashes: ['proj_existing'] });

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Existing')).not.toBeInTheDocument();
    expect(projectService.getProjects).toHaveBeenCalledWith({
      limit: 500,
      search: undefined,
    });
  });

  it('reports attached / conflict / failed per row and via summary toasts', async () => {
    billingService.attachProject.mockImplementation(
      (_group: string, hash: string) => {
        if (hash === 'proj_b') {
          return Promise.reject(
            new ApiError(
              'Project is already attached to another billing group',
              409,
              'CONF_5003'
            )
          );
        }
        if (hash === 'proj_c')
          return Promise.reject(new ApiError('Internal error', 500));
        return Promise.resolve();
      }
    );
    const { onSuccess, onClose } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Bravo'));
    fireEvent.click(screen.getByLabelText('Select Charlie'));
    fireEvent.click(screen.getByRole('button', { name: /attach \(3\)/i }));

    await waitFor(() =>
      expect(billingService.attachProject).toHaveBeenCalledTimes(3)
    );
    expect(billingService.attachProject).toHaveBeenCalledWith('bg_1', 'proj_a');

    expect(await screen.findByText('Attached')).toBeInTheDocument();
    expect(await screen.findByText('In another group')).toBeInTheDocument();
    expect(await screen.findByText('Failed')).toBeInTheDocument();

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Attached 1 project', 'success');
      expect(showToast).toHaveBeenCalledWith(
        '1 project already in another billing group',
        'warning'
      );
      expect(showToast).toHaveBeenCalledWith(
        'Failed to attach 1 project',
        'error'
      );
    });
    // One succeeded, so the parent refetches; the dialog stays open to explain the rest.
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes after a fully successful attach', async () => {
    billingService.attachProject.mockResolvedValue(undefined);
    const { onSuccess, onClose } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByRole('button', { name: /attach \(1\)/i }));

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Attached 1 project', 'success');
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows a retry when the project list cannot be loaded', async () => {
    projectService.getProjects.mockRejectedValueOnce(new Error('Network down'));
    renderModal();

    expect(
      await screen.findByText(/Projects could not be loaded/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Alpha')).toBeInTheDocument();
  });
});

describe('isAttachConflict', () => {
  it('treats HTTP 409 as a conflict', () => {
    expect(
      isAttachConflict(
        new ApiError(
          'Project is already attached to another billing group',
          409
        )
      )
    ).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isAttachConflict(new ApiError('Resource not found.', 404))).toBe(
      false
    );
    expect(isAttachConflict(new Error('Network request failed'))).toBe(false);
    expect(isAttachConflict(undefined)).toBe(false);
  });
});
