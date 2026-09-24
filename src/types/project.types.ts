/**
 * Projects (api.auth `src/routes/projects.py`, mounted at `/projects`).
 *
 * Access model: USER → USER_GROUP → PROJECT_GROUP → PROJECT. There is no direct
 * user → project assignment. Project administrators are admin-type users in
 * the project's auto-created `admin_…` user group.
 */

import type { PaginationResponse } from './api.types';
import type { UserType } from './auth.types';
import type { UserGroup } from './group.types';

/** How the caller reaches a project (`ProjectAccessInfo.access_level`). */
export type ProjectAccessLevel = 'admin_access' | 'group_access';

/**
 * Row of `GET /projects` (api.auth `ProjectAccessInfo`). The list carries no
 * timestamps or counts; `access_level` is `admin_access` for root and for
 * admins on their assigned projects.
 */
export interface ProjectSummary {
  project_hash: string;
  project_name: string;
  project_description: string | null;
  access_level: ProjectAccessLevel;
  /** `admin_access` or `user_group`. */
  access_through: string;
}

/**
 * @deprecated Name kept for existing pickers (tokens, users). Use `ProjectSummary`.
 */
export type ProjectDetails = ProjectSummary;

export interface ProjectListParams {
  /** 1–500; api.auth defaults to 10. */
  limit?: number;
  offset?: number;
  /** Case-insensitive substring on name or description. Whitespace-only values are rejected by the API. */
  search?: string;
}

/**
 * `GET /projects`. For root callers `pagination.total` is only the length of
 * the returned page and `has_more` is always `false`; for admins both are real.
 */
export interface ProjectListResponse {
  success: boolean;
  message?: string | null;
  projects: ProjectSummary[];
  pagination: PaginationResponse;
  /** `admin` for root/admin callers, `user` otherwise. */
  user_access_level: 'admin' | 'user';
}

/** api.auth `ProjectInfo` (details, create, update and delete payloads). */
export interface ProjectInfo {
  project_hash: string;
  project_name: string;
  project_description: string | null;
  /** Set by `GET /projects/{hash}` and `POST /projects`; `null` elsewhere. */
  created_at: string | null;
  /** No project route fills this today. */
  updated_at: string | null;
}

/** The caller's relationship to a project (`GET /projects/{hash}` `user_access`). */
export interface ProjectUserAccess {
  /** The caller's session permissions when they administer the project, `[]` otherwise. */
  permissions: string[];
  access_level: ProjectAccessLevel;
  /** Names of all the caller's user groups, not only the ones that reach this project. */
  user_groups: string[];
}

/** A project group that contains the project. */
export interface ProjectGroupInfo {
  group_hash: string;
  group_name: string;
  description: string | null;
}

/**
 * The project detail view uses access and group data; statistics are not
 * displayed or normalized by this client surface.
 */
export interface ProjectDetailsData {
  project: ProjectInfo;
  user_access: ProjectUserAccess;
  project_groups: ProjectGroupInfo[];
}

export interface CreateProjectRequest {
  project_name: string;
  project_description?: string;
}

/** Omitted or empty fields keep their current value; a description cannot be cleared. */
export interface UpdateProjectRequest {
  project_name?: string;
  project_description?: string;
}

/** `DELETE /projects/{hash}` (soft delete). */
export interface DeleteProjectResult {
  deleted_project: ProjectInfo | null;
  warning: string | null;
}

export interface ProjectFormData {
  project_name: string;
  project_description: string;
}

export interface ProjectFormErrors {
  project_name?: string;
  project_description?: string;
}

// Members --------------------------------------------------------------------

export type ProjectMemberAccessLevel =
  | 'root_access'
  | 'admin_access'
  | 'group_access';

/**
 * A user who can reach the project (every active root user plus users who
 * reach it through the group chain). `GET /projects/{hash}/members`.
 */
export interface ProjectMember {
  user_hash: string;
  username: string;
  email: string | null;
  user_type: UserType;
  is_active: boolean;
  /** Filled only for consumers: the names of all their user groups, not only those granting this project. */
  groups: string[];
  access_level: ProjectMemberAccessLevel;
  /** Earliest group grant (project creation time for root users). */
  joined_at: string | null;
  created_at: string | null;
}

export interface ProjectMembersParams {
  /** 1–100. */
  limit?: number;
  offset?: number;
  user_type?: UserType;
}

/**
 * Members page. The route's per-type `statistics` only count the current page,
 * so they are not exposed; `pagination.total` is the real total.
 */
export interface ProjectMembersPage {
  members: ProjectMember[];
  pagination: PaginationResponse;
}

// User groups with access ------------------------------------------------------

export interface ProjectUserGroupsParams {
  /** 1–500; api.auth defaults to 100. */
  limit?: number;
  offset?: number;
}

/** `GET /projects/{hash}/groups`: user groups that reach the project through its project groups. */
export interface ProjectUserGroupsPage {
  user_groups: UserGroup[];
  pagination: PaginationResponse;
}

// Activity ---------------------------------------------------------------------

export interface ProjectActivityParams {
  /** 1–100. */
  limit?: number;
  offset?: number;
  /** Look-back window in days, 1–365 (api.auth default 30). */
  days?: number;
  activity_type?: string;
}

export interface ProjectActivityActor {
  username: string;
  userHash: string;
}

/** One `GET /projects/{hash}/activity` entry, without internal ids or network details. */
export interface ProjectActivityEntry {
  id: string;
  activityType: string;
  /** Catalogue name for the activity type, when the backend has one. */
  activityName: string | null;
  details: unknown;
  createdAt: string | null;
  actor: ProjectActivityActor | null;
  target: ProjectActivityActor | null;
  userGroupName: string | null;
}

export interface ProjectActivityPage {
  activities: ProjectActivityEntry[];
  pagination: PaginationResponse;
  days: number;
}
