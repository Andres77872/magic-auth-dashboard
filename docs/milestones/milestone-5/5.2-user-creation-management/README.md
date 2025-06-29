# Milestone 5.2: User Creation & Management

## Overview
**Duration**: Day 5-7
**Status**: ⏳ **TO DO**
**Goal**: Implement the complete user lifecycle management, including creation, editing, and viewing of user profiles with detailed information.

This milestone builds on the user list by adding the core CRUD operations for individual user management.

**Dependencies**: ✅ Milestone 5.1 completed (User List & Search)

## 📋 Tasks Checklist

### Step 1: User Creation Page
- [ ] Create `UserCreatePage.tsx` under `src/pages/users/`.
- [ ] Add a route for `/dashboard/users/create` in `App.tsx`.
- [ ] Add a "Create User" button on the `UserListPage` that navigates to this page.
- [ ] The button should only be visible to users with `canCreateUser` permission.

### Step 2: User Form Component
- [ ] Create a reusable `UserForm.tsx` component in `src/components/features/users/`.
- [ ] The form should handle both user creation and editing modes.
- [ ] Include fields for username, email, password, and confirm password (for creation).
- [ ] Include a `UserTypeSelector` component to choose the user type.
- [ ] For ADMIN creation, include a way to assign projects (e.g., a multi-select modal).

### Step 3: Form Validation
- [ ] Implement robust client-side validation for all form fields.
- [ ] Use constants from `src/utils/constants.ts` for length requirements.
- [ ] Provide clear, inline error messages for each field.
- [ ] Implement a `check-availability` API call for username/email on blur/debounce to provide real-time feedback.

### Step 4: User Edit Page
- [ ] Create `UserEditPage.tsx` and add a route for `/dashboard/users/edit/:userHash`.
- [ ] The "Edit" action from the `UserActionsMenu` should navigate here.
- [ ] Fetch the user's data using `userService.getUserByHash` and populate the `UserForm`.
- [ ] The password field should be optional when editing.

### Step 5: User Profile Page
- [ ] Create `UserProfilePage.tsx` and a route for `/dashboard/users/profile/:userHash`.
- [ ] Design a `UserProfileCard` to display the user's main information.
- [ ] Add sections to show assigned projects, groups, and roles.
- [ ] Add a placeholder for the user's activity history.

### Step 6: User Actions Implementation
- [ ] Implement the `handleDelete` function, which calls `userService.deleteUser` after showing a `ConfirmDialog`.
- [ ] Implement `handleToggleStatus` (Activate/Deactivate) which calls `userService.toggleUserStatus`.
- [ ] Implement `handleResetPassword`, which calls `userService.resetUserPassword` and shows the new password in a modal.

---

## 🔧 Detailed Implementation Steps

### Step 1 & 2: Creation Page and Form
- The `UserCreatePage` will contain the `UserForm` component.
- The `usePermissions` hook will determine which user types can be created. A regular ADMIN should only be able to create CONSUMERs, while a ROOT can create any type.
- The `UserForm` will manage its own state for form data and errors. On submit, it will call the appropriate function from `userService` (e.g., `createAdminUser`).

### Step 3 & 4: Validation and Edit Page
- The `UserEditPage` will fetch user data and pass it as initial data to the `UserForm`.
- The form will be in "edit" mode, where the password is not required and the username may be disabled.
- API validation errors returned from the server should be displayed as general form errors.

### Step 5: Profile Page
- This page is read-only.
- It will make multiple API calls to get the user's details, their projects, groups, and permissions.
- Data should be presented clearly in distinct sections using `Card` components.

### Step 6: Implementing Actions
- All destructive actions must use the `ConfirmDialog` component.
- After a successful action (delete, update status), the user list managed by `useUsers` should be refetched to show the changes.
- Success/error toasts should be displayed for feedback.

---

## ✅ Completion Criteria
- [ ] A "Create User" page exists and allows authorized admins to create new users.
- [ ] An "Edit User" page exists and allows authorized admins to update user information.
- [ ] A "User Profile" page exists for viewing detailed user information.
- [ ] All forms have complete and user-friendly validation.
- [ ] Actions like delete, deactivate, and password reset are fully functional and secure.
- [ ] The UI/UX for creating and managing users is clean, responsive, and intuitive. 