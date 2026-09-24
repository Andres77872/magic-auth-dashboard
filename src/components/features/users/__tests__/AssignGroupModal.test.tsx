import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssignGroupModal } from '../AssignGroupModal';

const service = vi.hoisted(() => ({
  listGroups: vi.fn(),
  listProjectGroupGrants: vi.fn(),
}));
vi.mock('@/services/group.service', () => ({ groupService: service }));

let isRoot = false;
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');
  return { ...actual, useUserType: () => ({ isRoot }) };
});

const groups = [
  {
    group_hash: 'ug-eng',
    group_name: 'Engineering',
    description: 'Product team',
    member_count: 4,
    created_at: null,
  },
  {
    group_hash: 'ug-admin',
    group_name: 'admin_proj-1',
    description: 'Admins',
    member_count: 1,
    created_at: null,
  },
  {
    group_hash: 'ug-beta',
    group_name: 'Beta testers',
    description: null,
    member_count: 9,
    created_at: null,
  },
];

describe('AssignGroupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRoot = false;
    service.listGroups.mockResolvedValue({ groups, total: 3 });
    service.listProjectGroupGrants.mockResolvedValue([]);
  });

  const renderModal = (onConfirm = vi.fn()): ReturnType<typeof vi.fn> => {
    render(
      <AssignGroupModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        userName="ana"
        excludeHashes={['ug-beta']}
      />
    );
    return onConfirm;
  };

  it('lists groups and marks existing memberships and root-only groups as unavailable', async () => {
    renderModal();
    const beta = await screen.findByRole('radio', { name: /Beta testers/ });
    expect(beta).toBeDisabled();
    expect(beta).toHaveTextContent('Already a member');
    expect(screen.getByRole('radio', { name: /admin_proj-1/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Engineering/ })).toBeEnabled();
  });

  it('lets root pick project administrator groups', async () => {
    isRoot = true;
    renderModal();
    expect(
      await screen.findByRole('radio', { name: /admin_proj-1/ })
    ).toBeEnabled();
  });

  it('warns when the chosen group reaches no project, then confirms the choice', async () => {
    const onConfirm = renderModal();
    fireEvent.click(await screen.findByRole('radio', { name: /Engineering/ }));
    expect(
      await screen.findByText(/grants no project access yet/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add to group' }));
    expect(onConfirm).toHaveBeenCalledWith('ug-eng');
  });

  it('shows the project groups a group grants', async () => {
    service.listProjectGroupGrants.mockResolvedValue([
      {
        group_hash: 'pg-1',
        group_name: 'All products',
        group_description: null,
        created_at: null,
        is_active: true,
        granted_at: null,
      },
    ]);
    renderModal();
    fireEvent.click(await screen.findByRole('radio', { name: /Engineering/ }));
    expect(await screen.findByText(/Grants All products/)).toBeInTheDocument();
  });

  it('searches on the server', async () => {
    renderModal();
    await screen.findByRole('radio', { name: /Engineering/ });
    fireEvent.change(
      screen.getByRole('textbox', { name: /search user groups/i }),
      { target: { value: 'eng' } }
    );
    await waitFor(() =>
      expect(service.listGroups).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'eng' })
      )
    );
  });
});
