/**
 * User groups (`/admin/user-groups/*`) and project groups
 * (`/admin/project-groups/*`) from api.auth.
 *
 * Access model: USER → USER_GROUP → PROJECT_GROUP → PROJECT. A user group is a
 * set of users; a project group is a set of projects; granting a user group a
 * project group lets its members sign in to those projects.
 *
 * Route bodies (`…Response`) describe the JSON exactly as the backend sends it
 * and are kept for callers that still read them. Feature code should use the
 * normalised payloads (`UserGroupPage`, `UserGroupDetails`, …) returned by the
 * services' `list…`/`get…` methods.
 */

// ---------------------------------------------------------------------------
// User groups
// ---------------------------------------------------------------------------

/** api.auth `UserGroupInfo`. List rows always carry `member_count`; other routes omit it. */
export interface UserGroup {
  group_hash: string;
  group_name: string;
  description: string | null;
  member_count: number | null;
  created_at: string | null;
  updated_at?: string | null;
}

/** Form values for creating or editing a user group or project group. */
export interface GroupFormData {
  group_name: string;
  description: string;
}

/** `PUT /admin/user-groups/{hash}` and `PUT /admin/project-groups/{hash}` (Form). Empty values keep the current value. */
export interface UpdateGroupRequest {
  group_name?: string;
  description?: string;
}

/** Sort fields the list routes honour (`updated_at` is accepted too but not returned on rows). */
export type GroupSortField = 'group_name' | 'created_at';

export interface GroupListParams {
  /** 1–1000. */
  limit?: number;
  offset?: number;
  /** Case-insensitive substring match on the group name. */
  search?: string;
  sort_by?: GroupSortField;
  sort_order?: 'asc' | 'desc';
}

/** `pagination` of the group list routes (`PaginationInfo`). */
export interface GroupListPagination {
  limit: number;
  offset: number;
  total?: number | null;
  has_more?: boolean | null;
}

/**
 * Route body of `GET /admin/user-groups`. `pagination.total` counts every
 * active group and ignores `search`; `has_more` is always null.
 */
export interface GroupListResponse {
  success: boolean;
  message?: string | null;
  user_groups: UserGroup[];
  pagination: GroupListPagination;
}

/** One page of user groups. */
export interface UserGroupPage {
  groups: UserGroup[];
  /**
   * Count of all active groups. The backend ignores `search` when counting, so
   * this is not the number of matches while a search is active.
   */
  total: number | null;
}

/** Route body of `POST /admin/user-groups`. */
export interface CreateGroupResponse {
  success: boolean;
  message?: string | null;
  user_group: UserGroup;
}

/** Name and description echoed by the update routes (no counts or dates). */
export interface UpdatedGroup {
  group_hash: string;
  group_name: string;
  description: string | null;
}

export interface UserGroupStatistics {
  total_members: number;
  /** Active, non-archived projects reachable through the granted project groups. */
  total_projects: number;
  total_project_groups: number;
}

/** A project reachable through a user group's project groups. */
export interface ReachableProject {
  project_hash: string;
  project_name: string;
}

/** Normalised `GET /admin/user-groups/{hash}`. */
export interface UserGroupDetails {
  group: UserGroup;
  statistics: UserGroupStatistics;
  reachableProjects: ReachableProject[];
}

/** Member row of `GET /admin/user-groups/{hash}/members` (inactive users are excluded). */
export interface GroupMember {
  user_hash: string;
  username: string;
  email: string | null;
  user_type: string;
  is_active: boolean;
  /** When the membership was last (re)activated. */
  joined_at: string | null;
}

/** One page of members. `total` is the full member count. */
export interface GroupMemberPage {
  members: GroupMember[];
  total: number;
}

/** `assignment` of `POST /admin/user-groups/{hash}/members`. */
export interface GroupMemberAssignment {
  user: { user_hash: string; username: string };
  group: { group_hash: string; group_name: string };
  /** Username of the operator. */
  assigned_by: string;
}

/** Route body of `POST /admin/user-groups/{hash}/members` (Form `user_hash`). */
export interface AddMemberResponse {
  success: boolean;
  message?: string | null;
  assignment: GroupMemberAssignment;
}

export interface BulkAddMembersFailure {
  /** Null when the backend's message doesn't name one of the requested users. */
  user_hash: string | null;
  username: string | null;
  message: string;
}

/**
 * Normalised `POST /admin/user-groups/{hash}/members/bulk`. The route answers
 * 200 with `success: true` even when every user fails, so callers must look at
 * `failed`/`failures`.
 */
export interface BulkAddMembersResult {
  requested: number;
  succeeded: number;
  failed: number;
  failures: BulkAddMembersFailure[];
}

/** A project group granted to a user group (`GET /admin/user-groups/{hash}/project-groups`). No project counts. */
export interface ProjectGroupGrant {
  group_hash: string;
  group_name: string;
  group_description: string | null;
  created_at: string | null;
  is_active: boolean;
  granted_at: string | null;
}

/** Route body of `GET /admin/user-groups/{hash}/project-groups`. */
export interface UserGroupProjectGroupsResponse {
  success: boolean;
  message?: string | null;
  user_group: UserGroup | null;
  project_groups: ProjectGroupGrant[];
  total_project_groups: number;
  /** Always 0 (not computed by the backend). */
  total_derived_projects: number;
}

/** A group the user belongs to (`GET /admin/user-groups/users/{hash}/groups`). */
export interface UserGroupMembership {
  group_hash: string;
  group_name: string;
  description: string | null;
  joined_at: string | null;
}

/** Validation result for a user group's project linkage (used when assigning users). */
export interface UserGroupProjectValidation {
  groupHash: string;
  hasLinkedProjects: boolean;
  projectGroupCount: number;
  projectGroupNames: string[];
}

// ---------------------------------------------------------------------------
// Project groups
// ---------------------------------------------------------------------------

/** api.auth `ProjectGroupInfo`. `project_count` counts active, non-archived projects. */
export interface ProjectGroup {
  group_hash: string;
  group_name: string;
  description: string | null;
  project_count: number;
  created_at: string | null;
  updated_at?: string | null;
}

/** `POST /admin/project-groups` (Form). */
export interface CreateProjectGroupRequest {
  group_name: string;
  description?: string;
}

/** Route body of `GET /admin/project-groups`. `total` respects `search`. */
export interface ProjectGroupListResponse {
  success: boolean;
  message?: string | null;
  project_groups: ProjectGroup[];
  pagination: GroupListPagination;
}

/** One page of project groups. */
export interface ProjectGroupPage {
  projectGroups: ProjectGroup[];
  /** Number of matching groups (the backend applies `search` to the count). */
  total: number;
}

/** Route body of `POST /admin/project-groups`. */
export interface CreateProjectGroupResponse {
  success: boolean;
  message?: string | null;
  project_group: ProjectGroup;
}

/** A project in a project group (active, non-archived; sorted by name). */
export interface AssignedProject {
  project_hash: string;
  project_name: string;
  project_description: string | null;
}

/** Normalised `GET /admin/project-groups/{hash}`. */
export interface ProjectGroupDetails {
  projectGroup: ProjectGroup;
  projects: AssignedProject[];
}

/** Route body of `POST|DELETE /admin/project-groups/{hash}/projects[/{project}]`. */
export interface ProjectAssignmentResponse {
  success: boolean;
  message?: string | null;
}

/** A user group that has been granted a given project group. */
export interface UserGroupWithAccess extends UserGroup {
  granted_at: string | null;
}

/**
 * Outcome of applying one change to several items (one request per item, e.g.
 * adding projects or granting project groups). Ids are the items' hashes.
 */
export interface GroupBatchResult {
  succeeded: string[];
  failures: Array<{ id: string; message: string }>;
}

/**
 * User groups granted a project group. The backend has no reverse lookup, so
 * this is aggregated client-side; `uncheckedCount` is the number of user groups
 * whose grants could not be read.
 */
export interface UserGroupAccessResult {
  userGroups: UserGroupWithAccess[];
  uncheckedCount: number;
}
