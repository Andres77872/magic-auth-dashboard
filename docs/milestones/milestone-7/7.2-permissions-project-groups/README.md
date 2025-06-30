# Milestone 7.2: Group-Based Permissions & Project Groups

## Overview
**Duration**: Day 6-10
**Status**: 🟢 **READY TO PROCEED**
**Goal**: Implement advanced group functionality including project groups, permission inheritance, bulk operations, and integration with the RBAC system.

This milestone builds on the user group foundation by adding sophisticated permission management, project group functionality, and advanced bulk operations for efficient group administration.

**Dependencies**: ✅ Milestone 7.1 completed (User Groups Interface)

## 📋 Tasks Checklist

### Step 1: Project Groups Interface
- [ ] Create `ProjectGroupsPage.tsx` under `src/pages/groups/`.
- [ ] Add a route for `/dashboard/groups/project-groups` in `App.tsx`.
- [ ] Create `ProjectGroupTable.tsx` and `ProjectGroupForm.tsx` components.
- [ ] Implement `useProjectGroups.ts` hook for project group data management.

### Step 2: Group-Project Assignment
- [ ] Complete `GroupProjectsTab.tsx` in the group details page.
- [ ] Create `AssignProjectModal.tsx` for assigning groups to projects.
- [ ] Implement project assignment/removal functionality.
- [ ] Add visual indicators for group-based project access.

### Step 3: Permission Inheritance System
- [ ] Create `GroupPermissionsTab.tsx` for the group details page.
- [ ] Implement `GroupPermissionMatrix.tsx` component for visual permission display.
- [ ] Create `PermissionInheritanceTree.tsx` for hierarchical permission view.
- [ ] Add permission calculation utilities for group-based permissions.

### Step 4: Bulk Operations Enhancement
- [ ] Enhance `BulkMemberActions.tsx` with advanced operations.
- [ ] Create `BulkPermissionAssignment.tsx` for mass permission changes.
- [ ] Implement `GroupTemplateModal.tsx` for creating group templates.
- [ ] Add CSV import/export functionality for group data.

### Step 5: Advanced Group Features
- [ ] Implement group hierarchy support (if required by API).
- [ ] Add group cloning/duplication functionality.
- [ ] Create group analytics and reporting components.
- [ ] Implement group activity logging and audit trail.

### Step 6: RBAC Integration
- [ ] Integrate group permissions with existing RBAC system.
- [ ] Update user permission calculations to include group inheritance.
- [ ] Add group-based role assignments.
- [ ] Create comprehensive permission conflict resolution.

---

## 🔧 Detailed Implementation Steps

### Step 1: Project Groups Interface
- Create `src/pages/groups/ProjectGroupsPage.tsx` for managing permission-based project groups.
- Implement `src/hooks/useProjectGroups.ts` for state management.
- Create components for project group CRUD operations using existing patterns.
- Integrate with `/admin/project-groups` API endpoints.

### Step 2: Group-Project Assignment
- Complete the `GroupProjectsTab.tsx` started in Milestone 7.1.
- Use `projectService.getProjects` and `groupService.assignGroupToProject`.
- Create modal interface for bulk project assignments.
- Add visual feedback for assignment status and conflicts.

### Step 3: Permission Inheritance System
- Create `src/utils/group-permissions.ts` for permission calculation logic.
- Implement visual components to show effective permissions from group membership.
- Handle permission conflicts and provide resolution mechanisms.
- Integrate with existing RBAC permission checking system.

### Step 4: Bulk Operations Enhancement
- Extend existing bulk operations with more sophisticated features.
- Add batch processing with progress indicators and error handling.
- Implement CSV import/export using standard web APIs.
- Create template system for common group configurations.

### Step 5: Advanced Group Features
- Implement group analytics showing usage patterns and member engagement.
- Add group activity feeds showing recent changes and member activities.
- Create group comparison tools for administrators.
- Implement group archival and restoration functionality.

### Step 6: RBAC Integration
- Update permission checking throughout the application to consider group membership.
- Integrate group permissions with project access control.
- Create comprehensive permission audit tools.
- Implement permission preview functionality ("What access would this user have?").

---

## ✅ Completion Criteria
- [ ] Project groups interface is complete and functional.
- [ ] Group-project assignment system works with proper permission inheritance.
- [ ] Permission matrix clearly shows inherited and direct permissions.
- [ ] Bulk operations handle large datasets efficiently with proper error handling.
- [ ] CSV import/export functionality works for both user groups and project groups.
- [ ] Group templates can be created, saved, and applied to new groups.
- [ ] RBAC integration shows effective permissions including group inheritance.
- [ ] All group operations are properly audited and logged.

---

## 🎯 Technical Implementation Details

### API Endpoints Integration
```typescript
// Project Groups endpoints
GET /admin/project-groups                           // List project groups
POST /admin/project-groups                          // Create project group
GET /admin/project-groups/{group_hash}              // Get project group details
PUT /admin/project-groups/{group_hash}              // Update project group
DELETE /admin/project-groups/{group_hash}           // Delete project group

// Project Assignment endpoints
POST /admin/user-groups/{group_hash}/projects       // Assign group to project
DELETE /admin/user-groups/{group_hash}/projects/{project_hash} // Remove assignment
POST /admin/project-groups/{group_hash}/projects    // Assign project group to project
DELETE /admin/project-groups/{group_hash}/projects/{project_hash} // Remove assignment

// Bulk Operations endpoints
POST /admin/user-groups/bulk-assign                 // Bulk user assignments
POST /admin/user-groups/{group_hash}/members/bulk   // Bulk member operations
```

### Component Architecture
```typescript
// Project Groups Management
interface ProjectGroupsPageState {
  projectGroups: ProjectGroup[];
  selectedGroup: ProjectGroup | null;
  isCreating: boolean;
  filters: ProjectGroupFilters;
}

// Permission Management
interface GroupPermissionsTabProps {
  group: UserGroup;
  onPermissionChange: (permissions: Permission[]) => void;
}

// Bulk Operations
interface BulkOperationState {
  selectedItems: string[];
  operation: 'add' | 'remove' | 'assign' | 'export';
  progress: number;
  isProcessing: boolean;
  errors: BulkOperationError[];
}
```

### Permission Inheritance Logic
```typescript
// Permission calculation utilities
const calculateEffectivePermissions = (
  user: User,
  project: Project,
  groups: UserGroup[]
): EffectivePermissions => {
  // 1. Direct user permissions
  // 2. Group-inherited permissions
  // 3. Project group permissions
  // 4. Resolve conflicts (most permissive wins)
  // 5. Return final permission set
};

const checkPermissionConflicts = (
  permissions: Permission[]
): PermissionConflict[] => {
  // Identify conflicting permissions
  // Provide resolution suggestions
  // Return conflict details for UI display
};
```

### Data Flow for Complex Operations
```typescript
// Bulk member assignment with progress tracking
const useBulkMemberAssignment = () => {
  const [progress, setProgress] = useState<BulkProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    errors: []
  });

  const assignMembersToGroups = useCallback(async (
    userHashes: string[],
    groupHashes: string[]
  ) => {
    const total = userHashes.length * groupHashes.length;
    setProgress({ total, completed: 0, failed: 0, errors: [] });

    for (const userHash of userHashes) {
      for (const groupHash of groupHashes) {
        try {
          await groupService.addMemberToGroup(groupHash, userHash);
          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error) {
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, { userHash, groupHash, error }]
          }));
        }
      }
    }
  }, []);

  return { progress, assignMembersToGroups };
};
```

### CSV Import/Export Implementation
```typescript
// CSV export functionality
const exportGroupData = async (
  groups: UserGroup[],
  format: 'members' | 'permissions' | 'full'
): Promise<string> => {
  const csvData = groups.map(group => {
    switch (format) {
      case 'members':
        return {
          group_name: group.group_name,
          member_count: group.member_count,
          members: group.members?.map(m => m.username).join(';') || ''
        };
      case 'permissions':
        return {
          group_name: group.group_name,
          permissions: group.permissions?.map(p => p.permission_name).join(';') || ''
        };
      case 'full':
        return {
          group_name: group.group_name,
          description: group.description,
          member_count: group.member_count,
          created_at: group.created_at,
          members: group.members?.map(m => m.username).join(';') || '',
          permissions: group.permissions?.map(p => p.permission_name).join(';') || ''
        };
    }
  });
  
  return convertToCSV(csvData);
};

// CSV import with validation
const importGroupData = async (
  csvContent: string,
  options: ImportOptions
): Promise<ImportResult> => {
  const parsed = parseCSV(csvContent);
  const validated = validateGroupData(parsed);
  const conflicts = checkForConflicts(validated);
  
  if (conflicts.length > 0 && !options.resolveConflicts) {
    return { success: false, conflicts, imported: 0 };
  }
  
  const results = await Promise.allSettled(
    validated.map(group => groupService.createGroup(group))
  );
  
  return {
    success: true,
    imported: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    errors: results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason)
  };
};
```

---

## 🔗 Integration Points

### RBAC System Integration
- Update permission checking middleware to consider group membership
- Integrate group permissions with role-based access control
- Provide unified permission calculation for complex scenarios
- Add group-based permission caching for performance

### User Management Integration
- Add group membership information to user profiles
- Include group permissions in user permission summaries
- Update user creation/editing to include group assignments
- Add group-based user filtering and search capabilities

### Project Management Integration
- Display group-based access in project member lists
- Add group assignment options in project management
- Show inherited permissions in project permission matrices
- Include group information in project analytics

### Audit and Logging Integration
- Log all group permission changes
- Track bulk operation results and errors
- Maintain audit trail for group membership changes
- Integrate with existing system audit logging

---

## 🚨 Security Considerations

### Permission Escalation Prevention
- Validate that users cannot assign permissions they don't have
- Prevent circular permission inheritance
- Audit permission changes for unusual patterns
- Implement approval workflows for sensitive permission changes

### Data Protection
- Sanitize all bulk operation inputs
- Validate CSV imports thoroughly
- Rate limit bulk operations to prevent abuse
- Encrypt sensitive group data in transit and at rest

### Access Control
- Ensure group operations respect user permissions
- Implement proper authorization for bulk operations
- Validate project-group assignments against user access
- Log all administrative actions for compliance

---

## 📊 Performance Considerations

### Large Dataset Handling
- Implement virtual scrolling for large member lists
- Use pagination for group operations
- Optimize permission calculation algorithms
- Cache frequently accessed group data

### Bulk Operation Optimization
- Process operations in batches to prevent timeouts
- Provide progress feedback for long-running operations
- Implement operation queuing for concurrent requests
- Use worker threads for CPU-intensive operations

### Database Performance
- Optimize queries for group permission calculations
- Index group membership for fast lookups
- Use database-level bulk operations where possible
- Implement query result caching

---

This milestone completes the group management system with advanced features that integrate seamlessly with the existing user and project management systems while providing powerful tools for administrators to efficiently manage complex permission scenarios. 