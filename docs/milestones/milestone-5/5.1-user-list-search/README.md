# Milestone 5.1: User List & Search

## Overview
**Duration**: Day 1-4
**Status**: 🚀 **IN PROGRESS**
**Goal**: Create a comprehensive user listing page with a searchable, filterable, and paginated data table to manage all system users.

This milestone lays the foundation for all user management workflows by providing administrators with a powerful interface to view and find users.

**Dependencies**: ✅ Phase 4 completed (Dashboard Overview)

## 📋 Tasks Checklist

### Step 1: Page & Route Setup
- [x] Create the main `UserListPage.tsx` component.
- [x] Add the `/dashboard/users` route in `App.tsx` to render the page.
- [x] Update the main navigation to link to the new User Management page.
- [x] Protect the route using the `AdminRoute` guard.

### Step 2: User Data Hook (`useUsers`)
- [x] Create a new `useUsers.ts` hook for fetching and managing user data.
- [x] Implement state for users, pagination, loading, and errors.
- [x] Implement a `fetchUsers` function that calls `userService.getUsers`.
- [x] Handle query parameters for pagination, search, sorting, and filtering.

### Step 3: User Table Component
- [x] Create a reusable `UserTable.tsx` component using the generic `Table` component.
- [x] Define table columns: Username, Email, User Type, Status, Created At, Actions.
- [x] Render user data from the `useUsers` hook.
- [x] Implement loading and empty states for the table.

### Step 4: Search & Filtering
- [x] Create a `UserFilter.tsx` component with input fields.
- [x] Add a text input for searching by username or email (with debouncing).
- [x] Add a `Select` component to filter by `UserType` (ROOT, ADMIN, CONSUMER).
- [x] Add a `Select` component to filter by user status (Active, Inactive).
- [x] Connect filter components to the `useUsers` hook to refetch data.

### Step 5: Pagination & Sorting
- [x] Implement a `Pagination` component to work with the `UserTable`.
- [x] Connect the pagination component to the `useUsers` hook to handle page changes.
- [x] Enable server-side sorting on the `UserTable` columns.
- [x] Update the `useUsers` hook to pass sorting parameters to the API.

### Step 6: User Actions Menu
- [x] Create a `UserActionsMenu.tsx` component for each row in the table.
- [x] Use a dropdown/popover for the actions menu (Edit, Delete, Change Status, etc.).
- [x] Conditionally enable/disable actions based on the current user's permissions and the target user's type (e.g., an ADMIN cannot delete a ROOT user).
- [x] Add stubs for actions that will be implemented in the next milestone.

---

## 🔧 Detailed Implementation Steps

### Step 1: Page & Route Setup
- Create file `src/pages/users/UserListPage.tsx`.
- In `App.tsx`, replace the `ComingSoon` component for the `ROUTES.USERS` path with `<UserListPage />`.
- Ensure the route is wrapped in `<AdminRoute><DashboardLayout>...</DashboardLayout></AdminRoute>`.
- In `src/utils/routes.ts`, ensure `NAVIGATION_ITEMS` for "Users" is correctly configured.

### Step 2: `useUsers` Hook
- Create `src/hooks/useUsers.ts`.
- The hook should manage `users: User[]`, `pagination: PaginationResponse`, `loading: boolean`, `error: string | null`.
- It should accept an initial set of filters as an argument.
- It should expose methods to change filters, search query, page, and sort order, which will trigger an API call.
- The API call `userService.getUsers(params)` will be the core of the hook.

### Step 3: `UserTable` Component
- Create `src/components/features/users/UserTable.tsx`.
- Define `TableColumn<User>[]` for the user data.
- Use the `render` property for columns that need custom rendering (e.g., `UserType` with a `<Badge>`, Status, Actions).
- Pass `isLoading`, `data`, and `onSort` props from `UserListPage` to the `Table`.

### Step 4: `UserFilter` Component
- Create `src/components/features/users/UserFilter.tsx`.
- Use `Input` and `Select` components from `src/components/common`.
- Implement `useEffect` with debouncing for the search input to avoid excessive API calls.
- `onFiltersChange` callback will be passed from `UserListPage` to update the state in the `useUsers` hook.

### Step 5: Pagination & Sorting
- Use or create a `Pagination.tsx` component that takes `currentPage`, `totalPages`, `onPageChange` as props.
- The `UserListPage` will get pagination data from `useUsers` and pass it down.
- The `onSort` handler from the `Table` component will call a function exposed by `useUsers` to update sorting state and refetch data.

### Step 6: `UserActionsMenu`
- Create `src/components/features/users/UserActionsMenu.tsx`.
- This component will receive a `user` object.
- It will use the `usePermissions` hook to check if the current admin can perform actions on the target user.
- For this milestone, the menu items (e.g., "Edit User") can just `console.log` the action, to be fully implemented in 5.2.

---

## ✅ Completion Criteria
- [ ] `UserListPage.tsx` is created and accessible at `/dashboard/users`.
- [ ] `useUsers` hook successfully fetches and manages user data from the API.
- [ ] The `UserTable` correctly displays a list of users with their details.
- [ ] Search and filter controls are functional and trigger API refetches.
- [ ] Pagination controls allow navigation through the full user list.
- [ ] Table columns are sortable, with requests made to the server.
- [ ] A placeholder actions menu is present on each row, with permission checks in place.
- [ ] The entire page is responsive and usable on mobile. 