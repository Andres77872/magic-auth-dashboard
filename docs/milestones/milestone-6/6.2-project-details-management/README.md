# Milestone 6.2: Project Details & Management

## Overview
**Duration**: Day 5-8
**Status**: 📝 **PLANNED**
**Goal**: Implement the complete project lifecycle management, including editing details, managing members, and handling archival and deletion.

This milestone builds on the project list by adding the core CRUD operations for individual project management and member administration.

**Dependencies**: ✅ Milestone 6.1 completed (Project Overview & Listing)

## 📋 Tasks Checklist

### Step 1: Project Edit Page
- [ ] Create `ProjectEditPage.tsx` under `src/pages/projects/`.
- [ ] Add a route for `/dashboard/projects/edit/:projectHash` in `App.tsx`.
- [ ] The "Edit" action from the `ProjectActionsMenu` now navigates here.
- [ ] Fetch the project's data using `projectService.getProject` and populate the `ProjectForm`.

### Step 2: Project Details Page
- [ ] Create `ProjectDetailsPage.tsx` and a route for `/dashboard/projects/details/:projectHash`.
- [ ] Design the page with a tabbed interface: "Overview", "Members", "Settings".
- [ ] The "Overview" tab will display project metadata and key stats.

### Step 3: Member Management Tab
- [ ] Create a `ProjectMembersTab.tsx` component.
- [ ] Use `projectService.getProjectMembers` to fetch and display a list of members in a table.
- [ ] Implement an "Add Member" button that opens an `AddMemberModal`.
- [ ] The modal will allow searching for users and adding them to the project.
- [ ] Implement an action to remove a member from the project (with confirmation).

### Step 4: Project Settings Tab
- [ ] Create a `ProjectSettingsTab.tsx` component.
- [ ] Include a section for editing the project name and description (reusing `ProjectForm` in a compact mode).
- [ ] Add a "Transfer Ownership" feature.
- [ ] Add "Archive Project" and "Delete Project" actions in a "Danger Zone".

### Step 5: Implement Actions
- [ ] Implement `handleArchive` function, calling `projectService.toggleProjectArchive` with confirmation.
- [ ] Implement `handleDelete`, calling `projectService.deleteProject` after a strong confirmation (e.g., typing project name).
- [ ] Implement `handleTransferOwnership`, which opens a modal to select a new owner.

---

## 🔧 Detailed Implementation Steps

### Step 1: Edit Page
- The `ProjectEditPage` fetches project data and passes it as initial data to the `ProjectForm` (created in 6.1).
- The form is in "edit" mode. On submit, it calls `projectService.updateProject`.

### Step 2 & 3: Details Page and Member Management
- The `ProjectDetailsPage` is the main container for viewing a single project.
- The `ProjectMembersTab` will have its own state management for the member list, including pagination and search for members.
- `AddMemberModal` will use `userService.getUsers` to provide a searchable list of users to add. It will then call `projectService.addProjectMember`.
- Removing a member will call `projectService.removeProjectMember` after a `ConfirmDialog`.

### Step 4 & 5: Settings Tab and Actions
- The "Danger Zone" will clearly separate destructive actions.
- Archiving is a soft delete, making the project read-only.
- Deleting is permanent and will require a more explicit confirmation dialog.

---

## ✅ Completion Criteria
- [ ] An "Edit Project" page exists and allows authorized admins to update project information.
- [ ] A "Project Details" page exists with a functional members tab.
- [ ] Admins can add and remove members from a project.
- [ ] Admins can archive and un-archive projects.
- [ ] Admins can delete projects after a confirmation.
- [ ] The UI/UX for managing projects is clean, responsive, and intuitive. 