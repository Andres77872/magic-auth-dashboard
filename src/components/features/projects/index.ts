export { ProjectTable } from './ProjectTable';
export { ProjectCard } from './ProjectCard';
export { ProjectFilter } from './ProjectFilter';
export { ProjectForm } from './ProjectForm';
export { ProjectFormModal } from './ProjectFormModal';
export { ProjectActionsMenu } from './ProjectActionsMenu';
export { ProjectOverviewTab } from './ProjectOverviewTab';
export { ProjectMembersTab } from './ProjectMembersTab';
export { ProjectSettingsTab } from './ProjectSettingsTab';
export { ProjectGroupsTab } from './ProjectGroupsTab';
export { ProjectPermissionsTab } from './ProjectPermissionsTab';

// NOTE: Project access is managed through Groups-of-Groups architecture:
// User -> User Group -> Project Group -> Project
// Access is granted via:
// 1. POST /admin/project-groups/{hash}/projects - Add project to project group
// 2. POST /admin/user-groups/{hash}/project-groups - Grant user group access to project group 