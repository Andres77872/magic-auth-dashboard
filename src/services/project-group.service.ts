import { deleteJson, getJson, postFormJson, putFormJson, seg } from './request';
import { groupService } from './group.service';
import type {
  AssignedProject,
  CreateProjectGroupRequest,
  CreateProjectGroupResponse,
  GroupListParams,
  ProjectAssignmentResponse,
  ProjectGroup,
  ProjectGroupDetails,
  ProjectGroupListResponse,
  ProjectGroupPage,
  UpdateGroupRequest,
  UpdatedGroup,
  UserGroup,
  UserGroupAccessResult,
  UserGroupWithAccess,
} from '@/types/group.types';

// Kept so existing `import type { ProjectGroup } from '@/services/project-group.service'` keeps working.
export type {
  AssignedProject,
  CreateProjectGroupRequest,
  CreateProjectGroupResponse,
  ProjectGroup,
  ProjectGroupListResponse,
} from '@/types/group.types';

interface ProjectGroupDetailsBody {
  project_group?: ProjectGroup | null;
  assigned_projects?: AssignedProject[];
}

/** Parallel requests used when aggregating user-group grants. */
const GRANT_LOOKUP_CONCURRENCY = 5;

function unexpected(what: string): Error {
  return new Error(
    `Unexpected response from the server while loading ${what}.`
  );
}

/**
 * Project groups (`/admin/project-groups/*`, Form encoded). Requires `admin`
 * or `manage_roles`. There is no `GET /admin/project-groups/{hash}/projects`
 * route: a group's projects come with its details.
 */
class ProjectGroupService {
  /** Route body of the list (kept for existing callers; prefer {@link listProjectGroups}). */
  async getProjectGroups(
    params: GroupListParams = {}
  ): Promise<ProjectGroupListResponse> {
    return await getJson<ProjectGroupListResponse>('/admin/project-groups', {
      limit: params.limit,
      offset: params.offset,
      search: params.search?.trim(),
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    });
  }

  async listProjectGroups(
    params: GroupListParams = {}
  ): Promise<ProjectGroupPage> {
    const res = await this.getProjectGroups(params);
    if (!Array.isArray(res.project_groups)) throw unexpected('project groups');
    const total = res.pagination?.total;
    if (typeof total !== 'number') throw unexpected('project groups');
    return { projectGroups: res.project_groups, total };
  }

  async getProjectGroup(groupHash: string): Promise<ProjectGroupDetails> {
    const res = await getJson<ProjectGroupDetailsBody>(
      `/admin/project-groups/${seg(groupHash)}`
    );
    if (!res.project_group) throw new Error('Project group not found.');
    if (!Array.isArray(res.assigned_projects))
      throw unexpected('the project group');
    return { projectGroup: res.project_group, projects: res.assigned_projects };
  }

  async createProjectGroup(
    data: CreateProjectGroupRequest
  ): Promise<ProjectGroup> {
    const res = await postFormJson<CreateProjectGroupResponse>(
      '/admin/project-groups',
      {
        group_name: data.group_name.trim(),
        description: data.description?.trim() || undefined,
      }
    );
    if (!res.project_group) throw unexpected('the new project group');
    return res.project_group;
  }

  /**
   * Empty values keep the current value (a description can't be cleared).
   * Note: api.auth currently calls `sp_update_project_group` with one argument
   * too many, so this route may fail server-side; the error is surfaced as is.
   */
  async updateProjectGroup(
    groupHash: string,
    data: UpdateGroupRequest
  ): Promise<UpdatedGroup> {
    const res = await putFormJson<{ project_group?: UpdatedGroup | null }>(
      `/admin/project-groups/${seg(groupHash)}`,
      {
        group_name: data.group_name?.trim() || undefined,
        description: data.description?.trim() || undefined,
      }
    );
    if (!res.project_group) throw unexpected('the updated project group');
    return res.project_group;
  }

  /** Soft-deletes the group, its project assignments and every user-group grant to it. Projects are untouched. */
  async deleteProjectGroup(groupHash: string): Promise<void> {
    await deleteJson(`/admin/project-groups/${seg(groupHash)}`);
  }

  /** Idempotent: re-adding reactivates the assignment. */
  async assignProjectToGroup(
    groupHash: string,
    projectHash: string
  ): Promise<ProjectAssignmentResponse> {
    return await postFormJson<ProjectAssignmentResponse>(
      `/admin/project-groups/${seg(groupHash)}/projects`,
      {
        project_hash: projectHash,
      }
    );
  }

  /** Answers 200 even when the project wasn't in the group; affected project sessions are revoked. */
  async removeProjectFromGroup(
    groupHash: string,
    projectHash: string
  ): Promise<ProjectAssignmentResponse> {
    return await deleteJson<ProjectAssignmentResponse>(
      `/admin/project-groups/${seg(groupHash)}/projects/${seg(projectHash)}`
    );
  }

  /**
   * User groups granted this project group. api.auth has no reverse lookup,
   * so every user group's grants are read (5 at a time). Groups whose grants
   * can't be read are counted in `uncheckedCount` instead of being dropped
   * silently.
   */
  async getUserGroupsForProjectGroup(
    projectGroupHash: string
  ): Promise<UserGroupAccessResult> {
    const allGroups = await groupService.listAllGroups();
    const userGroups: UserGroupWithAccess[] = [];
    let uncheckedCount = 0;

    for (let i = 0; i < allGroups.length; i += GRANT_LOOKUP_CONCURRENCY) {
      const batch = allGroups.slice(i, i + GRANT_LOOKUP_CONCURRENCY);
      const outcomes = await Promise.allSettled(
        batch.map((group) =>
          groupService.listProjectGroupGrants(group.group_hash)
        )
      );
      outcomes.forEach((outcome, index) => {
        const group: UserGroup = batch[index];
        if (outcome.status === 'rejected') {
          uncheckedCount += 1;
          return;
        }
        const grant = outcome.value.find(
          (pg) => pg.group_hash === projectGroupHash
        );
        if (grant) userGroups.push({ ...group, granted_at: grant.granted_at });
      });
    }

    return { userGroups, uncheckedCount };
  }
}

export const projectGroupService = new ProjectGroupService();
export default projectGroupService;
