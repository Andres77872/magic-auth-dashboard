# Phase 7: Group Management

## Overview
**Duration**: Week 7-8 (10 working days)
**Status**: 🟡 **IN PROGRESS**
**Goal**: Implement comprehensive group management functionality, enabling admins to create, manage, and organize users into groups with permission-based access control.

This phase is essential for providing administrators with advanced user organization tools, from basic user grouping to complex permission inheritance and bulk operations.

**Dependencies**: ✅ Phase 6 completed (Project Management), Phase 5 completed (User Management)

## Sub-Milestones

### 📋 [Milestone 7.1: User Groups Interface](7.1-user-groups-interface/README.md)
**Duration**: Day 1-5 (5 days)
**Focus**: Foundation group management interface
- [x] Create main group listing page with both grid (card) and list (table) views.
- [x] Implement server-side pagination, sorting, and searching for groups.
- [x] Develop a "Create Group" page with a reusable form component.
- [x] Add group member management: add, remove, and bulk assign members.
- [x] Build comprehensive group details page with multiple tabs.

### ➕ [Milestone 7.2: Group-Based Permissions & Project Groups](7.2-permissions-project-groups/README.md)
**Duration**: Day 6-10 (5 days)
**Focus**: Advanced group functionality and RBAC integration
- [x] Implement project groups (permission-based groups for projects).
- [ ] Add group permission management and inheritance.
- [ ] Create bulk operations for member and permission management.
- [ ] Integrate groups with existing RBAC system.
- [ ] Add import/export functionality for group data.

## Success Criteria

### Functional Requirements
- [x] Admins can view, search, and filter a list of all groups they have permission to see.
- [x] Admins can create new user groups with name and description.
- [x] Admins can edit existing group details and manage members.
- [x] Admins can delete groups with appropriate confirmation dialogs.
- [x] Admins can add and remove members from groups with bulk operations.
- [ ] Groups can be assigned to projects and inherit permissions.
- [x] The group management interface is fully responsive and intuitive.

### Technical Requirements
- [x] Complete integration with all relevant `/admin/user-groups` and `/admin/project-groups` API endpoints.
- [x] Create and use new `useGroups` and `useProjectGroups` custom hooks for data management.
- [x] All new components follow the existing architecture patterns from user/project management.
- [x] Use reusable components from `/common` extensively.
- [x] Full TypeScript type safety for all new components, hooks, and services.
- [x] All destructive actions are protected by `ConfirmDialog`.
- [x] Implement optimistic UI updates for better user experience.

### User Experience
- [x] The group management section is intuitive and well-integrated with existing features.
- [x] Clear feedback for all actions (loading states, success toasts, error messages).
- [x] Forms provide helpful, inline validation and availability checking.
- [x] Group member management is efficient with search and filter capabilities.
- [ ] Permission inheritance is clearly visualized and easy to understand.

## Architecture Overview

### Data Flow Architecture
```
API Endpoints (groupService) → Custom Hooks (useGroups) → Page Components → UI Display
              ↓                        ↓                    ↓                ↓
GET /admin/user-groups        → useGroups()          → GroupListPage    → GroupTable/GroupCard
POST /admin/user-groups       → createGroup()        → GroupCreatePage  → GroupForm
PUT /admin/user-groups/:hash  → updateGroup()        → GroupEditPage    → GroupForm
DELETE /admin/user-groups/:hash → deleteGroup()     → GroupListPage    → ConfirmDialog
GET /admin/user-groups/:hash/members → getGroupMembers() → GroupDetailsPage → GroupMembersTab
POST /admin/user-groups/:hash/members → addGroupMember() → GroupDetailsPage → AddMemberModal
GET /admin/project-groups     → useProjectGroups()  → ProjectGroupsPage → ProjectGroupTable
```

### Component Hierarchy
```
pages/
└── groups/
    ├── GroupListPage.tsx
    │   ├── GroupTable.tsx
    │   └── GroupCard.tsx
    ├── GroupCreatePage.tsx
    │   └── GroupForm.tsx
    ├── GroupEditPage.tsx
    │   └── GroupForm.tsx
    ├── GroupDetailsPage.tsx
    │   ├── GroupOverviewTab.tsx
    │   ├── GroupMembersTab.tsx
    │   └── GroupPermissionsTab.tsx
    └── ProjectGroupsPage.tsx
        ├── ProjectGroupTable.tsx
        └── ProjectGroupForm.tsx

components/
└── features/
    └── groups/
        ├── GroupTable.tsx
        ├── GroupCard.tsx
        ├── GroupForm.tsx
        ├── GroupStatusBadge.tsx
        ├── GroupActionsMenu.tsx
        ├── AddMemberModal.tsx
        ├── BulkMemberActions.tsx
        ├── GroupPermissionMatrix.tsx
        ├── ProjectGroupTable.tsx
        └── ProjectGroupForm.tsx
```

### Data Integration Points

#### User Group Management
- **Listing Endpoint**: `GET /admin/user-groups`
- **Hook**: `useGroups`
- **Features**: Server-side pagination (`limit`, `offset`), searching (`search`), sorting.

#### User Group Creation
- **Endpoint**: `POST /admin/user-groups`
- **Service**: `groupService.createGroup`
- **Permissions**: `AdminRoute` protection.

#### User Group Update
- **Endpoint**: `PUT /admin/user-groups/{group_hash}`
- **Service**: `groupService.updateGroup`
- **Features**: Partial updates to group details.

#### User Group Deletion
- **Endpoint**: `DELETE /admin/user-groups/{group_hash}`
- **Service**: `groupService.deleteGroup`
- **Protection**: `ConfirmDialog` component with member impact warning.

#### Member Management
- **Endpoints**: 
  - `GET /admin/user-groups/{group_hash}/members`
  - `POST /admin/user-groups/{group_hash}/members`
  - `DELETE /admin/user-groups/{group_hash}/members/{user_hash}`
- **Services**: `groupService.getGroupMembers`, `groupService.addMemberToGroup`, `groupService.removeMemberFromGroup`

#### Project Group Management
- **Endpoints**: 
  - `GET /admin/project-groups`
  - `POST /admin/project-groups`
  - `PUT /admin/project-groups/{group_hash}`
  - `DELETE /admin/project-groups/{group_hash}`
- **Services**: `groupService.getProjectGroups`, `groupService.createProjectGroup`, etc.

#### Project Assignment
- **Endpoints**: 
  - `POST /admin/user-groups/{group_hash}/projects`
  - `DELETE /admin/user-groups/{group_hash}/projects/{project_hash}`
- **Services**: `groupService.assignGroupToProject`, `groupService.removeGroupFromProject`

## Implementation Timeline

### Week 1: Days 1-5 (Milestone 7.1)
**Day 1**: Route setup, basic pages, and navigation integration
**Day 2**: `useGroups` hook and API service integration
**Day 3**: Group listing (table/grid views) with search and pagination
**Day 4**: Group creation/editing forms and validation
**Day 5**: Group details page with member management

### Week 2: Days 6-10 (Milestone 7.2)
**Day 6**: Project groups interface and project assignment
**Day 7**: Permission inheritance system and visualization
**Day 8**: Bulk operations and CSV import/export
**Day 9**: RBAC integration and advanced features
**Day 10**: Testing, polish, and documentation updates

## File Structure (Implementation Plan)

```
src/
├── pages/
│   └── groups/
│       ├── GroupListPage.tsx              # Main group listing with view toggle
│       ├── GroupCreatePage.tsx            # Group creation form page
│       ├── GroupEditPage.tsx              # Group editing form page
│       ├── GroupDetailsPage.tsx           # Detailed group view with tabs
│       ├── ProjectGroupsPage.tsx          # Project groups management
│       ├── GroupListPage.css              # Styling for group list
│       ├── GroupCreatePage.css            # Styling for group creation
│       ├── GroupDetailsPage.css           # Styling for group details
│       └── ProjectGroupsPage.css          # Styling for project groups
├── components/
│   └── features/
│       └── groups/
│           ├── GroupTable.tsx             # Sortable group data table
│           ├── GroupCard.tsx              # Group overview cards
│           ├── GroupForm.tsx              # Reusable create/edit form
│           ├── GroupActionsMenu.tsx       # Permission-based actions
│           ├── GroupFilter.tsx            # Search and filtering
│           ├── GroupMembersTab.tsx        # Member management interface
│           ├── GroupOverviewTab.tsx       # Basic group information
│           ├── GroupPermissionsTab.tsx    # Permission inheritance view
│           ├── AddMemberModal.tsx         # Modal for adding members
│           ├── BulkMemberActions.tsx      # Bulk member operations
│           ├── ProjectGroupTable.tsx      # Project group table
│           ├── ProjectGroupForm.tsx       # Project group form
│           └── index.ts                   # Component exports
├── hooks/
│   ├── useGroups.ts                       # User group state management
│   ├── useProjectGroups.ts                # Project group state management
│   └── useGroupMembers.ts                 # Group member management
├── services/
│   ├── group.service.ts                   # ✅ EXISTING: Group CRUD operations
│   └── project-group.service.ts           # 🆕 NEW: Project group operations
├── utils/
│   ├── group-permissions.ts               # Permission calculation utilities
│   ├── bulk-operations.ts                 # Bulk operation helpers
│   └── group-validation.ts                # Group-specific validation
└── styles/
    └── pages/
        └── groups.css                     # Shared group styling
```

## Integration Points

### Phase 3 Integration (Layout & UI)
- The new group management pages will use the `DashboardLayout`.
- Reusable UI components (`Table`, `Card`, `Button`, `Input`, `Modal`) will be used.
- `Breadcrumbs` will be automatically generated for group routes.
- Navigation menu will include "Groups" item with proper permission filtering.

### Phase 5 Integration (User Management)
- User data will be needed for the `AddMemberModal` component to search and select users.
- Group membership will be displayed in user profile pages.
- Bulk user operations will include group assignment options.
- User permission calculations will include group-inherited permissions.

### Phase 6 Integration (Project Management)
- Project groups will be available for assignment to projects.
- Project details pages will show associated groups.
- Group-based project access will be clearly indicated.
- Project member lists will show group-based access indicators.

### Phase 8 Integration (RBAC)
- Group permission inheritance will be a key feature integrated with the RBAC system.
- Permission matrices will show group-based permissions.
- Role assignments can be made at the group level.
- Permission conflict resolution will handle group inheritance.

## API Endpoints Summary

### ✅ **Available Endpoints** (Ready for Implementation)
```typescript
// Basic group operations
GET /admin/user-groups                    // ✅ List groups
POST /admin/user-groups                   // ✅ Create group
POST /admin/user-groups/{hash}/members    // ✅ Add member
```

### 🔄 **Required Endpoints** (Need Backend Implementation)
```typescript
// Extended group operations
GET /admin/user-groups/{group_hash}       // Group details
PUT /admin/user-groups/{group_hash}       // Update group
DELETE /admin/user-groups/{group_hash}    // Delete group
GET /admin/user-groups/{hash}/members     // List members
DELETE /admin/user-groups/{hash}/members/{user_hash} // Remove member

// Project groups
GET /admin/project-groups                 // List project groups
POST /admin/project-groups                // Create project group
PUT /admin/project-groups/{hash}          // Update project group
DELETE /admin/project-groups/{hash}       // Delete project group

// Advanced operations
POST /admin/user-groups/{hash}/members/bulk      // Bulk member operations
POST /admin/user-groups/{hash}/projects          // Assign to project
DELETE /admin/user-groups/{hash}/projects/{hash} // Remove from project
```

## Risk Mitigation

### Technical Risks
- **Complex Permission Inheritance**: Groups with multiple permission sources can create complexity. 
  - *Mitigation*: Clear visual indicators and detailed permission breakdown views.
- **Performance with Large Groups**: Groups with many members may impact performance. 
  - *Mitigation*: Implement virtual scrolling and efficient pagination.
- **Data Consistency**: Multiple group types (user groups vs project groups) may cause confusion. 
  - *Mitigation*: Clear separation in UI and distinct workflows.

### User Experience Risks
- **Accidental Member Removal**: Removing users from groups can impact their access. 
  - *Mitigation*: Clear warnings about access impact and confirmation dialogs.
- **Permission Confusion**: Complex group hierarchies can be confusing. 
  - *Mitigation*: Visual permission inheritance trees and clear explanatory text.
- **Bulk Operation Errors**: Mass operations can have unintended consequences. 
  - *Mitigation*: Preview changes before execution and detailed operation logs.

### Implementation Risks
- **API Dependencies**: Some endpoints may not be implemented in the backend.
  - *Mitigation*: Implement mock services for development and create comprehensive API documentation.
- **Complex State Management**: Group and member state can become complex.
  - *Mitigation*: Use proven patterns from existing user/project management.
- **Performance Issues**: Large datasets may cause performance problems.
  - *Mitigation*: Implement pagination, virtual scrolling, and efficient caching.

## 🎯 Definition of Done

### 1. **✅ Functional Group Management**
   - [x] All CRUD operations for user groups are functional and permission-gated.
   - [x] Group list page correctly displays, filters, sorts, and paginates groups.
   - [x] Group creation/edit forms are functional with validation.
   - [x] Member management (add/remove/bulk operations) is functional.
   - [x] Project group management is complete and integrated.

### 2. **✅ Code Quality & Architecture**
   - [x] `useGroups` and `useProjectGroups` hooks are created and manage state effectively.
   - [x] All new components are reusable and follow architectural patterns.
   - [x] Full TypeScript strict compliance with comprehensive type coverage.
   - [x] Error handling is consistent and user-friendly.
   - [x] All components have proper loading states and error boundaries.

### 3. **✅ User Experience**
   - [x] The group management section is intuitive and provides clear feedback.
   - [x] The system is protected against accidental destructive actions.
   - [ ] Permission inheritance is clearly visualized and understandable.
   - [x] The interface is fully responsive and accessible.
   - [x] Integration with existing user and project management is seamless.

### 4. **✅ Testing & Documentation**
   - [ ] All major components have unit tests with good coverage.
   - [ ] Integration tests cover critical user flows.
   - [ ] API integration is thoroughly tested with mock data.
   - [ ] Documentation is updated with new features and usage examples.
   - [ ] Performance benchmarks meet established criteria.

## Technical Implementation Notes

### State Management Strategy
```typescript
// Group-specific hooks
useGroups()         // User group management state
useProjectGroups()  // Project group management state
useGroupMembers()   // Group member management with pagination

// Integration with existing hooks
useUsers()          // For member selection and management
useProjects()       // For project assignment
usePermissions()    // For permission checking and inheritance
```

### API Integration Pattern
```typescript
// Service layer structure
services/
├── group.service.ts          // ✅ EXISTING: User group CRUD operations
├── project-group.service.ts  // 🆕 NEW: Project group operations
└── bulk-operations.service.ts // 🆕 NEW: Bulk member/permission operations

// New utility functions
utils/
├── group-permissions.ts      // Group permission calculation utilities
├── bulk-operations.ts        // Bulk operation helpers
└── group-validation.ts       // Group-specific validation rules
```

### Component Architecture
```typescript
// Component organization following established patterns
components/
├── features/
│   └── groups/
│       ├── GroupTable.tsx         // 🆕 Sortable group data table
│       ├── GroupCard.tsx          // 🆕 Group overview cards
│       ├── GroupForm.tsx          // 🆕 Create/edit group form
│       ├── GroupMembersTab.tsx    // 🆕 Member management interface
│       ├── GroupPermissionsTab.tsx // 🆕 Permission inheritance view
│       ├── BulkMemberActions.tsx  // 🆕 Bulk member operations
│       └── ProjectGroupTable.tsx  // 🆕 Project group management

// Permission utilities
utils/
├── group-permissions.ts      // 🆕 Group permission calculations
└── permission-inheritance.ts // 🆕 Permission inheritance logic
```

### Performance Considerations
- **Virtual Scrolling**: For groups with large member lists
- **Optimistic Updates**: For better perceived performance
- **Debounced Search**: To reduce API calls during member search
- **Cached Group Data**: To avoid repeated API calls
- **Batch Operations**: For efficient bulk member management

### Security Considerations
- Permission-based access control for all group operations
- Audit logging for group membership changes
- Input validation and sanitization for group data
- Rate limiting for bulk operations
- Clear permission inheritance visualization to prevent privilege escalation

---

**Implementation Status**: 🟡 **IN PROGRESS**
**Next Steps**: Complete Milestone 7.2 - Group-Based Permissions & Project Groups
**Estimated Completion**: 5 days remaining

This development plan provides a comprehensive roadmap for implementing group management functionality while maintaining consistency with existing patterns and ensuring a high-quality user experience. 