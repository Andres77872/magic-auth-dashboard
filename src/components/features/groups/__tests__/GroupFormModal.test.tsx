import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { GroupFormModal } from '../GroupFormModal';

describe('GroupFormModal', () => {
  it('renders nothing while closed', () => {
    render(
      <GroupFormModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        mode="create"
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('requires a name, then submits trimmed values and closes after the API resolves', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <GroupFormModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        mode="create"
        kind="project"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Create project group' })
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Create project group' })
    );
    expect(await screen.findByText('Enter a name.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: '  mobile-apps ' },
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: ' Phones ' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Create project group' })
    );

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        group_name: 'mobile-apps',
        description: 'Phones',
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('stops non-root operators from creating admin_ user groups', async () => {
    const onSubmit = vi.fn();
    render(
      <GroupFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        mode="create"
        canUseAdminPrefix={false}
      />
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Admin_payments' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create user group' }));

    expect(
      await screen.findByText(
        /Only root users can use names that start with admin_/
      )
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the dialog open with the backend message when saving fails', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error('Group name already exists'));
    const onClose = vi.fn();
    render(
      <GroupFormModal
        isOpen
        onClose={onClose}
        onSubmit={onSubmit}
        mode="edit"
        group={{ group_name: 'ops', description: 'Operations' }}
      />
    );

    expect(screen.getByLabelText('Name')).toHaveValue('ops');
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: '' },
    });
    expect(
      screen.getByText(/descriptions can’t be cleared/)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Group name already exists'
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
