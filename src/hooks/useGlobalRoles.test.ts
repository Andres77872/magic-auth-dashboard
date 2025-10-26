import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGlobalRoles } from './useGlobalRoles';
import { globalRolesService } from '@/services';
import type { GlobalRole, GlobalPermissionGroup, GlobalPermission } from '@/types/global-roles.types';

// Mock the service
vi.mock('@/services', () => ({
  globalRolesService: {
    getRoles: vi.fn(),
    getRole: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    getPermissionGroups: vi.fn(),
    getPermissionGroup: vi.fn(),
    createPermissionGroup: vi.fn(),
    assignPermissionGroupToRole: vi.fn(),
    getPermissions: vi.fn(),
    createPermission: vi.fn(),
    checkPermission: vi.fn(),
    assignRoleToUser: vi.fn(),
    getUserRole: vi.fn(),
    getMyRole: vi.fn(),
    getMyPermissions: vi.fn(),
  },
}));

describe('useGlobalRoles', () => {
  const mockRoles: GlobalRole[] = [
    {
      id: 1,
      role_hash: 'role_abc123',
      role_name: 'admin',
      role_display_name: 'Administrator',
      role_priority: 100,
      is_system_role: true,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      role_hash: 'role_def456',
      role_name: 'user',
      role_display_name: 'Standard User',
      role_priority: 10,
      is_system_role: false,
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockPermissionGroups: GlobalPermissionGroup[] = [
    {
      id: 1,
      group_hash: 'pg_abc123',
      group_name: 'user_management',
      group_display_name: 'User Management',
      group_category: 'admin',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockPermissions: GlobalPermission[] = [
    {
      id: 1,
      permission_hash: 'perm_abc123',
      permission_name: 'users.create',
      permission_display_name: 'Create Users',
      permission_category: 'user_management',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(globalRolesService.getRoles).mockResolvedValue({
      success: true,
      data: mockRoles,
    });
    vi.mocked(globalRolesService.getPermissionGroups).mockResolvedValue({
      success: true,
      data: mockPermissionGroups,
    });
    vi.mocked(globalRolesService.getPermissions).mockResolvedValue({
      success: true,
      data: mockPermissions,
    });
    vi.mocked(globalRolesService.getMyPermissions).mockResolvedValue({
      success: true,
      data: ['users.create', 'projects.read'],
    });
    vi.mocked(globalRolesService.getMyRole).mockResolvedValue({
      success: true,
      data: mockRoles[0],
    });
  });

  describe('Initial Data Loading', () => {
    it('should load roles on mount', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      expect(result.current.loadingRoles).toBe(true);

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      expect(result.current.roles).toEqual(mockRoles);
      expect(result.current.rolesError).toBeNull();
      expect(globalRolesService.getRoles).toHaveBeenCalledTimes(1);
    });

    it('should load permission groups on mount', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingGroups).toBe(false);
      });

      expect(result.current.permissionGroups).toEqual(mockPermissionGroups);
      expect(result.current.groupsError).toBeNull();
      expect(globalRolesService.getPermissionGroups).toHaveBeenCalledTimes(1);
    });

    it('should load permissions on mount', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingPermissions).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);
      expect(result.current.permissionsError).toBeNull();
      expect(globalRolesService.getPermissions).toHaveBeenCalledTimes(1);
    });

    it('should load current user role and permissions on mount', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.currentRole).not.toBeNull();
      });

      expect(result.current.currentRole).toEqual(mockRoles[0]);
      expect(result.current.myPermissions).toEqual(['users.create', 'projects.read']);
    });

    it('should handle errors when loading roles', async () => {
      const errorMessage = 'Failed to fetch roles';
      vi.mocked(globalRolesService.getRoles).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      expect(result.current.rolesError).toBe(errorMessage);
      expect(result.current.roles).toEqual([]);
    });
  });

  describe('Role Management', () => {
    it('should create a role successfully', async () => {
      const newRoleData = {
        role_name: 'test_role',
        role_display_name: 'Test Role',
        role_description: 'Test description',
      };

      vi.mocked(globalRolesService.createRole).mockResolvedValue({
        success: true,
        data: {
          ...mockRoles[0],
          ...newRoleData,
          role_hash: 'role_new123',
        },
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      await act(async () => {
        await result.current.createRole(newRoleData);
      });

      expect(globalRolesService.createRole).toHaveBeenCalledWith(newRoleData);
      expect(globalRolesService.getRoles).toHaveBeenCalledTimes(2); // Initial + after create
    });

    it('should handle errors when creating a role', async () => {
      const errorMessage = 'Role name already exists';
      vi.mocked(globalRolesService.createRole).mockRejectedValue(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          await result.current.createRole({
            role_name: 'duplicate',
            role_display_name: 'Duplicate Role',
          });
        });
      }).rejects.toThrow(errorMessage);

      expect(result.current.rolesError).toBe(errorMessage);
    });

    it('should update a role successfully', async () => {
      const updateData = {
        role_display_name: 'Updated Admin',
        role_description: 'Updated description',
      };

      vi.mocked(globalRolesService.updateRole).mockResolvedValue({
        success: true,
        data: { ...mockRoles[0], ...updateData },
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      await act(async () => {
        await result.current.updateRole('role_abc123', updateData);
      });

      expect(globalRolesService.updateRole).toHaveBeenCalledWith(
        'role_abc123',
        updateData
      );
      expect(globalRolesService.getRoles).toHaveBeenCalledTimes(2);
    });

    it('should delete a role successfully', async () => {
      vi.mocked(globalRolesService.deleteRole).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      await act(async () => {
        await result.current.deleteRole('role_def456');
      });

      expect(globalRolesService.deleteRole).toHaveBeenCalledWith('role_def456');
      expect(globalRolesService.getRoles).toHaveBeenCalledTimes(2);
    });

    it('should get a specific role', async () => {
      vi.mocked(globalRolesService.getRole).mockResolvedValue({
        success: true,
        data: mockRoles[0],
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      let role: GlobalRole | null = null;
      await act(async () => {
        role = await result.current.getRole('role_abc123');
      });

      expect(globalRolesService.getRole).toHaveBeenCalledWith('role_abc123');
      expect(role).toEqual(mockRoles[0]);
    });
  });

  describe('Permission Group Management', () => {
    it('should create a permission group successfully', async () => {
      const newGroupData = {
        group_name: 'test_group',
        group_display_name: 'Test Group',
        group_category: 'test',
      };

      vi.mocked(globalRolesService.createPermissionGroup).mockResolvedValue({
        success: true,
        data: {
          ...mockPermissionGroups[0],
          ...newGroupData,
          group_hash: 'pg_new123',
        },
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingGroups).toBe(false);
      });

      await act(async () => {
        await result.current.createPermissionGroup(newGroupData);
      });

      expect(globalRolesService.createPermissionGroup).toHaveBeenCalledWith(
        newGroupData
      );
      expect(globalRolesService.getPermissionGroups).toHaveBeenCalledTimes(2);
    });

    it('should get a specific permission group', async () => {
      vi.mocked(globalRolesService.getPermissionGroup).mockResolvedValue({
        success: true,
        data: mockPermissionGroups[0],
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingGroups).toBe(false);
      });

      let group: GlobalPermissionGroup | null = null;
      await act(async () => {
        group = await result.current.getPermissionGroup('pg_abc123');
      });

      expect(globalRolesService.getPermissionGroup).toHaveBeenCalledWith(
        'pg_abc123'
      );
      expect(group).toEqual(mockPermissionGroups[0]);
    });

    it('should assign permission group to role', async () => {
      vi.mocked(globalRolesService.assignPermissionGroupToRole).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      await act(async () => {
        await result.current.assignPermissionGroupToRole('role_abc123', 'pg_def456');
      });

      expect(globalRolesService.assignPermissionGroupToRole).toHaveBeenCalledWith(
        'role_abc123',
        'pg_def456'
      );
    });
  });

  describe('Permission Management', () => {
    it('should create a permission successfully', async () => {
      const newPermissionData = {
        permission_name: 'test.permission',
        permission_display_name: 'Test Permission',
        permission_category: 'test',
      };

      vi.mocked(globalRolesService.createPermission).mockResolvedValue({
        success: true,
        data: {
          ...mockPermissions[0],
          ...newPermissionData,
          permission_hash: 'perm_new123',
        },
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingPermissions).toBe(false);
      });

      await act(async () => {
        await result.current.createPermission(newPermissionData);
      });

      expect(globalRolesService.createPermission).toHaveBeenCalledWith(
        newPermissionData
      );
      expect(globalRolesService.getPermissions).toHaveBeenCalledTimes(2);
    });

    it('should check if user has a permission', async () => {
      vi.mocked(globalRolesService.checkPermission).mockResolvedValue({
        success: true,
        data: { has_permission: true, permission: 'users.create' },
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingPermissions).toBe(false);
      });

      let hasPermission = false;
      await act(async () => {
        hasPermission = await result.current.checkPermission('users.create');
      });

      expect(globalRolesService.checkPermission).toHaveBeenCalledWith('users.create');
      expect(hasPermission).toBe(true);
    });

    it('should return false when permission check fails', async () => {
      vi.mocked(globalRolesService.checkPermission).mockRejectedValue(
        new Error('Permission check failed')
      );

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingPermissions).toBe(false);
      });

      let hasPermission = true;
      await act(async () => {
        hasPermission = await result.current.checkPermission('admin.delete');
      });

      expect(hasPermission).toBe(false);
    });
  });

  describe('User Role Assignment', () => {
    it('should assign a role to a user', async () => {
      vi.mocked(globalRolesService.assignRoleToUser).mockResolvedValue({
        success: true,
        data: {
          user_hash: 'user_abc123',
          username: 'testuser',
          role_hash: 'role_def456',
          role_name: 'user',
          assigned_at: '2024-01-01T00:00:00Z',
        },
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      await act(async () => {
        await result.current.assignRoleToUser('user_abc123', 'role_def456');
      });

      expect(globalRolesService.assignRoleToUser).toHaveBeenCalledWith(
        'user_abc123',
        'role_def456'
      );
    });

    it('should get a user\'s role', async () => {
      vi.mocked(globalRolesService.getUserRole).mockResolvedValue({
        success: true,
        data: mockRoles[1],
      });

      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      let userRole: GlobalRole | null = null;
      await act(async () => {
        userRole = await result.current.getUserRole('user_abc123');
      });

      expect(globalRolesService.getUserRole).toHaveBeenCalledWith('user_abc123');
      expect(userRole).toEqual(mockRoles[1]);
    });

    it('should get current user\'s role', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.currentRole).not.toBeNull();
      });

      let myRole: GlobalRole | null = null;
      await act(async () => {
        myRole = await result.current.getMyRole();
      });

      expect(globalRolesService.getMyRole).toHaveBeenCalled();
      expect(myRole).toEqual(mockRoles[0]);
      expect(result.current.currentRole).toEqual(mockRoles[0]);
    });
  });

  describe('Refresh Functions', () => {
    it('should refresh roles', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingRoles).toBe(false);
      });

      // Clear previous calls
      vi.mocked(globalRolesService.getRoles).mockClear();

      await act(async () => {
        await result.current.refreshRoles();
      });

      expect(globalRolesService.getRoles).toHaveBeenCalledTimes(1);
    });

    it('should refresh permission groups', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingGroups).toBe(false);
      });

      vi.mocked(globalRolesService.getPermissionGroups).mockClear();

      await act(async () => {
        await result.current.refreshPermissionGroups();
      });

      expect(globalRolesService.getPermissionGroups).toHaveBeenCalledTimes(1);
    });

    it('should refresh permissions', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.loadingPermissions).toBe(false);
      });

      vi.mocked(globalRolesService.getPermissions).mockClear();

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(globalRolesService.getPermissions).toHaveBeenCalledTimes(1);
    });

    it('should refresh my permissions', async () => {
      const { result } = renderHook(() => useGlobalRoles());

      await waitFor(() => {
        expect(result.current.myPermissions.length).toBeGreaterThan(0);
      });

      vi.mocked(globalRolesService.getMyPermissions).mockClear();

      await act(async () => {
        await result.current.refreshMyPermissions();
      });

      expect(globalRolesService.getMyPermissions).toHaveBeenCalledTimes(1);
    });
  });
});





