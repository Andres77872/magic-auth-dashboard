import { type ComponentProps } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingAttachProjectsModal } from '../BillingAttachProjectsModal';
import { isAttachConflict } from '../billing-status';
import { billingService, projectService } from '@/services';
import { useToast } from '@/hooks';
import type { ProjectListResponse } from '@/types/project.types';

vi.mock('@/services', () => ({
  projectService: { getProjects: vi.fn() },
  billingService: { attachProject: vi.fn() },
}));

vi.mock('@/hooks', () => ({
  useToast: vi.fn(),
}));

const showToast = vi.fn();
const mockedProjectService = vi.mocked(projectService);
const mockedBillingService = vi.mocked(billingService);

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
      { project_hash: 'proj_existing', project_name: 'Existing', project_description: 'E', created_at },
    ],
    pagination: { limit: 500, offset: 0, total: 4, has_more: false },
  };
}

function renderModal(
  props: Partial<ComponentProps<typeof BillingAttachProjectsModal>> = {},
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
  vi.mocked(useToast).mockReturnValue({ showToast });
  mockedProjectService.getProjects.mockResolvedValue(projectsResponse());
});

describe('BillingAttachProjectsModal', () => {
  it('excludes projects already attached to this group', async () => {
    renderModal({ attachedProjectHashes: ['proj_existing'] });

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Existing')).not.toBeInTheDocument();
  });

  it('reports attached / conflict / failed per row and via summary toasts', async () => {
    mockedBillingService.attachProject.mockImplementation((_group: string, hash: string) => {
      if (hash === 'proj_b') {
        return Promise.reject(new Error('Project is already attached to another billing group'));
      }
      if (hash === 'proj_c') {
        return Promise.reject(new Error('Internal error'));
      }
      return Promise.resolve({ success: true, message: 'ok' });
    });
    const { onSuccess, onClose } = renderModal();

    await screen.findByText('Alpha');
    fireEvent.click(screen.getByLabelText('Select Alpha'));
    fireEvent.click(screen.getByLabelText('Select Bravo'));
    fireEvent.click(screen.getByLabelText('Select Charlie'));

    fireEvent.click(screen.getByRole('button', { name: /attach \(3\)/i }));

    await waitFor(() => expect(mockedBillingService.attachProject.mock.calls).toHaveLength(3));

    // Per-row outcome badges.
    expect(await screen.findByText('Attached')).toBeInTheDocument();
    expect(await screen.findByText('In another group')).toBeInTheDocument();
    expect(await screen.findByText('Failed')).toBeInTheDocument();

    // Summary toasts (one per non-zero bucket).
    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith('Attached 1 project', 'success');
      expect(showToast).toHaveBeenCalledWith('1 project already in another billing group', 'warning');
      expect(showToast).toHaveBeenCalledWith('Failed to attach 1 project', 'error');
    });

    // At least one attach succeeded -> parent refetches; modal stays open because some failed.
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes after a fully successful attach', async () => {
    mockedBillingService.attachProject.mockResolvedValue({ success: true, message: 'ok' });
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
});

describe('isAttachConflict', () => {
  it('matches the canonical 409 conflict phrase', () => {
    expect(isAttachConflict(new Error('Project is already attached to another billing group'))).toBe(
      true,
    );
  });

  it('returns false for unrelated errors', () => {
    expect(isAttachConflict(new Error('Network request failed'))).toBe(false);
    expect(isAttachConflict(undefined)).toBe(false);
    expect(isAttachConflict('Resource not found.')).toBe(false);
  });
});
