// Export all services as named exports
export { apiClient } from './api.client';
export { authService } from './auth.service';
export { userService } from './user.service';
export { projectService } from './project.service';
export { groupService } from './group.service';
export { projectGroupService } from './project-group.service';
export { roleService } from './role.service';
export { permissionService } from './permission.service';
export { systemService } from './system.service';
export { adminService } from './admin.service';
export { analyticsService } from './analytics.service';
export { globalRolesService } from './global-roles.service';
export { permissionAssignmentsService } from './permission-assignments.service';
export { auditService } from './audit.service';

// Also export defaults for convenience
export { default as ApiClient } from './api.client';
export { default as AuthService } from './auth.service';
export { default as UserService } from './user.service';
export { default as ProjectService } from './project.service';
export { default as GroupService } from './group.service';
export { default as ProjectGroupService } from './project-group.service';
export { default as SystemService } from './system.service';
export { default as AdminService } from './admin.service';
export { default as GlobalRolesService } from './global-roles.service';
export { default as PermissionAssignmentsService } from './permission-assignments.service';
export { default as AuditService } from './audit.service'; 