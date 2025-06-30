# Milestone 5.2: User Creation & Management

## Overview
**Duration**: Day 5-7
**Status**: 🟡 **IN PROGRESS**
**Goal**: Implement the complete user lifecycle management, including creation, editing, and viewing of user profiles with detailed information.

This milestone builds on the user list by adding the core CRUD operations for individual user management.

**Dependencies**: ✅ Milestone 5.1 completed (User List & Search)

## 📋 Tasks Checklist

### Step 1: User Creation Page
- [x] Create `UserCreatePage.tsx` under `src/pages/users/`.
- [x] Add a route for `/dashboard/users/create` in `App.tsx`.
- [x] Add a "Create User" button on the `UserListPage` that navigates to this page.
- [x] The button is only visible to users with `canCreateUser` permission.

### Step 2: User Form Component
- [x] Create a reusable `UserForm.tsx` component in `src/components/features/users/`.
- [x] The form handles both user creation and editing modes.
- [x] Include fields for username, email, password, and confirm password (for creation).
- [x] Include a `UserTypeSelector` component to choose the user type.
- [x] For ADMIN creation, a placeholder is included for assigning projects.

### Step 3: Form Validation
- [x] Implement robust client-side validation for all form fields.
- [x] Use constants from `src/utils/constants.ts` for length requirements.
- [x] Provide clear, inline error messages for each field.
- [x] Implement a `check-availability` API call for username/email on blur/debounce to provide real-time feedback.

### Step 4: User Edit Page
- [x] Create `UserEditPage.tsx` and add a route for `/dashboard/users/edit/:userHash`.
- [x] The "Edit" action from the `UserActionsMenu` now navigates here.
- [x] Fetch the user's data using `userService.getUserByHash` and populate the `UserForm`.
- [x] The password field is optional when editing.

### Step 5: User Profile Page
- [x] Create `UserProfilePage.tsx` and a route for `/dashboard/users/profile/:userHash`.
- [x] Design a `UserProfileCard` to display the user's main information.
- [x] Add sections to show assigned projects, groups, and roles (as placeholders).
- [x] Add a placeholder for the user's activity history.

### Step 6: User Actions Implementation
- [ ] Implement the `handleDelete` function, which calls `userService.deleteUser` after showing a `ConfirmDialog`. (**PENDING**)
- [ ] Implement `handleToggleStatus` (Activate/Deactivate) which calls `userService.toggleUserStatus`. (**PENDING**)
- [ ] Implement `handleResetPassword`, which calls `userService.resetUserPassword` and shows the new password in a modal. (**PENDING**)

---

## 🔧 Detailed Implementation Steps

### Step 1 & 2: Creation Page and Form
- The `UserCreatePage` contains the `UserForm` component.
- The `usePermissions` hook determines which user types can be created. A regular ADMIN can only create CONSUMERs, while a ROOT can create any type.
- The `UserForm` manages its own state for form data and errors. On submit, it calls the appropriate function from `userService` (e.g., `createAdminUser`).

### Step 3 & 4: Validation and Edit Page
- The `UserEditPage` fetches user data and passes it as initial data to the `UserForm`.
- The form is in "edit" mode, where the password is not required and the username is disabled.
- API validation errors returned from the server are displayed as general form errors.

### Step 5: Profile Page
- This page is read-only and presents a comprehensive view of the user.
- It makes an API call to get the user's details.
- Data is presented clearly in distinct sections using `Card` components.

### Step 6: Implementing Actions
- Destructive actions (delete, status toggle, password reset) are pending implementation.
- Navigation for "View Profile" and "Edit User" is fully implemented.

---

## ✅ Completion Criteria
- [x] A "Create User" page exists and allows authorized admins to create new users.
- [x] An "Edit User" page exists and allows authorized admins to update user information.
- [x] A "User Profile" page exists for viewing detailed user information.
- [x] All forms have complete and user-friendly validation.
- [ ] Actions like delete, deactivate, and password reset are fully functional and secure. (**PENDING**)
- [x] The UI/UX for creating and managing users is clean, responsive, and intuitive. 