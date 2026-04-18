import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUserGroupsWithAccess } from '../useUserGroupsWithAccess';
import { projectGroupService } from '@/services';

// Mock the service
vi.mock('@/services', () => ({
  projectGroupService: {
    getUserGroupsForProjectGroup: vi.fn(),
  },
}));

const mockService = vi.mocked(projectGroupService);

describe('useUserGroupsWithAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when projectGroupHash is undefined', async () => {
    const { result } = renderHook(() => useUserGroupsWithAccess(undefined));

    expect(result.current.userGroups).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockService.getUserGroupsForProjectGroup).not.toHaveBeenCalled();
  });

  it('fetches and returns user groups linked to the project group', async () => {
    const mockGroups = [
      {
        group_hash: 'UG-1',
        group_name: 'admin_proj1',
        description: 'Admins',
        member_count: 3,
        created_at: '2024-01-01',
        projectGroups: [{ group_hash: 'PG-abc', group_name: 'default', granted_at: '2024-01-01' }],
      },
    ];

    mockService.getUserGroupsForProjectGroup.mockResolvedValue(mockGroups);

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-abc'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userGroups).toHaveLength(1);
    expect(result.current.userGroups[0].group_hash).toBe('UG-1');
    expect(result.current.error).toBeNull();
  });

  it('sets error state on API failure', async () => {
    mockService.getUserGroupsForProjectGroup.mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-abc'));

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.userGroups).toEqual([]);
  });

  it('shows loading state during fetch', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockService.getUserGroupsForProjectGroup.mockReturnValue(promise as any);

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-abc'));

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);

    // Resolve the promise
    resolvePromise!([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns empty array when no groups are linked', async () => {
    mockService.getUserGroupsForProjectGroup.mockResolvedValue([]);

    const { result } = renderHook(() => useUserGroupsWithAccess('PG-xyz'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.userGroups).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
