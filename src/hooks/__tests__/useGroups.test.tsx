import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGroups, useUserGroupMutations } from '../useGroups';
import { groupService } from '@/services/group.service';
import type { UserGroup } from '@/types/group.types';

function group(hash: string): UserGroup {
  return {
    group_hash: hash,
    group_name: hash.toLowerCase(),
    description: null,
    member_count: 1,
    created_at: null,
  };
}

describe('useGroups', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the first page sorted by name and exposes the backend total', async () => {
    const list = vi
      .spyOn(groupService, 'listGroups')
      .mockResolvedValue({ groups: [group('UG-1')], total: 40 });

    const { result } = renderHook(() => useGroups({ limit: 10 }));

    await waitFor(() => expect(result.current.groups).toHaveLength(1));
    expect(list).toHaveBeenCalledWith({
      limit: 10,
      offset: 0,
      search: undefined,
      sort_by: 'group_name',
      sort_order: 'asc',
    });
    expect(result.current.total).toBe(40);
  });

  it('hides the total while searching (the backend count ignores search) and resets to the first page', async () => {
    const list = vi
      .spyOn(groupService, 'listGroups')
      .mockResolvedValue({ groups: [group('UG-1')], total: 40 });
    const { result } = renderHook(() => useGroups({ limit: 10 }));
    await waitFor(() => expect(result.current.total).toBe(40));

    act(() => result.current.setOffset(20));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 20 })
      )
    );

    act(() => result.current.setSearchInput('ops'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'ops', offset: 0 })
      )
    );
    expect(result.current.offset).toBe(0);
    expect(result.current.total).toBeUndefined();
  });

  it('passes server sort changes through and returns to the first page', async () => {
    const list = vi
      .spyOn(groupService, 'listGroups')
      .mockResolvedValue({ groups: [], total: 0 });
    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(list).toHaveBeenCalled());

    act(() => result.current.setOffset(25));
    act(() => result.current.setSort({ field: 'created_at', order: 'desc' }));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sort_by: 'created_at',
          sort_order: 'desc',
          offset: 0,
        })
      )
    );
  });

  it('surfaces load errors', async () => {
    vi.spyOn(groupService, 'listGroups').mockRejectedValue(
      new Error('Admin or manage_users permission required')
    );
    const { result } = renderHook(() => useGroups());
    await waitFor(() =>
      expect(result.current.error).toBe(
        'Admin or manage_users permission required'
      )
    );
    expect(result.current.groups).toEqual([]);
  });
});

describe('useUserGroupMutations', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('delegates to the service and propagates backend errors', async () => {
    const create = vi
      .spyOn(groupService, 'createUserGroup')
      .mockResolvedValue(group('UG-9'));
    vi.spyOn(groupService, 'deleteGroup').mockRejectedValue(
      new Error('Only root users may change project admin groups')
    );
    const { result } = renderHook(() => useUserGroupMutations());

    await expect(
      result.current.createGroup({ group_name: 'ops', description: '' })
    ).resolves.toEqual(group('UG-9'));
    expect(create).toHaveBeenCalledWith({ group_name: 'ops', description: '' });
    await expect(result.current.deleteGroup('UG-1')).rejects.toThrow(
      'Only root users may change project admin groups'
    );
  });
});
