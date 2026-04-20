/**
 * API Key Service
 *
 * Service for admin-managed API key operations.
 * All endpoints are under /api-keys for admin-scope management.
 * Admins create/list/revoke tokens FOR consumer users across projects.
 *
 * CRITICAL: api_key field is returned ONLY at creation.
 * Frontend must display token in one-time reveal modal.
 */

import { apiClient } from './api.client';
import type {
  ApiKeyListResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  UpdateApiKeyRequest,
  ApiKeyResponse,
  RevokeApiKeyResponse,
} from '@/types/api-key.types';

class ApiKeyService {
  private buildQuery(params?: Record<string, string | number | undefined>): string {
    if (!params) return '';
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) queryParams.set(key, String(value));
    }
    const qs = queryParams.toString();
    return qs ? `?${qs}` : '';
  }

  /**
   * List all API keys (admin scope).
   * GET /api-keys
   */
  async listKeys(params?: { limit?: number; offset?: number }): Promise<ApiKeyListResponse> {
    const url = `/api-keys${this.buildQuery(params)}`;
    const response = await apiClient.get<ApiKeyListResponse>(url);
    return response as unknown as ApiKeyListResponse;
  }

  /**
   * List keys by consumer user.
   * GET /api-keys/users/{user_hash}
   */
  async listKeysByUser(userHash: string, params?: { limit?: number; offset?: number }): Promise<ApiKeyListResponse> {
    const url = `/api-keys/users/${userHash}${this.buildQuery(params)}`;
    const response = await apiClient.get<ApiKeyListResponse>(url);
    return response as unknown as ApiKeyListResponse;
  }

  /**
   * List keys by project.
   * GET /api-keys/projects/{project_hash}
   */
  async listKeysByProject(projectHash: string, params?: { limit?: number; offset?: number }): Promise<ApiKeyListResponse> {
    const url = `/api-keys/projects/${projectHash}${this.buildQuery(params)}`;
    const response = await apiClient.get<ApiKeyListResponse>(url);
    return response as unknown as ApiKeyListResponse;
  }

  /**
   * Create new API key FOR a consumer user.
   * POST /api-keys
   *
   * CRITICAL: Returns full token ONE-TIME only.
   * Backend uses FormData, so we use postForm.
   */
  async createKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const response = await apiClient.postForm<CreateApiKeyResponse>(
      '/api-keys',
      request
    );
    return response as unknown as CreateApiKeyResponse;
  }

  /**
   * Update key metadata (name, description, expiry).
   * PUT /api-keys/{key_id}
   *
   * Backend expects FormData (Form parameters), not JSON body.
   */
  async updateKey(publicId: string, request: UpdateApiKeyRequest): Promise<ApiKeyResponse> {
    const response = await apiClient.putForm<ApiKeyResponse>(
      `/api-keys/${publicId}`,
      request
    );
    return response as unknown as ApiKeyResponse;
  }

  /**
   * Revoke key (soft delete).
   * DELETE /api-keys/{key_id}
   *
   * Backend expects optional revoke_reason as Form data, but HTTP DELETE
   * with body has poor client support. Since revoke_reason is optional and
   * never passed by the UI, we simply send DELETE without body.
   */
  async revokeKey(publicId: string): Promise<RevokeApiKeyResponse> {
    const response = await apiClient.delete<RevokeApiKeyResponse>(
      `/api-keys/${publicId}`
    );
    return { success: response.success, message: response.message };
  }

  /**
   * Get single key details.
   * GET /api-keys/{key_id}
   */
  async getKey(publicId: string): Promise<ApiKeyResponse> {
    const response = await apiClient.get<ApiKeyResponse>(
      `/api-keys/${publicId}`
    );
    return response as unknown as ApiKeyResponse;
  }
}

export const apiKeyService = new ApiKeyService();
export default apiKeyService;
