# Milestone 6.1: Project Overview & Listing

## Overview
**Duration**: Day 1-4
**Status**: 📝 **PLANNED**
**Goal**: Create a comprehensive project listing page with search, filtering, and pagination, and the ability to create new projects.

This milestone establishes the foundation for project management, giving admins an efficient interface to view and find projects, and to initiate project creation.

**Dependencies**: ✅ Phase 5 completed (User Management)

## 📋 Tasks Checklist

### Step 1: Page & Route Setup
- [ ] Create `src/pages/projects/` directory and page components: `ProjectListPage.tsx`, `ProjectCreatePage.tsx`.
- [ ] Add the `/dashboard/projects` and `/dashboard/projects/create` routes in `App.tsx`.
- [ ] Update the main navigation to link to the Project Management page.
- [ ] Protect the routes using the `AdminRoute` guard.

### Step 2: Project Data Hook (`useProjects`)
- [ ] Create a new `useProjects.ts` hook for fetching and managing project data.
- [ ] Implement state for projects, pagination, loading, and errors.
- [ ] Implement a `fetchProjects` function that calls `projectService.getProjects`.
- [ ] Handle query parameters for pagination, search, and sorting.

### Step 3: Project Display Components
- [ ] Create a reusable `ProjectCard.tsx` component for a grid view.
- [ ] Create a reusable `ProjectTable.tsx` component for a list view.
- [ ] Add a view switcher (Grid/List) on the `ProjectListPage`.
- [ ] Implement loading and empty states for both views.

### Step 4: Search & Filtering
- [ ] Create a `ProjectFilter.tsx` component.
- [ ] Add a text input for searching by project name or description (with debouncing).
- [ ] Connect filter components to the `useProjects` hook to refetch data.

### Step 5: Pagination & Sorting
- [ ] Implement a `Pagination` component to work with both views.
- [ ] Connect pagination to the `useProjects` hook to handle page changes.
- [ ] Enable server-side sorting on the `ProjectTable` component.
- [ ] Update the `useProjects` hook to pass sorting parameters to the API.

### Step 6: Project Creation
- [ ] Create a reusable `ProjectForm.tsx` component.
- [ ] The `ProjectCreatePage` will use this form.
- [ ] Implement form validation for project name and description.
- [ ] Handle form submission by calling `projectService.createProject`.
- [ ] On success, navigate back to the project list with a success toast.

### Step 7: Project Actions Menu
- [ ] Create a `ProjectActionsMenu.tsx` component for each project card/row.
- [ ] Include actions for "View Details", "Edit", "Archive".
- [ ] Conditionally enable/disable actions based on user permissions.
- [ ] Link actions to placeholder functions or future routes.

---

## 🔧 Detailed Implementation Steps

### Step 1: Page & Route Setup
- Create files: `src/pages/projects/ProjectListPage.tsx`, `src/pages/projects/ProjectCreatePage.tsx`.
- In `App.tsx`, replace the `ComingSoon` component for `ROUTES.PROJECTS` with `<ProjectListPage />` and add a route for `ROUTES.PROJECTS_CREATE`.
- Ensure routes are wrapped in `<AdminRoute><DashboardLayout>...</DashboardLayout></AdminRoute>`.

### Step 2: `useProjects` Hook
- Create `src/hooks/useProjects.ts`.
- It will manage `projects: ProjectDetails[]`, `pagination: PaginationResponse`, `loading: boolean`, `error: string | null`.
- It will expose methods to change filters, search query, page, and sort order, triggering API calls to `projectService.getProjects`.

### Step 3: Project Display
- Create `src/components/features/projects/ProjectCard.tsx` and `ProjectTable.tsx`.
- The `ProjectListPage` will have state to toggle between grid and list view, rendering the appropriate component.

### Step 4: Filtering
- Create `src/components/features/projects/ProjectFilter.tsx`.
- Use the `Input` component for search. Implement debouncing to prevent excessive API calls.

### Step 5: Pagination & Sorting
- Use the existing `Pagination.tsx` component.
- `onSort` handler from the `Table` will call a function in `useProjects` to update sorting state.

### Step 6: Project Creation
- Create `src/components/features/projects/ProjectForm.tsx`.
- The form will handle `project_name` (required) and `project_description` (optional).
- `ProjectCreatePage` will contain the form and handle the submission logic.

### Step 7: Actions Menu
- Create `src/components/features/projects/ProjectActionsMenu.tsx`.
- Use the `usePermissions` hook to determine which actions are available.
- "Edit" will link to `ROUTES.PROJECTS_EDIT}/:{project_hash}` (to be created in 6.2).
- "View Details" will link to `ROUTES.PROJECTS_DETAILS}/:{project_hash}` (to be created in 6.2).

---

## ✅ Completion Criteria
- [ ] `ProjectListPage.tsx` is created and accessible at `/dashboard/projects`.
- [ ] `useProjects` hook successfully fetches and manages project data.
- [ ] The `ProjectTable` and `ProjectCard` views correctly display a list of projects.
- [ ] Search controls are functional and trigger API refetches.
- [ ] Pagination works for the project list.
- [ ] The "Create Project" page is functional and can create new projects via the API.
- [ ] A placeholder actions menu is present on each project, with permission checks. 