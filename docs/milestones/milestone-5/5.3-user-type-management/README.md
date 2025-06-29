# Milestone 5.3: Advanced User Management

## Overview
**Duration**: Day 8-10
**Status**: ⏳ **TO DO**
**Goal**: Implement advanced, ROOT-specific user management features, including management of other administrators, user type transitions, and bulk operations.

This milestone provides top-level administrators with powerful tools for managing the user hierarchy and performing large-scale actions.

**Dependencies**: ✅ Milestone 5.2 completed (User Creation & Management)

## 📋 Tasks Checklist

### Step 1: ROOT User Management Features (ROOT only)
- [ ] On the `UserForm`, allow ROOT users to create other ROOT users.
- [ ] Implement an additional, strong confirmation step (e.g., re-entering password) before creating a ROOT user.
- [ ] Ensure a ROOT user cannot delete or deactivate their own account.
- [ ] Ensure a ROOT user cannot be demoted by another ROOT user through the UI.

### Step 2: User Type Management
- [ ] Add a "Change User Type" action to the `UserActionsMenu`, visible only to ROOT users.
- [ ] This action should open a modal to select the new `UserType`.
- [ ] Implement the `userService.changeUserType` API call.
- [ ] Handle UI updates and edge cases (e.g., what happens when an ADMIN is demoted to CONSUMER).

### Step 3: Admin Project Assignments
- [ ] In the `UserForm` (in edit mode for an ADMIN user), add a feature to manage their assigned projects.
- [ ] This could be a button that opens an `AssignProjectModal`.
- [ ] The modal would list all projects, with checkboxes for assigning/unassigning.
- [ ] This functionality will require new service methods and API endpoints (if they don't exist).

### Step 4: Bulk User Operations
- [ ] Add checkboxes to the `UserTable` to allow multi-selecting users.
- [ ] When users are selected, show a "Bulk Actions" button.
- [ ] Implement bulk actions:
    - **Bulk Delete**: Deletes all selected users after a single confirmation.
    - **Bulk Deactivate/Activate**: Toggles the status for all selected users.
    - **Bulk Assign to Group**: Opens a modal to select a group to add all selected users to.
- [ ] Use `Promise.all` or a dedicated bulk API endpoint to handle the operations efficiently.

---

## 🔧 Detailed Implementation Steps

### Step 1 & 2: ROOT features & User Type Changes
- The `UserForm` and `UserActionsMenu` will have extensive conditional logic based on `usePermissions` and `useUserType` hooks.
- The "Change User Type" modal should clearly explain the consequences of the change.

### Step 3: Project Assignments for Admins
- This requires a new component `AssignProjectModal`. It will fetch a list of all projects and display them.
- It will need an API endpoint to update an admin's project assignments. This might be part of `userService.updateUser` or a separate endpoint. Referring to the API docs, `createAdminUser` takes `assigned_project_ids`. `updateUser` might take the same.

### Step 4: Bulk Operations
- The `UserTable` state will need to be extended to track selected user IDs.
- The `useUsers` hook might need to expose functions for performing bulk actions on the selected users and then refetching data.
- API may need to be extended with bulk endpoints to avoid making many individual requests. `admin.service.ts` has `bulkUpdateUsers` and `bulkDeleteUsers`. These should be used.

---

## ✅ Completion Criteria
- [ ] ROOT users have exclusive access to creating/managing other ROOT and ADMIN users.
- [ ] The workflow for changing a user's type is functional and secure.
- [ ] Admin project assignments can be updated by ROOT users.
- [ ] Bulk actions (delete, status change, group assignment) work correctly on multiple selected users.
- [ ] The UI remains performant and responsive during bulk operations. 