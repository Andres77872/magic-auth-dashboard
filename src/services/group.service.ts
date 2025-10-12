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

  // Create new group
  async createGroup(groupData: CreateGroupRequest): Promise<CreateGroupResponse> {
    const response = await apiClient.post<CreateGroupResponse>('/admin/user-groups', groupData);
    return response as CreateGroupResponse;
  }

  // Update group
  async updateGroup(groupHash: string, data: Partial<CreateGroupRequest>): Promise<CreateGroupResponse> {
    const response = await apiClient.put<CreateGroupResponse>(`/admin/user-groups/${groupHash}`, data);
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
  ): Promise<ApiResponse<any[]>> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>(
      `/admin/user-groups/${groupHash}/members`, 
      cleanParams
    );
  }

  // Add user to group
  async addMemberToGroup(
    groupHash: string,
    memberData: AssignUserToGroupRequest
  ): Promise<AssignUserToGroupResponse> {
    const response = await apiClient.post<AssignUserToGroupResponse>(
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

  // Bulk add members to group
  async bulkAddMembers(
    groupHash: string,
    userHashes: string[]
  ): Promise<ApiResponse<{ added_count: number; errors: any[] }>> {
    return await apiClient.post<{ added_count: number; errors: any[] }>(
      `/admin/user-groups/${groupHash}/members/bulk`,
      { user_hashes: userHashes }
    );
  }

  // Get groups for a specific user
  async getUserGroups(userHash: string): Promise<ApiResponse<UserGroup[]>> {
    return await apiClient.get<UserGroup[]>(`/admin/users/${userHash}/groups`);
  }

  // Grant user group access to project
  async grantGroupProjectAccess(
    groupHash: string,
    projectHash: string
  ): Promise<ApiResponse<any>> {
    return await apiClient.post<any>(
      `/admin/user-groups/${groupHash}/projects`,
      { project_hash: projectHash }
    );
  }

  // Revoke user group access from project
  async revokeGroupProjectAccess(
    groupHash: string,
    projectHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/admin/user-groups/${groupHash}/projects/${projectHash}`
    );
  }

  // Get projects accessible by a user group
  async getGroupProjects(
    groupHash: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<any[]>> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>(
      `/admin/user-groups/${groupHash}/projects`,
      cleanParams
    );
  }
}

export const groupService = new GroupService();
export default groupService; 