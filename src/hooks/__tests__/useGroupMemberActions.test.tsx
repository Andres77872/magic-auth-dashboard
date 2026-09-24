import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGroupMemberActions } from '../useGroupMemberActions';
import { groupService } from '@/services/group.service';

beforeEach(() => vi.restoreAllMocks());

describe('useGroupMemberActions', () => {
  it('adds a single user through the single-member route and reports its error per user', async () => {
    const add = vi
      .spyOn(groupService, 'addMemberToGroup')
      .mockRejectedValue(
        new Error('Only root users may change project admin groups')
      );
    const bulk = vi.spyOn(groupService, 'bulkAddMembers');
    const { result } = renderHook(() => useGroupMemberActions('UG-1'));

    const outcome = await result.current.addMembers(['usr-1']);

    expect(add).toHaveBeenCalledWith('UG-1', { user_hash: 'usr-1' });
    expect(bulk).not.toHaveBeenCalled();
    expect(outcome).toEqual({
      requested: 1,
      succeeded: 0,
      failed: 1,
      failures: [
        {
          user_hash: 'usr-1',
          username: null,
          message: 'Only root users may change project admin groups',
        },
      ],
    });
  });

  it('adds several users through the bulk route', async () => {
    const bulkResult = { requested: 2, succeeded: 2, failed: 0, failures: [] };
    const bulk = vi
      .spyOn(groupService, 'bulkAddMembers')
      .mockResolvedValue(bulkResult);
    const { result } = renderHook(() => useGroupMemberActions('UG-1'));

    await expect(
      result.current.addMembers(['usr-1', 'usr-2'])
    ).resolves.toEqual(bulkResult);
    expect(bulk).toHaveBeenCalledWith('UG-1', ['usr-1', 'usr-2']);
  });

  it('removes a member and propagates failures', async () => {
    const remove = vi
      .spyOn(groupService, 'removeMemberFromGroup')
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useGroupMemberActions('UG-1'));

    await result.current.removeMember('usr-1');
    expect(remove).toHaveBeenCalledWith('UG-1', 'usr-1');

    remove.mockRejectedValueOnce(new Error('User not found'));
    await expect(result.current.removeMember('usr-2')).rejects.toThrow(
      'User not found'
    );
  });
});
