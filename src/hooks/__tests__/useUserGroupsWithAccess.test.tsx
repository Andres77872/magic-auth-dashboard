import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserGroupsWithAccess } from '../useUserGroupsWithAccess';
import { projectGroupService } from '@/services/project-group.service';
import { groupService } from '@/services/group.service';
import type { UserGroupWithAccess } from '@/types/group.types';

const granted: UserGroupWithAccess = {
  group_hash: 'UG-1',
  group_name: 'admin_proj1',
  description: 'Admins',
  member_count: 3,
  created_at: '2024-01-01',
  granted_at: '2024-01-02',
};

describe('useUserGroupsWithAccess', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('does nothing without a project group hash', () => {
    const lookup = vi.spyOn(
      projectGroupService,
      'getUserGroupsForProjectGroup'
    );
    const { result } = renderHook(() => useUserGroupsWithAccess(undefined));

    expect(result.current.userGroups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('returns the user groups granted the project group and how many could not be checked', async () => {
    vi.spyOn(
      projectGroupService,
      'getUserGroupsForProjectGroup'
    ).mockResolvedValue({
      userGroups: [granted],
      uncheckedCount: 2,
    });

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-abc'));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.userGroups).toEqual([granted]);
    expect(result.current.uncheckedCount).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it('sets the error when the lookup fails', async () => {
    vi.spyOn(
      projectGroupService,
      'getUserGroupsForProjectGroup'
    ).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-abc'));

    await waitFor(() => expect(result.current.error).toBe('Network error'));
    expect(result.current.userGroups).toEqual([]);
  });

  it('grants the project group to several user groups and revokes from one', async () => {
    vi.spyOn(
      projectGroupService,
      'getUserGroupsForProjectGroup'
    ).mockResolvedValue({ userGroups: [], uncheckedCount: 0 });
    const grant = vi
      .spyOn(groupService, 'grantProjectGroupAccess')
      .mockImplementation((ug: string) =>
        ug === 'UG-2'
          ? Promise.reject(new Error('Forbidden'))
          : Promise.resolve()
      );
    const revoke = vi
      .spyOn(groupService, 'revokeProjectGroupAccess')
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-abc'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const outcome = await result.current.grant(['UG-1', 'UG-2']);
    expect(grant).toHaveBeenCalledWith('UG-1', 'PG-abc');
    expect(grant).toHaveBeenCalledWith('UG-2', 'PG-abc');
    expect(outcome).toEqual({
      succeeded: ['UG-1'],
      failures: [{ id: 'UG-2', message: 'Forbidden' }],
    });

    await result.current.revoke('UG-1');
    expect(revoke).toHaveBeenCalledWith('UG-1', 'PG-abc');
  });
});
