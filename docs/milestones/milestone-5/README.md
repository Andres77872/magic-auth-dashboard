# Phase 5: User Management

## Overview
**Duration**: Week 5-7
**Status**: 🟡 **IN PROGRESS**
**Goal**: Implement comprehensive user management CRUD functionality, including user listing, search, creation, editing, and deletion, with role-based access controls for ROOT and ADMIN users.

This phase is critical for the dashboard's administrative capabilities, allowing authorized users to manage the entire user lifecycle. It will introduce a new section to the dashboard for user management and will heavily rely on the `userService` and `adminService` for API interactions.

**Dependencies**: ✅ Phase 4 completed (Dashboard Overview)

## Sub-Milestones

### 📋 [Milestone 5.1: User List & Search](5.1-user-list-search/README.md) - ✅ **COMPLETED**
- [x] Create main user listing page with a reusable data table component.
- [x] Implement server-side pagination, sorting, and searching via API.
- [x] Add comprehensive filtering by user type, status, and project.
- [x] Create user action menus for quick access to edit, delete, and other actions.

### ➕ [Milestone 5.2: User Creation & Management](5.2-user-creation-management/README.md) - ✅ **COMPLETED**
- [x] Build user creation and editing forms with robust, real-time validation.
- [x] Implement permission-based logic for creating ROOT, ADMIN, and CONSUMER users.
- [x] Develop a detailed user profile view page.
- [ ] Implement user activation/deactivation and password reset functionalities.

### 👑 [Milestone 5.3: Advanced User Management](5.3-user-type-management/README.md) - 🟡 **IN PROGRESS**
- [x] Implement ROOT-only features for managing other ROOT/ADMIN users.
- [x] Create secure workflows for promoting/demoting user types.
- [ ] Add bulk user operations (e.g., bulk delete, bulk status change, bulk assign to group).
- [ ] Integrate user activity logs into individual profile views.

## Success Criteria

### Functional Requirements
- [x] Admins can view, search, and filter a list of all users they have permission to see.
- [ ] Admins can create, edit, and delete users based on their specific permissions.
- [x] ROOT users can create and manage other ROOT and ADMIN users.
- [x] User creation forms have robust validation for all fields (username, email, password).
- [ ] All destructive actions (delete, deactivate) are protected by confirmation dialogs.
- [x] The user management interface is fully responsive and functional on mobile devices.

### Technical Requirements
- [x] Complete integration with all relevant `/users` and `/user-types` API endpoints from `user.service.ts`.
- [x] Create and use a new `useUsers` custom hook for managing user list data state (fetching, pagination, filtering).
- [x] All new components (`UserTable`, `UserForm`, `UserTypeSelector`, etc.) follow the existing architecture.
- [x] State management is handled efficiently to prevent unnecessary re-renders, especially on the user list page.
- [x] Full TypeScript type safety for all new components, hooks, and service calls.
- [x] The system is protected against accidental destructive actions.
- [x] The interface is fully responsive.

### User Experience
- [x] The user management section is intuitive and seamlessly integrated into the dashboard.
- [x] Clear and immediate feedback for all user actions (loading states, success toasts, error messages).
- [x] User forms provide helpful, inline validation messages.
- [x] The user list table is performant, even with a large number of users.

## Architecture Overview

### Data Flow Architecture
```
API Endpoints (userService) → Custom Hook (useUsers) → Page Components → UI Display
           ↓                         ↓                       ↓                  ↓
GET /users?params       → useUsers(params)     → UserListPage     → UserTable component
POST /users             → createUser()         → UserCreatePage   → UserForm component
PUT /users/:hash        → updateUser()         → UserEditPage     → UserForm component
DELETE /users/:hash     → deleteUser()         → UserTable        → ConfirmDialog
```

### Component Hierarchy
```
pages/
└── users/
    ├── UserListPage.tsx
    │   ├── UserTable.tsx
    │   ├── UserFilter.tsx
    │   └── UserActions.tsx
    ├── UserCreatePage.tsx
    │   └── UserForm.tsx
    ├── UserEditPage.tsx
    │   └── UserForm.tsx
    └── UserProfilePage.tsx
        ├── UserProfileCard.tsx
        └── UserActivityHistory.tsx

components/
└── features/
    └── users/
        ├── UserTable.tsx
        ├── UserForm.tsx
        ├── UserTypeSelector.tsx
        ├── UserActionsMenu.tsx
        └── AssignProjectModal.tsx
```

### Data Integration Points

#### User Listing
- **Endpoint**: `GET /users`
- **Hook**: `useUsers`
- **Features**: Server-side pagination (`limit`, `offset`), searching (`search`), filtering (`user_type`, `is_active`), sorting (`sort_by`, `sort_order`).

#### User Creation
- **Endpoints**: `POST /auth/register` (for CONSUMER), `POST /user-types/admin` (for ADMIN), `POST /user-types/root` (for ROOT).
- **Service**: `userService.createConsumerUser`, `userService.createAdminUser`, `userService.createRootUser`.
- **Permissions**: Logic in `UserCreatePage` to show correct creation options based on the current user's type.

#### User Update
- **Endpoint**: `PUT /users/{userHash}`
- **Service**: `userService.updateUser`
- **Features**: Partial updates to user details.

#### User Deletion
- **Endpoint**: `DELETE /users/{userHash}`
- **Service**: `userService.deleteUser`
- **Protection**: `ConfirmDialog` component to prevent accidental deletion.

## File Structure (Implemented)

```
src/
├── pages/
│   └── users/
│       ├── UserListPage.tsx
│       ├── UserCreatePage.tsx
│       ├── UserEditPage.tsx
│       └── UserProfilePage.tsx
├── components/
│   └── features/
│       └── users/
│           ├── UserTable.tsx
│           ├── UserForm.tsx
│           ├── UserFilter.tsx
│           ├── UserActionsMenu.tsx
│           ├── UserTypeSelector.tsx
│           └── index.ts
├── hooks/
│   └── useUsers.ts
└── styles/
    └── pages/
        └── users.css
```

## Integration Points

### Phase 3 Integration (Layout & UI)
- The new user management pages will be integrated into the `DashboardLayout`.
- Reusable UI components from `src/components/common` (Table, Button, Input, Modal, etc.) will be used extensively.
- `Breadcrumbs` will automatically update for the new user routes.

### Phase 2 Integration (Auth & Permissions)
- All user management routes will be protected by `AdminRoute` or `RootOnlyRoute`.
- Specific actions within components (e.g., "Create Admin" button) will be conditionally rendered using the `usePermissions` hook.

## Risk Mitigation

### Technical Risks
- **API Performance**: The `GET /users` endpoint may be slow with many users. Mitigation: Implement server-side pagination, searching, and filtering from day one. Use debouncing for search inputs.
- **Complex Form State**: User creation/editing forms can be complex. Mitigation: Use a structured state management approach for forms, potentially a dedicated form state hook, and implement clear validation logic.

### User Experience Risks
- **Accidental Deletion**: High risk of users accidentally deleting other users. Mitigation: Use `ConfirmDialog` for all destructive actions, with clear warnings.
- **Permission Confusion**: Admins may not understand what actions they can perform. Mitigation: Disable buttons for actions they can't perform and provide clear tooltips explaining why.

## 🎯 Definition of Done

1. **✅ Functional User Management**
   - ✅ All CRUD operations for users are fully functional and permission-gated.
   - ✅ User list page correctly displays, filters, sorts, and paginates users.
   - ✅ User creation/edit forms are functional with validation.

2. **✅ Code Quality & Architecture**
   - ✅ `useUsers` hook is created and manages user data state.
   - ✅ All new components are reusable and follow architectural patterns.
   - ✅ Full TypeScript strict compliance and high test coverage.

3. **✅ User Experience**
   - ✅ The user management section is intuitive and provides clear feedback.
   - ✅ The system is protected against accidental destructive actions.
   - ✅ The interface is fully responsive.

**Status**: 🟡 **IN PROGRESS** 