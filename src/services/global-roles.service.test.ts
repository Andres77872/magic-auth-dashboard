import { describe, it, expect, vi, beforeEach } from 'vitest';
import { globalRolesService } from './global-roles.service';
import { apiClient } from './api.client';
import type {
  GlobalRole,
  GlobalPermissionGroup,
  GlobalPermission,
  CreateGlobalRoleRequest,
  UpdateGlobalRoleRequest,
} from '@/types/global-roles.types';

// Mock the API client
vi.mock('./api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('GlobalRolesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // ROLE MANAGEMENT TESTS
  // ============================================

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const mockRequest: CreateGlobalRoleRequest = {
        role_name: 'test_admin',
        role_display_name: 'Test Administrator',
        role_description: 'Test role description',
        role_priority: 100,
      };

      const mockResponse: GlobalRole = {
        id: 1,
        role_hash: 'role_abc123',
        role_name: 'test_admin',
        role_display_name: 'Test Administrator',
        role_description: 'Test role description',
        role_priority: 100,
        is_system_role: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await globalRolesService.createRole(mockRequest);

      expect(apiClient.post).toHaveBeenCalledWith('/roles/roles', mockRequest);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when creating a role', async () => {
      const mockRequest: CreateGlobalRoleRequest = {
        role_name: 'test_admin',
        role_display_name: 'Test Administrator',
      };

      vi.mocked(apiClient.post).mockRejectedValue(
        new Error('Failed to create role')
      );

      await expect(globalRolesService.createRole(mockRequest)).rejects.toThrow(
        'Failed to create role'
      );
    });
  });

  describe('getRoles', () => {
    it('should fetch all roles successfully', async () => {
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

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRoles,
      });

      const result = await globalRolesService.getRoles();

      expect(apiClient.get).toHaveBeenCalledWith('/roles/roles', {});
      expect(result.data).toEqual(mockRoles);
    });

    it('should handle pagination params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [],
      });

      await globalRolesService.getRoles({ limit: 10, offset: 20 });

      expect(apiClient.get).toHaveBeenCalledWith('/roles/roles', {
        limit: 10,
        offset: 20,
      });
    });

    it('should filter out undefined params', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [],
      });

      await globalRolesService.getRoles({ limit: 10, offset: undefined });

      expect(apiClient.get).toHaveBeenCalledWith('/roles/roles', { limit: 10 });
    });
  });

  describe('getRole', () => {
    it('should fetch a specific role by hash', async () => {
      const mockRole: GlobalRole = {
        id: 1,
        role_hash: 'role_abc123',
        role_name: 'admin',
        role_display_name: 'Administrator',
        role_priority: 100,
        is_system_role: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRole,
      });

      const result = await globalRolesService.getRole('role_abc123');

      expect(apiClient.get).toHaveBeenCalledWith('/roles/roles/role_abc123');
      expect(result.data).toEqual(mockRole);
    });
  });

  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      const updateData: UpdateGlobalRoleRequest = {
        role_display_name: 'Updated Admin',
        role_description: 'Updated description',
        role_priority: 150,
      };

      const mockResponse: GlobalRole = {
        id: 1,
        role_hash: 'role_abc123',
        role_name: 'admin',
        role_display_name: 'Updated Admin',
        role_description: 'Updated description',
        role_priority: 150,
        is_system_role: false,
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await globalRolesService.updateRole('role_abc123', updateData);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/roles/roles/role_abc123',
        updateData
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await globalRolesService.deleteRole('role_abc123');

      expect(apiClient.delete).toHaveBeenCalledWith('/roles/roles/role_abc123');
      expect(result.success).toBe(true);
    });

    it('should handle errors when deleting a role', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(
        new Error('Role has assigned users')
      );

      await expect(globalRolesService.deleteRole('role_abc123')).rejects.toThrow(
        'Role has assigned users'
      );
    });
  });

  // ============================================
  // PERMISSION GROUP MANAGEMENT TESTS
  // ============================================

  describe('createPermissionGroup', () => {
    it('should create a permission group successfully', async () => {
      const mockResponse: GlobalPermissionGroup = {
        id: 1,
        group_hash: 'pg_abc123',
        group_name: 'user_management',
        group_display_name: 'User Management',
        group_description: 'Permissions for managing users',
        group_category: 'admin',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await globalRolesService.createPermissionGroup({
        group_name: 'user_management',
        group_display_name: 'User Management',
        group_description: 'Permissions for managing users',
        group_category: 'admin',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/permission-groups',
        expect.objectContaining({ group_name: 'user_management' })
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getPermissionGroups', () => {
    it('should fetch all permission groups', async () => {
      const mockGroups: GlobalPermissionGroup[] = [
        {
          id: 1,
          group_hash: 'pg_abc123',
          group_name: 'user_management',
          group_display_name: 'User Management',
          group_category: 'admin',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockGroups,
      });

      const result = await globalRolesService.getPermissionGroups();

      expect(apiClient.get).toHaveBeenCalledWith('/roles/permission-groups', {});
      expect(result.data).toEqual(mockGroups);
    });

    it('should filter by category', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: [],
      });

      await globalRolesService.getPermissionGroups({ category: 'admin' });

      expect(apiClient.get).toHaveBeenCalledWith('/roles/permission-groups', {
        category: 'admin',
      });
    });
  });

  describe('getPermissionGroup', () => {
    it('should fetch a specific permission group', async () => {
      const mockGroup: GlobalPermissionGroup = {
        id: 1,
        group_hash: 'pg_abc123',
        group_name: 'user_management',
        group_display_name: 'User Management',
        group_category: 'admin',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockGroup,
      });

      const result = await globalRolesService.getPermissionGroup('pg_abc123');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/roles/permission-groups/pg_abc123'
      );
      expect(result.data).toEqual(mockGroup);
    });
  });

  // ============================================
  // ROLE-PERMISSION GROUP ASSIGNMENTS TESTS
  // ============================================

  describe('assignPermissionGroupToRole', () => {
    it('should assign a permission group to a role', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await globalRolesService.assignPermissionGroupToRole(
        'role_abc123',
        'pg_def456'
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/roles/role_abc123/permission-groups/pg_def456'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getRolePermissionGroups', () => {
    it('should fetch permission groups for a role', async () => {
      const mockGroups: GlobalPermissionGroup[] = [
        {
          id: 1,
          group_hash: 'pg_abc123',
          group_name: 'user_management',
          group_display_name: 'User Management',
          group_category: 'admin',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockGroups,
      });

      const result = await globalRolesService.getRolePermissionGroups('role_abc123');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/roles/roles/role_abc123/permission-groups'
      );
      expect(result.data).toEqual(mockGroups);
    });
  });

  // ============================================
  // PERMISSION MANAGEMENT TESTS
  // ============================================

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      const mockPermission: GlobalPermission = {
        id: 1,
        permission_hash: 'perm_abc123',
        permission_name: 'users.create',
        permission_display_name: 'Create Users',
        permission_description: 'Ability to create new users',
        permission_category: 'user_management',
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockPermission,
      });

      const result = await globalRolesService.createPermission({
        permission_name: 'users.create',
        permission_display_name: 'Create Users',
        permission_description: 'Ability to create new users',
        permission_category: 'user_management',
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/permissions',
        expect.objectContaining({ permission_name: 'users.create' })
      );
      expect(result.data).toEqual(mockPermission);
    });
  });

  describe('getPermissions', () => {
    it('should fetch all permissions', async () => {
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

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockPermissions,
      });

      const result = await globalRolesService.getPermissions();

      expect(apiClient.get).toHaveBeenCalledWith('/roles/permissions', {});
      expect(result.data).toEqual(mockPermissions);
    });
  });

  describe('assignPermissionToGroup', () => {
    it('should assign a permission to a group', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await globalRolesService.assignPermissionToGroup(
        'pg_abc123',
        'perm_def456'
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/permission-groups/pg_abc123/permissions/perm_def456'
      );
      expect(result.success).toBe(true);
    });
  });

  describe('getGroupPermissions', () => {
    it('should fetch permissions in a group', async () => {
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

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockPermissions,
      });

      const result = await globalRolesService.getGroupPermissions('pg_abc123');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/roles/permission-groups/pg_abc123/permissions'
      );
      expect(result.data).toEqual(mockPermissions);
    });
  });

  // ============================================
  // USER ROLE ASSIGNMENTS TESTS
  // ============================================

  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      const mockAssignment = {
        user_hash: 'user_abc123',
        username: 'testuser',
        role_hash: 'role_def456',
        role_name: 'admin',
        assigned_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.put).mockResolvedValue({
        success: true,
        data: mockAssignment,
      });

      const result = await globalRolesService.assignRoleToUser(
        'user_abc123',
        'role_def456'
      );

      expect(apiClient.put).toHaveBeenCalledWith(
        '/roles/users/user_abc123/role',
        { role_hash: 'role_def456' }
      );
      expect(result.data).toEqual(mockAssignment);
    });
  });

  describe('getUserRole', () => {
    it('should fetch a user\'s role', async () => {
      const mockRole: GlobalRole = {
        id: 1,
        role_hash: 'role_abc123',
        role_name: 'admin',
        role_display_name: 'Administrator',
        role_priority: 100,
        is_system_role: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRole,
      });

      const result = await globalRolesService.getUserRole('user_abc123');

      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/user_abc123/role');
      expect(result.data).toEqual(mockRole);
    });
  });

  describe('getMyRole', () => {
    it('should fetch current user\'s role', async () => {
      const mockRole: GlobalRole = {
        id: 1,
        role_hash: 'role_abc123',
        role_name: 'admin',
        role_display_name: 'Administrator',
        role_priority: 100,
        is_system_role: true,
        created_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRole,
      });

      const result = await globalRolesService.getMyRole();

      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/me/role');
      expect(result.data).toEqual(mockRole);
    });
  });

  // ============================================
  // PERMISSION CHECKING TESTS
  // ============================================

  describe('getMyPermissions', () => {
    it('should fetch current user\'s permissions', async () => {
      const mockPermissions = ['users.create', 'users.read', 'projects.create'];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockPermissions,
      });

      const result = await globalRolesService.getMyPermissions();

      expect(apiClient.get).toHaveBeenCalledWith('/roles/users/me/permissions');
      expect(result.data).toEqual(mockPermissions);
    });
  });

  describe('checkPermission', () => {
    it('should check if user has a specific permission', async () => {
      const mockResponse = {
        has_permission: true,
        permission: 'users.create',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await globalRolesService.checkPermission('users.create');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/roles/users/me/permissions/check/users.create'
      );
      expect(result.data).toEqual(mockResponse);
    });

    it('should return false for permission check', async () => {
      const mockResponse = {
        has_permission: false,
        permission: 'admin.delete',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await globalRolesService.checkPermission('admin.delete');

      expect(result.data?.has_permission).toBe(false);
    });
  });

  // ============================================
  // PROJECT CATALOG TESTS
  // ============================================

  describe('addRoleToProjectCatalog', () => {
    it('should add a role to project catalog', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await globalRolesService.addRoleToProjectCatalog(
        'proj_abc123',
        'role_def456',
        { catalog_purpose: 'Standard role for this project type', notes: 'Test notes' }
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/projects/proj_abc123/catalog/roles/role_def456',
        { catalog_purpose: 'Standard role for this project type', notes: 'Test notes' }
      );
      expect(result.success).toBe(true);
    });

    it('should add a role to project catalog without metadata', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: undefined,
      });

      await globalRolesService.addRoleToProjectCatalog(
        'proj_abc123',
        'role_def456'
      );

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/projects/proj_abc123/catalog/roles/role_def456',
        {}
      );
    });
  });

  describe('getProjectCatalogRoles', () => {
    it('should fetch cataloged roles for a project', async () => {
      const mockRoles: GlobalRole[] = [
        {
          id: 1,
          role_hash: 'role_abc123',
          role_name: 'project_admin',
          role_display_name: 'Project Administrator',
          role_priority: 100,
          is_system_role: false,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockRoles,
      });

      const result = await globalRolesService.getProjectCatalogRoles('proj_abc123');

      expect(apiClient.get).toHaveBeenCalledWith(
        '/roles/projects/proj_abc123/catalog/roles'
      );
      expect(result.data).toEqual(mockRoles);
    });
  });
});




