import { apiClient } from './api.client';
import type {
  UserGroup,
  CreateGroupRequest,
  CreateGroupResponse,
  AssignUserToGroupRequest,
  AssignUserToGroupResponse,
  GroupListResponse,
  GroupDetailsResponse
} from '@/types/group.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

class GroupService {
  // List user groups
  async getGroups(params: PaginationParams = {}): Promise<GroupListResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<GroupListResponse>('/admin/user-groups', cleanParams);
    return response as GroupListResponse;
  }

  // Get group details
  async getGroup(groupHash: string): Promise<GroupDetailsResponse> {
    const response = await apiClient.get<GroupDetailsResponse>(`/admin/user-groups/${groupHash}`);
    return response as GroupDetailsResponse;
  }

  // Create new group - uses form data per API spec
  async createGroup(groupData: CreateGroupRequest): Promise<CreateGroupResponse> {
    const response = await apiClient.postForm<CreateGroupResponse>('/admin/user-groups', groupData);
    return response as CreateGroupResponse;
  }

  // Update group - uses form data per API spec
  async updateGroup(groupHash: string, data: Partial<CreateGroupRequest>): Promise<CreateGroupResponse> {
    const response = await apiClient.putForm<CreateGroupResponse>(`/admin/user-groups/${groupHash}`, data);
    return response as CreateGroupResponse;
  }

  // Delete group
  async deleteGroup(groupHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/admin/user-groups/${groupHash}`);
  }

  // Get group members
  async getGroupMembers(
    groupHash: string,
    params: PaginationParams = {}
  ): Promise<any> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    // The API returns members directly in the response, not wrapped in data
    return await apiClient.get<any>(
      `/admin/user-groups/${groupHash}/members`, 
      cleanParams
    );
  }

  // Add user to group - uses form data per API spec
  async addMemberToGroup(
    groupHash: string,
    memberData: AssignUserToGroupRequest
  ): Promise<AssignUserToGroupResponse> {
    const response = await apiClient.postForm<AssignUserToGroupResponse>(
      `/admin/user-groups/${groupHash}/members`,
      memberData
    );
    return response as AssignUserToGroupResponse;
  }

  // Remove user from group
  async removeMemberFromGroup(
    groupHash: string,
    userHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/admin/user-groups/${groupHash}/members/${userHash}`
    );
  }

  // Bulk add members to group - uses JSON body per API spec
  async bulkAddMembers(
    groupHash: string,
    userHashes: string[]
  ): Promise<ApiResponse<{ added_count: number; errors: any[] }>> {
    // Bulk operations use JSON body, not form data
    return await apiClient.post<{ added_count: number; errors: any[] }>(
      `/admin/user-groups/${groupHash}/members/bulk`,
      { user_hashes: userHashes }
    );
  }

  // Get groups for a specific user
  async getUserGroups(userHash: string): Promise<ApiResponse<UserGroup[]>> {
    return await apiClient.get<UserGroup[]>(`/admin/user-groups/users/${userHash}/groups`);
  }

  // Grant user group access to a project group
  async grantProjectGroupAccess(
    groupHash: string,
    projectGroupHash: string
  ): Promise<ApiResponse<any>> {
    return await apiClient.postForm<any>(
      `/admin/user-groups/${groupHash}/project-groups`,
      { project_group_hash: projectGroupHash }
    );
  }

  // Revoke user group access from a project group
  async revokeProjectGroupAccess(
    groupHash: string,
    projectGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/admin/user-groups/${groupHash}/project-groups/${projectGroupHash}`
    );
  }

  // Get project groups accessible by a user group
  async getGroupProjectGroups(
    groupHash: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<any>> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any>(
      `/admin/user-groups/${groupHash}/project-groups`,
      cleanParams
    );
  }
}

export const groupService = new GroupService();
export default groupService; 