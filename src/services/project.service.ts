import { deleteJson, getJson, postFormJson, putFormJson, seg } from './request';
import type { PaginationResponse } from '@/types/api.types';
import type {
  CreateProjectRequest,
  DeleteProjectResult,
  ProjectActivityActor,
  ProjectActivityEntry,
  ProjectActivityPage,
  ProjectActivityParams,
  ProjectDetailsData,
  ProjectGroupInfo,
  ProjectInfo,
  ProjectListParams,
  ProjectListResponse,
  ProjectMember,
  ProjectMembersPage,
  ProjectMembersParams,
  ProjectUserAccess,
  ProjectUserGroupsPage,
  ProjectUserGroupsParams,
  UpdateProjectRequest,
} from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';

/** api.auth's maximum `limit` for `GET /projects`. */
export const PROJECT_LIST_MAX_LIMIT = 500;

// Raw response shapes (api.auth `src/routes/projects.py`) -------------------------

interface RawProjectDetailsResponse {
  project?: ProjectInfo | null;
  user_access?: ProjectUserAccess | null;
  project_groups?: ProjectGroupInfo[] | null;
}

interface RawProjectInfoResponse {
  project?: ProjectInfo | null;
}

interface RawDeleteProjectResponse {
  deleted_project?: ProjectInfo | null;
  warning?: string | null;
}

interface RawProjectMembersResponse {
  members?: ProjectMember[];
  pagination?: PaginationResponse | null;
}

interface RawProjectUserGroupsResponse {
  user_groups?: UserGroup[];
  pagination?: PaginationResponse | null;
}

/** A row of `sp_get_activity_logs` as the activity route returns it. */
interface RawProjectActivityRow {
  id: string | number;
  activity_type: string;
  details?: unknown;
  created_at?: string | null;
  username?: string | null;
  user_hash?: string | null;
  target_username?: string | null;
  target_user_hash?: string | null;
  user_group_name?: string | null;
  activity_name?: string | null;
}

interface RawProjectActivityResponse {
  activities?: RawProjectActivityRow[];
  pagination?: PaginationResponse | null;
  filters?: { days?: number | null } | null;
}

function actor(
  username: string | null | undefined,
  userHash: string | null | undefined
): ProjectActivityActor | null {
  return username && userHash ? { username, userHash } : null;
}

function mapActivityRow(row: RawProjectActivityRow): ProjectActivityEntry {
  return {
    id: String(row.id),
    activityType: row.activity_type,
    activityName: row.activity_name ?? null,
    details: row.details ?? null,
    createdAt: row.created_at ?? null,
    actor: actor(row.username, row.user_hash),
    target: actor(row.target_username, row.target_user_hash),
    userGroupName: row.user_group_name ?? null,
  };
}

/** Pagination is always present on these routes; a missing block is a contract break. */
function requirePagination(
  pagination: PaginationResponse | null | undefined,
  route: string
): PaginationResponse {
  if (!pagination) throw new Error(`The ${route} response had no pagination.`);
  return pagination;
}

/**
 * Projects (`/projects/*`). Writes are form encoded. Methods return payloads;
 * failures arrive as thrown `ApiError`s from the transport.
 */
class ProjectService {
  /**
   * `GET /projects`. When `limit` is omitted the API maximum is requested,
   * because callers are pickers that need the whole list (api.auth's own
   * default is 10). Root pagination totals are page lengths; see the type.
   */
  async getProjects(
    params: ProjectListParams = {}
  ): Promise<ProjectListResponse> {
    const res = await getJson<ProjectListResponse>('/projects', {
      limit: params.limit ?? PROJECT_LIST_MAX_LIMIT,
      offset: params.offset,
      // Whitespace-only search is a 400 for root/admin callers.
      search: params.search?.trim(),
    });
    return { ...res, projects: res.projects ?? [] };
  }

  /** `GET /projects/{hash}` for root, the project's admins, or users with group access. */
  async getProject(projectHash: string): Promise<ProjectDetailsData> {
    const res = await getJson<RawProjectDetailsResponse>(
      `/projects/${seg(projectHash)}`
    );
    if (!res.project || !res.user_access) {
      throw new Error('The project response was incomplete.');
    }
    return {
      project: res.project,
      user_access: {
        permissions: res.user_access.permissions ?? [],
        access_level: res.user_access.access_level,
        user_groups: res.user_access.user_groups ?? [],
      },
      project_groups: res.project_groups ?? [],
    };
  }

  /**
   * `POST /projects` (root only). Also creates the project's project group and
   * its `admin_…`, `user_…` and `readonly_…` user groups.
   */
  async createProject(data: CreateProjectRequest): Promise<ProjectInfo> {
    const res = await postFormJson<RawProjectInfoResponse>('/projects', {
      project_name: data.project_name.trim(),
      project_description: data.project_description?.trim() || undefined,
    });
    if (!res.project)
      throw new Error(
        'The project was created but the response had no project.'
      );
    return res.project;
  }

  /** `PUT /projects/{hash}` (root or an assigned admin). Empty values keep the current text. */
  async updateProject(
    projectHash: string,
    data: UpdateProjectRequest
  ): Promise<ProjectInfo> {
    const res = await putFormJson<RawProjectInfoResponse>(
      `/projects/${seg(projectHash)}`,
      {
        project_name: data.project_name?.trim() || undefined,
        project_description: data.project_description?.trim() || undefined,
      }
    );
    if (!res.project)
      throw new Error(
        'The project was updated but the response had no project.'
      );
    return res.project;
  }

  /** `DELETE /projects/{hash}`: soft delete; revokes every user group's access. */
  async deleteProject(projectHash: string): Promise<DeleteProjectResult> {
    const res = await deleteJson<RawDeleteProjectResponse>(
      `/projects/${seg(projectHash)}`
    );
    return {
      deleted_project: res.deleted_project ?? null,
      warning: res.warning ?? null,
    };
  }

  /** `GET /projects/{hash}/members` (root or an assigned admin). */
  async getProjectMembers(
    projectHash: string,
    params: ProjectMembersParams = {}
  ): Promise<ProjectMembersPage> {
    const res = await getJson<RawProjectMembersResponse>(
      `/projects/${seg(projectHash)}/members`,
      {
        limit: params.limit,
        offset: params.offset,
        user_type: params.user_type,
      }
    );
    return {
      members: res.members ?? [],
      pagination: requirePagination(res.pagination, 'project members'),
    };
  }

  /** `GET /projects/{hash}/groups` (root or an assigned admin): user groups with access. */
  async getProjectGroups(
    projectHash: string,
    params: ProjectUserGroupsParams = {}
  ): Promise<ProjectUserGroupsPage> {
    const res = await getJson<RawProjectUserGroupsResponse>(
      `/projects/${seg(projectHash)}/groups`,
      {
        limit: params.limit,
        offset: params.offset,
      }
    );
    return {
      user_groups: res.user_groups ?? [],
      pagination: requirePagination(res.pagination, 'project user groups'),
    };
  }

  /** `GET /projects/{hash}/activity`, newest first. */
  async getProjectActivity(
    projectHash: string,
    params: ProjectActivityParams = {}
  ): Promise<ProjectActivityPage> {
    const res = await getJson<RawProjectActivityResponse>(
      `/projects/${seg(projectHash)}/activity`,
      {
        limit: params.limit,
        offset: params.offset,
        days: params.days,
        activity_type: params.activity_type,
      }
    );
    return {
      activities: (res.activities ?? []).map(mapActivityRow),
      pagination: requirePagination(res.pagination, 'project activity'),
      days: res.filters?.days ?? params.days ?? 30,
    };
  }
}

export const projectService = new ProjectService();
export default projectService;
