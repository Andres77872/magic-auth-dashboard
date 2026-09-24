import { ROUTES } from '@/utils/routes';

/** Links used across the group pages. Hashes are opaque, so they are always encoded. */
export const groupRoutes = {
  userGroupList: `${ROUTES.GROUPS}?tab=user-groups`,
  projectGroupList: `${ROUTES.GROUPS}?tab=project-groups`,
  userGroup: (groupHash: string): string =>
    `${ROUTES.GROUP}/${encodeURIComponent(groupHash)}`,
  projectGroup: (groupHash: string): string =>
    `${ROUTES.PROJECT_GROUPS_DETAILS}/${encodeURIComponent(groupHash)}`,
  user: (userHash: string): string =>
    `${ROUTES.USER}/${encodeURIComponent(userHash)}`,
  project: (projectHash: string): string =>
    `${ROUTES.PROJECT}/${encodeURIComponent(projectHash)}`,
};
