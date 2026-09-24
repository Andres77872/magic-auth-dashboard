/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import './setup-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AddMembersModal } from '../AddMembersModal';
import { groupService } from '@/services/group.service';
import { userService } from '@/services/user.service';
import { UserType, type User } from '@/types/auth.types';
import type { UserListResponse } from '@/types/user.types';

function user(hash: string, username: string): User {
  return {
    user_hash: hash,
    username,
    email: `${username}@example.com`,
    user_type: UserType.CONSUMER,
    created_at: '2026-01-01T00:00:00Z',
    is_active: true,
  };
}

function usersResponse(users: User[]): UserListResponse {
  return {
    success: true,
    message: 'ok',
    users,
    pagination: { limit: 50, offset: 0, total: users.length, has_more: false },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(userService, 'getUsers').mockResolvedValue(
    usersResponse([
      user('usr-1', 'ana'),
      user('usr-2', 'bo'),
      user('usr-3', 'cy'),
    ])
  );
});

function renderModal(
  overrides: Partial<Parameters<typeof AddMembersModal>[0]> = {}
): {
  onClose: ReturnType<typeof vi.fn>;
  onAdded: ReturnType<typeof vi.fn>;
} {
  const onClose = vi.fn();
  const onAdded = vi.fn();
  render(
    <AddMembersModal
      groupHash="UG-1"
      groupName="ops"
      knownMemberHashes={['usr-3']}
      onClose={onClose}
      onAdded={onAdded}
      {...overrides}
    />
  );
  return { onClose, onAdded };
}

describe('AddMembersModal', () => {
  it('searches active users and marks known members as already added', async () => {
    renderModal();

    expect(await screen.findByText('ana')).toBeInTheDocument();
    const known = screen.getByText('cy').closest('li');
    expect(known).not.toBeNull();
    expect(
      within(known as HTMLElement).getByText('Already a member')
    ).toBeInTheDocument();
    expect(within(known as HTMLElement).getByRole('checkbox')).toBeDisabled();
    expect(userService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, include_group_info: false })
    );
  });

  it('adds one user through the single-member route and closes when it succeeds', async () => {
    const add = vi.spyOn(groupService, 'addMemberToGroup').mockResolvedValue({
      success: true,
      assignment: {
        user: { user_hash: 'usr-1', username: 'ana' },
        group: { group_hash: 'UG-1', group_name: 'ops' },
        assigned_by: 'root',
      },
    });
    const { onClose, onAdded } = renderModal();

    fireEvent.click(await screen.findByLabelText('ana'));
    fireEvent.click(screen.getByRole('button', { name: 'Add 1 member' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(add).toHaveBeenCalledWith('UG-1', { user_hash: 'usr-1' });
    expect(onAdded).toHaveBeenCalledWith({
      requested: 1,
      succeeded: 1,
      failed: 0,
      failures: [],
    });
  });

  it('shows bulk failures instead of claiming success', async () => {
    vi.spyOn(groupService, 'bulkAddMembers').mockResolvedValue({
      requested: 2,
      succeeded: 1,
      failed: 1,
      failures: [
        {
          user_hash: 'usr-2',
          username: null,
          message: 'User not found: usr-2',
        },
      ],
    });
    const { onClose, onAdded } = renderModal();

    fireEvent.click(await screen.findByLabelText('ana'));
    fireEvent.click(screen.getByLabelText('bo'));
    fireEvent.click(screen.getByRole('button', { name: 'Add 2 members' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('1 user could not be changed');
    expect(alert).toHaveTextContent('bo: User not found: usr-2');
    expect(onAdded).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('keeps the dialog open when every user fails and does not report an addition', async () => {
    vi.spyOn(groupService, 'addMemberToGroup').mockRejectedValue(
      new Error('Only root users may change project admin groups')
    );
    const { onClose, onAdded } = renderModal();

    fireEvent.click(await screen.findByLabelText('ana'));
    fireEvent.click(screen.getByRole('button', { name: 'Add 1 member' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only root users may change project admin groups'
    );
    expect(onAdded).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
