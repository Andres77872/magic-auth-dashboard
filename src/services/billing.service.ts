/**
 * Billing admin service — manages billing groups, per-account Stripe credentials,
 * group<->project membership, and the centralized catalog via api.auth ``/admin/billing``.
 *
 * Conventions mirror ``project-group.service.ts``: snake_case bodies, Form for normal
 * writes, JSON for credentials (so secrets never land in URL-encoded request logs).
 * Credentials endpoints are root-gated server-side; the UI should also guard them.
 */

import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type {
  BillingMetricsResponse,
  BillingCapabilitiesUpdateRequest,
  BillingCredentialsStatusResponse,
  BillingGroupDetailsResponse,
  BillingGroupProjectsResponse,
  BillingGroupResponse,
  CatalogImportRequest,
  CatalogImportResponse,
  CatalogItemCreateRequest,
  CatalogItemResponse,
  CatalogItemUpdateRequest,
  CatalogListResponse,
  CatalogReconcileResponse,
  CredentialValidationResponse,
  ListBillingGroupsResponse,
  BillingGroupCreateRequest,
  BillingGroupUpdateRequest,
  StripeCredentialsRequest,
} from '@/types/billing.types';

const BASE = '/admin/billing';

function cleanParams<T extends object>(params?: T): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
      out[key] = value as string | number;
    }
  });
  return out;
}

class BillingService {
  // --- metrics --------------------------------------------------------------------------
  /** Aggregate billing counts for dashboard widgets (groups/credentials/catalog/projects). */
  async getMetrics(): Promise<BillingMetricsResponse> {
    const res = await apiClient.get<BillingMetricsResponse>(`${BASE}/metrics`);
    return res as unknown as BillingMetricsResponse;
  }

  // --- groups ---------------------------------------------------------------------------
  async listGroups(params: PaginationParams & { search?: string } = {}): Promise<ListBillingGroupsResponse> {
    const res = await apiClient.get<ListBillingGroupsResponse>(BASE, cleanParams(params));
    return res as unknown as ListBillingGroupsResponse;
  }

  async getGroup(groupHash: string): Promise<BillingGroupDetailsResponse> {
    const res = await apiClient.get<BillingGroupDetailsResponse>(`${BASE}/${groupHash}`);
    return res as unknown as BillingGroupDetailsResponse;
  }

  async createGroup(data: BillingGroupCreateRequest): Promise<BillingGroupResponse> {
    const res = await apiClient.postForm<BillingGroupResponse>(BASE, data);
    return res as unknown as BillingGroupResponse;
  }

  async updateGroup(groupHash: string, data: BillingGroupUpdateRequest): Promise<BillingGroupResponse> {
    const res = await apiClient.putForm<BillingGroupResponse>(`${BASE}/${groupHash}`, data);
    return res as unknown as BillingGroupResponse;
  }

  async updateCapabilities(
    groupHash: string,
    data: BillingCapabilitiesUpdateRequest,
  ): Promise<BillingGroupResponse> {
    const res = await apiClient.put<BillingGroupResponse>(`${BASE}/${groupHash}/capabilities`, data);
    return res as unknown as BillingGroupResponse;
  }

  async deleteGroup(groupHash: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${BASE}/${groupHash}`);
  }

  // --- group <-> project membership -----------------------------------------------------
  async listGroupProjects(groupHash: string): Promise<BillingGroupProjectsResponse> {
    const res = await apiClient.get<BillingGroupProjectsResponse>(`${BASE}/${groupHash}/projects`);
    return res as unknown as BillingGroupProjectsResponse;
  }

  async attachProject(groupHash: string, projectHash: string): Promise<ApiResponse<unknown>> {
    return apiClient.postForm<unknown>(`${BASE}/${groupHash}/projects`, { project_hash: projectHash });
  }

  async detachProject(groupHash: string, projectHash: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${BASE}/${groupHash}/projects/${projectHash}`);
  }

  // --- credentials (root-gated; JSON so secrets stay out of form logs) ------------------
  async getCredentials(groupHash: string): Promise<BillingCredentialsStatusResponse> {
    const res = await apiClient.get<BillingCredentialsStatusResponse>(`${BASE}/${groupHash}/credentials`);
    return res as unknown as BillingCredentialsStatusResponse;
  }

  async setCredentials(groupHash: string, data: StripeCredentialsRequest): Promise<BillingCredentialsStatusResponse> {
    const res = await apiClient.put<BillingCredentialsStatusResponse>(`${BASE}/${groupHash}/credentials`, data);
    return res as unknown as BillingCredentialsStatusResponse;
  }

  async rotateCredentials(groupHash: string, data: StripeCredentialsRequest): Promise<BillingCredentialsStatusResponse> {
    const res = await apiClient.post<BillingCredentialsStatusResponse>(`${BASE}/${groupHash}/credentials/rotate`, data);
    return res as unknown as BillingCredentialsStatusResponse;
  }

  async testCredentials(groupHash: string, data: StripeCredentialsRequest): Promise<CredentialValidationResponse> {
    const res = await apiClient.post<CredentialValidationResponse>(`${BASE}/${groupHash}/credentials/test`, data);
    return res as unknown as CredentialValidationResponse;
  }

  // --- catalog --------------------------------------------------------------------------
  async listCatalog(
    groupHash: string,
    params: { item_type?: string; include_archived?: boolean } = {},
  ): Promise<CatalogListResponse> {
    const res = await apiClient.get<CatalogListResponse>(`${BASE}/${groupHash}/catalog`, cleanParams(params));
    return res as unknown as CatalogListResponse;
  }

  async createCatalogItem(groupHash: string, data: CatalogItemCreateRequest): Promise<CatalogItemResponse> {
    const res = await apiClient.postForm<CatalogItemResponse>(`${BASE}/${groupHash}/catalog`, data);
    return res as unknown as CatalogItemResponse;
  }

  async reconcileCatalog(groupHash: string): Promise<CatalogReconcileResponse> {
    const res = await apiClient.get<CatalogReconcileResponse>(`${BASE}/${groupHash}/catalog/reconcile`);
    return res as unknown as CatalogReconcileResponse;
  }

  async syncCatalog(groupHash: string): Promise<CatalogReconcileResponse> {
    const res = await apiClient.post<CatalogReconcileResponse>(`${BASE}/${groupHash}/catalog/sync`, {});
    return res as unknown as CatalogReconcileResponse;
  }

  async importCatalog(groupHash: string, data: CatalogImportRequest): Promise<CatalogImportResponse> {
    const res = await apiClient.post<CatalogImportResponse>(`${BASE}/${groupHash}/catalog/import`, data);
    return res as unknown as CatalogImportResponse;
  }

  async updateCatalogItem(
    groupHash: string,
    itemHash: string,
    data: CatalogItemUpdateRequest,
  ): Promise<CatalogItemResponse> {
    const res = await apiClient.putForm<CatalogItemResponse>(`${BASE}/${groupHash}/catalog/${itemHash}`, data);
    return res as unknown as CatalogItemResponse;
  }

  async archiveCatalogItem(groupHash: string, itemHash: string, archived = true): Promise<CatalogItemResponse> {
    const res = await apiClient.postForm<CatalogItemResponse>(
      `${BASE}/${groupHash}/catalog/${itemHash}/archive`,
      { archived },
    );
    return res as unknown as CatalogItemResponse;
  }

  async deleteCatalogItem(groupHash: string, itemHash: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${BASE}/${groupHash}/catalog/${itemHash}`);
  }
}

export const billingService = new BillingService();
export default BillingService;
