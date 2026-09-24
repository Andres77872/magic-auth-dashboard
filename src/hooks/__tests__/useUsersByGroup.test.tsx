import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useUsersByGroup } from '../useUsersByGroup';
import { groupService } from '@/services/group.service';
import type { GroupMember } from '@/types/group.types';

const member: GroupMember = {
  user_hash: 'usr-1',
  username: 'ana',
  email: 'ana@example.com',
  user_type: 'consumer',
  is_active: true,
  joined_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => vi.restoreAllMocks());

describe('useUsersByGroup', () => {
  it('loads one page of members with the full total', async () => {
    const get = vi
      .spyOn(groupService, 'getGroupMembers')
      .mockResolvedValue({ members: [member], total: 30 });

    const { result } = renderHook(() => useUsersByGroup('UG-1'));

    await waitFor(() => expect(result.current.members).toEqual([member]));
    expect(result.current.total).toBe(30);
    expect(get).toHaveBeenCalledWith('UG-1', { limit: 25, offset: 0 });
  });

  it('pages and clamps the page size to the backend maximum of 100', async () => {
    const get = vi
      .spyOn(groupService, 'getGroupMembers')
      .mockResolvedValue({ members: [member], total: 300 });
    const { result } = renderHook(() => useUsersByGroup('UG-1'));
    await waitFor(() => expect(get).toHaveBeenCalled());

    act(() => result.current.setOffset(25));
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith('UG-1', { limit: 25, offset: 25 })
    );

    act(() => result.current.setLimit(500));
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith('UG-1', { limit: 100, offset: 0 })
    );
  });

  it('does not fetch without a group hash', () => {
    const get = vi.spyOn(groupService, 'getGroupMembers');
    const { result } = renderHook(() => useUsersByGroup(undefined));
    expect(result.current.isLoading).toBe(false);
    expect(get).not.toHaveBeenCalled();
  });
});
