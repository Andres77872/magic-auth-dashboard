# Phase 6: Project Management

## Overview
**Duration**: Week 6-8
**Status**: ✅ **COMPLETED**
**Goal**: Implement comprehensive project management CRUD functionality, enabling admins to list, create, edit, and manage projects and their members.

This phase is essential for providing administrators with the tools to manage project lifecycles, from creation to archival, including member and permission management within each project.

**Dependencies**: ✅ Phase 5 completed (User Management)

## Sub-Milestones

### 📋 [Milestone 6.1: Project Overview & Listing](6.1-project-overview-listing/README.md)
- [x] Create main project listing page with both grid (card) and list (table) views.
- [x] Implement server-side pagination, sorting, and searching for projects.
- [x] Develop a "Create Project" page with a reusable form component.
- [x] Add quick action menus for each project (edit, view details, etc.).

### ➕ [Milestone 6.2: Project Details & Management](6.2-project-details-management/README.md)
- [x] Build a comprehensive project details page with multiple tabs (Overview, Members, Settings).
- [x] Implement project member management: add, remove, and manage members.
- [x] Add project administration features: edit details, archive/delete projects, and transfer ownership.
- [x] Integrate with RBAC for role assignments within the project context.

## Success Criteria

### Functional Requirements
- [x] Admins can view, search, and filter a list of all projects they have permission to see.
- [x] Admins can create new projects with a name and description.
- [x] Admins can edit existing project details.
- [x] Admins can archive and delete projects, with appropriate confirmation dialogs.
- [x] Admins can add and remove members from projects.
- [x] The project management interface is fully responsive.

### Technical Requirements
- [x] Complete integration with all relevant `/projects` API endpoints from `project.service.ts`.
- [x] Create and use a new `useProjects` custom hook for managing project list data.
- [x] All new components (`ProjectTable`, `ProjectCard`, `ProjectForm`, etc.) follow the existing architecture.
- [x] Use reusable components from `/common` extensively.
- [x] Full TypeScript type safety for all new components, hooks, and services.
- [x] All destructive actions are protected by `ConfirmDialog`.

### User Experience
- [x] The project management section is intuitive and well-integrated.
- [x] Clear feedback for all actions (loading states, success toasts, error messages).
- [x] Forms provide helpful, inline validation.
- [x] The project list is performant, even with many projects.

## Architecture Overview

### Data Flow Architecture
```
API Endpoints (projectService) → Custom Hook (useProjects) → Page Components    → UI Display
           ↓                          ↓                        ↓                   ↓
GET /projects?params        → useProjects(params)      → ProjectListPage    → ProjectTable/ProjectCard
POST /projects              → createProject()          → ProjectCreatePage  → ProjectForm component
PUT /projects/:hash         → updateProject()          → ProjectEditPage    → ProjectForm component
DELETE /projects/:hash      → deleteProject()          → ProjectListPage    → ConfirmDialog
GET /projects/:hash/members → getProjectMembers()      → ProjectDetailsPage → ProjectMembers tab
```

### Component Hierarchy
```
pages/
└── projects/
    ├── ProjectListPage.tsx
    │   ├── ProjectTable.tsx
    │   └── ProjectCard.tsx
    ├── ProjectCreatePage.tsx
    │   └── ProjectForm.tsx
    ├── ProjectEditPage.tsx
    │   └── ProjectForm.tsx
    └── ProjectDetailsPage.tsx
        ├── ProjectOverviewTab.tsx
        ├── ProjectMembersTab.tsx
        └── ProjectSettingsTab.tsx

components/
└── features/
    └── projects/
        ├── ProjectTable.tsx
        ├── ProjectCard.tsx
        ├── ProjectForm.tsx
        ├── ProjectStatusBadge.tsx
        ├── ProjectActionsMenu.tsx
        └── AddMemberModal.tsx
```

### Data Integration Points

#### Project Listing
- **Endpoint**: `GET /projects`
- **Hook**: `useProjects`
- **Features**: Server-side pagination (`limit`, `offset`), searching (`search`), sorting.

#### Project Creation
- **Endpoint**: `POST /projects`
- **Service**: `projectService.createProject`
- **Permissions**: `AdminRoute` protection.

#### Project Update
- **Endpoint**: `PUT /projects/{project_hash}`
- **Service**: `projectService.updateProject`
- **Features**: Partial updates to project details.

#### Project Deletion/Archival
- **Deletion Endpoint**: `DELETE /projects/{project_hash}`
- **Archival Endpoint**: `PATCH /projects/{project_hash}/archive`
- **Services**: `projectService.deleteProject`, `projectService.toggleProjectArchive`
- **Protection**: `ConfirmDialog` component.

#### Member Management
- **Endpoints**: `GET /projects/{project_hash}/members`, `POST /projects/{project_hash}/members`, `DELETE /projects/{project_hash}/members/{user_hash}`
- **Services**: `projectService.getProjectMembers`, `projectService.addProjectMember`, `projectService.removeProjectMember`

## File Structure (Planned)

```
src/
├── pages/
│   └── projects/
│       ├── ProjectListPage.tsx
│       ├── ProjectCreatePage.tsx
│       ├── ProjectEditPage.tsx
│       └── ProjectDetailsPage.tsx
├── components/
│   └── features/
│       └── projects/
│           ├── ProjectTable.tsx
│           ├── ProjectCard.tsx
│           ├── ProjectForm.tsx
│           ├── ProjectActionsMenu.tsx
│           ├── ProjectStatusBadge.tsx
│           ├── AddMemberModal.tsx
│           └── index.ts
├── hooks/
│   └── useProjects.ts
└── styles/
    └── pages/
        └── projects.css
```

## Integration Points

### Phase 3 Integration (Layout & UI)
- The new project management pages will use the `DashboardLayout`.
- Reusable UI components (`Table`, `Card`, `Button`, `Input`, `Modal`) will be used.
- `Breadcrumbs` will be automatically generated for project routes.

### Phase 5 Integration (User Management)
- User data will be needed for the `AddMemberModal` component to search and select users to add to projects.
- The `user` object will be part of the member list.

### Phase 8 Integration (RBAC)
- Role assignment for project members will be a key feature in the `ProjectDetailsPage`. This will be fully implemented in Phase 8, but placeholders will be added now.

## Risk Mitigation

### Technical Risks
- **Complex State Management**: The project details page with multiple tabs and member management can have complex state. Mitigation: Use a dedicated state management hook (`useProjectDetails`) and keep components small and focused.
- **API Dependencies**: Relies on user and RBAC data. Mitigation: Use mock data during development if dependent services are not ready. Create clear interfaces in the `types` directory.

### User Experience Risks
- **Accidental Deletion/Archival**: Deleting or archiving a project is a major action. Mitigation: Use `ConfirmDialog` with very clear warnings about the consequences.
- **Permission Confusion**: Managing members and roles can be complex. Mitigation: Provide a clear UI for member management and role assignments, with tooltips and help text.

## 🎯 Definition of Done

1. **✅ Functional Project Management**
   - [x] All CRUD operations for projects are functional and permission-gated.
   - [x] Project list page correctly displays, filters, sorts, and paginates projects.
   - [x] Project creation/edit forms are functional with validation.
   - [x] Member management (add/remove) is functional.

2. **✅ Code Quality & Architecture**
   - [x] `useProjects` hook is created and manages project list data state.
   - [x] All new components are reusable and follow architectural patterns.
   - [x] Full TypeScript strict compliance.

3. **✅ User Experience**
   - [x] The project management section is intuitive and provides clear feedback.
   - [x] The system is protected against accidental destructive actions.
   - [x] The interface is fully responsive.

</rewritten_file> 