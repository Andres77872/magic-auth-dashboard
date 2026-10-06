import { ROUTES } from '@/utils/routes';

/** Links used across the group pages. Hashes are opaque, so they are always encoded. */
export const groupRoutes = {
  userGroupList: `${ROUTES.GROUPS}?tab=user-groups`,
  projectGroupList: `${ROUTES.GROUPS}?tab=project-groups`,
  userGroup: (groupHash: string): string =>
    `${ROUTES.GROUPS}/${encodeURIComponent(groupHash)}`,
  projectGroup: (groupHash: string): string =>
    `${ROUTES.PROJECT_GROUPS}/${encodeURIComponent(groupHash)}`,
  user: (userHash: string): string =>
    `${ROUTES.USERS}/${encodeURIComponent(userHash)}`,
  project: (projectHash: string): string =>
    `${ROUTES.PROJECTS}/${encodeURIComponent(projectHash)}`,
};
