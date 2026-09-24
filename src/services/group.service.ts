import {
  deleteJson,
  getJson,
  postFormJson,
  postJson,
  putFormJson,
  seg,
} from './request';
import type {
  AddMemberResponse,
  BulkAddMembersFailure,
  BulkAddMembersResult,
  CreateGroupResponse,
  GroupBatchResult,
  GroupFormData,
  GroupListParams,
  GroupListResponse,
  GroupMember,
  GroupMemberPage,
  ProjectGroupGrant,
  ReachableProject,
  UpdateGroupRequest,
  UpdatedGroup,
  UserGroup,
  UserGroupDetails,
  UserGroupMembership,
  UserGroupPage,
  UserGroupProjectGroupsResponse,
} from '@/types/group.types';

/** Backend cap for `GET /admin/user-groups?limit=`. */
export const USER_GROUP_LIST_MAX = 1000;
/** Backend cap for `GET /admin/user-groups/{hash}/members?limit=`. */
export const GROUP_MEMBERS_PAGE_MAX = 100;
/** Backend cap for `POST /admin/user-groups/{hash}/members/bulk`. */
export const BULK_MEMBERS_MAX = 100;

interface GroupDetailsBody {
  user_group?: UserGroup | null;
  accessible_projects?: ReachableProject[];
  accessible_project_groups?: unknown[];
  statistics?: Partial<{
    total_members: number;
    total_projects: number;
    total_project_groups: number;
  }> | null;
}

interface MembersBody {
  members?: GroupMember[];
  pagination?: { total?: number | null } | null;
  statistics?: { total_members?: number } | null;
}

interface BulkAddBody {
  summary?: {
    total_requested?: number;
    success_count?: number;
    error_count?: number;
  } | null;
  results?: Array<{
    user_hash: string;
    username?: string | null;
    status: string;
    message?: string | null;
  }>;
  errors?: string[];
}

function unexpected(what: string): Error {
  return new Error(
    `Unexpected response from the server while loading ${what}.`
  );
}

/**
 * Apply a mutation to several items one request at a time (never retried).
 * Every item is attempted; failures are collected with the backend message.
 */
export async function runGroupBatch(
  ids: string[],
  action: (id: string) => Promise<unknown>
): Promise<GroupBatchResult> {
  const result: GroupBatchResult = { succeeded: [], failures: [] };
  for (const id of ids) {
    try {
      await action(id);
      result.succeeded.push(id);
    } catch (err) {
      result.failures.push({
        id,
        message: err instanceof Error ? err.message : 'Request failed.',
      });
    }
  }
  return result;
}

/** Only send fields that carry a value: the backend treats empty as "keep current". */
function toUpdateForm(data: UpdateGroupRequest): UpdateGroupRequest {
  return {
    group_name: data.group_name?.trim() || undefined,
    description: data.description?.trim() || undefined,
  };
}

/**
 * User groups (`/admin/user-groups/*`). Writes are Form encoded except the
 * bulk member route (JSON). Requires `admin` or `manage_users`; only root may
 * change groups named `admin_*` (the backend answers 403 otherwise).
 */
class GroupService {
  // Groups ------------------------------------------------------------------

  /** Route body of the list (kept for existing callers; prefer {@link listGroups}). */
  async getGroups(params: GroupListParams = {}): Promise<GroupListResponse> {
    return await getJson<GroupListResponse>('/admin/user-groups', {
      limit: params.limit,
      offset: params.offset,
      search: params.search?.trim(),
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    });
  }

  async listGroups(params: GroupListParams = {}): Promise<UserGroupPage> {
    const res = await this.getGroups(params);
    if (!Array.isArray(res.user_groups)) throw unexpected('user groups');
    return { groups: res.user_groups, total: res.pagination?.total ?? null };
  }

  /** Every active user group, paging through the backend's 1000-row cap. */
  async listAllGroups(): Promise<UserGroup[]> {
    const all: UserGroup[] = [];
    for (let offset = 0; ; offset += USER_GROUP_LIST_MAX) {
      const page = await this.listGroups({
        limit: USER_GROUP_LIST_MAX,
        offset,
        sort_by: 'group_name',
      });
      all.push(...page.groups);
      if (page.groups.length < USER_GROUP_LIST_MAX) return all;
    }
  }

  async getGroup(groupHash: string): Promise<UserGroupDetails> {
    const res = await getJson<GroupDetailsBody>(
      `/admin/user-groups/${seg(groupHash)}`
    );
    if (!res.user_group) throw new Error('User group not found.');
    const reachableProjects = res.accessible_projects ?? [];
    const totalMembers = res.statistics?.total_members;
    if (typeof totalMembers !== 'number') throw unexpected('the user group');
    return {
      group: { ...res.user_group, member_count: totalMembers },
      statistics: {
        total_members: totalMembers,
        total_projects:
          res.statistics?.total_projects ?? reachableProjects.length,
        total_project_groups:
          res.statistics?.total_project_groups ??
          res.accessible_project_groups?.length ??
          0,
      },
      reachableProjects,
    };
  }

  /** Route body of the create call (kept for existing callers; prefer {@link createUserGroup}). */
  async createGroup(data: GroupFormData): Promise<CreateGroupResponse> {
    return await postFormJson<CreateGroupResponse>('/admin/user-groups', {
      group_name: data.group_name.trim(),
      description: data.description.trim() || undefined,
    });
  }

  async createUserGroup(data: GroupFormData): Promise<UserGroup> {
    const res = await this.createGroup(data);
    if (!res.user_group) throw unexpected('the new user group');
    return res.user_group;
  }

  async updateGroup(
    groupHash: string,
    data: UpdateGroupRequest
  ): Promise<UpdatedGroup> {
    const res = await putFormJson<{ user_group?: UpdatedGroup | null }>(
      `/admin/user-groups/${seg(groupHash)}`,
      toUpdateForm(data)
    );
    if (!res.user_group) throw unexpected('the updated user group');
    return res.user_group;
  }

  /** Soft-deletes the group, its memberships and grants; affected project sessions are revoked. */
  async deleteGroup(groupHash: string): Promise<void> {
    await deleteJson(`/admin/user-groups/${seg(groupHash)}`);
  }

  // Members -----------------------------------------------------------------

  /** Active members sorted by username. `limit` is capped at 100 by the backend. */
  async getGroupMembers(
    groupHash: string,
    params: { limit?: number; offset?: number } = {}
  ): Promise<GroupMemberPage> {
    const res = await getJson<MembersBody>(
      `/admin/user-groups/${seg(groupHash)}/members`,
      {
        limit:
          params.limit === undefined
            ? undefined
            : Math.min(params.limit, GROUP_MEMBERS_PAGE_MAX),
        offset: params.offset,
      }
    );
    if (!Array.isArray(res.members)) throw unexpected('group members');
    const total = res.pagination?.total ?? res.statistics?.total_members;
    if (typeof total !== 'number') throw unexpected('group members');
    return { members: res.members, total };
  }

  /** Idempotent: re-adding a (former) member reactivates the membership. */
  async addMemberToGroup(
    groupHash: string,
    data: { user_hash: string }
  ): Promise<AddMemberResponse> {
    return await postFormJson<AddMemberResponse>(
      `/admin/user-groups/${seg(groupHash)}/members`,
      {
        user_hash: data.user_hash,
      }
    );
  }

  /** Answers 200 even when the user wasn't a member. */
  async removeMemberFromGroup(
    groupHash: string,
    userHash: string
  ): Promise<void> {
    await deleteJson(
      `/admin/user-groups/${seg(groupHash)}/members/${seg(userHash)}`
    );
  }

  /** JSON body `{user_hashes}` (1–100). Resolves with per-user outcomes; see {@link BulkAddMembersResult}. */
  async bulkAddMembers(
    groupHash: string,
    userHashes: string[]
  ): Promise<BulkAddMembersResult> {
    if (userHashes.length === 0 || userHashes.length > BULK_MEMBERS_MAX) {
      throw new Error(`Select between 1 and ${BULK_MEMBERS_MAX} users.`);
    }
    const res = await postJson<BulkAddBody>(
      `/admin/user-groups/${seg(groupHash)}/members/bulk`,
      {
        user_hashes: userHashes,
      }
    );
    if (!res.summary || !Array.isArray(res.results))
      throw unexpected('the bulk assignment result');

    const failures: BulkAddMembersFailure[] = res.results
      .filter((row) => row.status !== 'success')
      .map((row) => ({
        user_hash: row.user_hash,
        username: row.username ?? null,
        message: row.message || 'Could not add this user.',
      }));
    // Unknown or inactive users are reported only as messages ("User not found: <hash>").
    for (const message of res.errors ?? []) {
      const userHash =
        userHashes.find((hash) => message.includes(hash)) ?? null;
      failures.push({ user_hash: userHash, username: null, message });
    }

    const succeeded =
      res.summary.success_count ??
      res.results.filter((row) => row.status === 'success').length;
    return {
      requested: res.summary.total_requested ?? userHashes.length,
      succeeded,
      failed: res.summary.error_count ?? failures.length,
      failures,
    };
  }

  /** Groups a user belongs to, sorted by name. */
  async getUserGroups(userHash: string): Promise<UserGroupMembership[]> {
    const res = await getJson<{ groups?: UserGroupMembership[] }>(
      `/admin/user-groups/users/${seg(userHash)}/groups`
    );
    if (!Array.isArray(res.groups)) throw unexpected("the user's groups");
    return res.groups;
  }

  // Project-group grants ------------------------------------------------------

  /** Route body of the grants list (kept for existing callers; prefer {@link listProjectGroupGrants}). */
  async getGroupProjectGroups(
    groupHash: string
  ): Promise<UserGroupProjectGroupsResponse> {
    return await getJson<UserGroupProjectGroupsResponse>(
      `/admin/user-groups/${seg(groupHash)}/project-groups`
    );
  }

  /** Project groups granted to the user group, sorted by name. The rows carry no project counts. */
  async listProjectGroupGrants(
    groupHash: string
  ): Promise<ProjectGroupGrant[]> {
    const res = await this.getGroupProjectGroups(groupHash);
    if (!Array.isArray(res.project_groups))
      throw unexpected('project group grants');
    return res.project_groups;
  }

  /** Idempotent: re-granting reactivates the link. */
  async grantProjectGroupAccess(
    groupHash: string,
    projectGroupHash: string
  ): Promise<void> {
    await postFormJson(`/admin/user-groups/${seg(groupHash)}/project-groups`, {
      project_group_hash: projectGroupHash,
    });
  }

  /** Members lose the project group's projects unless another grant covers them; their sessions are revoked. */
  async revokeProjectGroupAccess(
    groupHash: string,
    projectGroupHash: string
  ): Promise<void> {
    await deleteJson(
      `/admin/user-groups/${seg(groupHash)}/project-groups/${seg(projectGroupHash)}`
    );
  }
}

export const groupService = new GroupService();
export default groupService;
