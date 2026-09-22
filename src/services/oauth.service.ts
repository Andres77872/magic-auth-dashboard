/**
 * OAuth admin service — provider catalog (kill switch), connections (write-only
 * encrypted credentials), per-project bindings, exact-match URL allow-lists and
 * readiness, via api.auth ``/admin/oauth``.
 *
 * Conventions mirror ``billing.service.ts`` with one deliberate difference: EVERY
 * OAuth admin endpoint takes a JSON body (api.auth declares them all as
 * ``Body(...)``), so the ``*Form`` client variants are never used here — that also
 * keeps secrets out of URL-encoded request logs.
 *
 * ``admin`` may read status and manage bindings of projects they administer; every
 * route that accepts a secret, creates a connection or flips the catalog is root-only
 * server-side. The UI guards those too, but the server remains authoritative.
 */

import { apiClient } from './api.client';
import type { ApiResponse } from '@/types/api.types';
import type {
  OAuthAllowedUrlResponse,
  OAuthBindingListResponse,
  OAuthBindingResponse,
  OAuthBindingUpsertRequest,
  OAuthBindingUrlCreateRequest,
  OAuthConnectionCreateRequest,
  OAuthConnectionDeleteResponse,
  OAuthConnectionListParams,
  OAuthConnectionListResponse,
  OAuthConnectionResponse,
  OAuthConnectionUpdateRequest,
  OAuthCredentialProbeResponse,
  OAuthCredentialsRequest,
  OAuthCredentialsStatusResponse,
  OAuthProjectReadinessResponse,
  OAuthProviderCatalogUpdateRequest,
  OAuthProviderUpdateResponse,
  OAuthProvidersResponse,
} from '@/types/oauth.types';

const BASE = '/admin/oauth';

function cleanParams<T extends object>(params?: T): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
      out[key] = value as string | number;
    }
  });
  return out;
}

/** ``connection_key`` and allow-list ids are free-form slugs, so they are encoded. */
function segment(value: string): string {
  return encodeURIComponent(value);
}

class OAuthService {
  // --- provider catalog (root writes; the global kill switch) --------------------------
  async listProviders(): Promise<OAuthProvidersResponse> {
    const res = await apiClient.get<OAuthProvidersResponse>(`${BASE}/providers`);
    return res as unknown as OAuthProvidersResponse;
  }

  async updateProvider(
    providerType: string,
    data: OAuthProviderCatalogUpdateRequest,
  ): Promise<OAuthProviderUpdateResponse> {
    // `provider` is optional here, so the envelope is already assignable — no cast.
    return apiClient.put<OAuthProviderUpdateResponse>(
      `${BASE}/providers/${segment(providerType)}`,
      data,
    );
  }

  // --- connections ---------------------------------------------------------------------
  async listConnections(params: OAuthConnectionListParams = {}): Promise<OAuthConnectionListResponse> {
    const res = await apiClient.get<OAuthConnectionListResponse>(
      `${BASE}/connections`,
      cleanParams(params),
    );
    return res as unknown as OAuthConnectionListResponse;
  }

  /** Root only. The connection is created as ``draft`` — credentials come next. */
  async createConnection(data: OAuthConnectionCreateRequest): Promise<OAuthConnectionResponse> {
    const res = await apiClient.post<OAuthConnectionResponse>(`${BASE}/connections`, data);
    return res as unknown as OAuthConnectionResponse;
  }

  async getConnection(connectionHash: string): Promise<OAuthConnectionResponse> {
    const res = await apiClient.get<OAuthConnectionResponse>(`${BASE}/connections/${connectionHash}`);
    return res as unknown as OAuthConnectionResponse;
  }

  /** Root only. Namespace-affecting fields are rejected once identities are linked. */
  async updateConnection(
    connectionHash: string,
    data: OAuthConnectionUpdateRequest,
  ): Promise<OAuthConnectionResponse> {
    const res = await apiClient.put<OAuthConnectionResponse>(
      `${BASE}/connections/${connectionHash}`,
      data,
    );
    return res as unknown as OAuthConnectionResponse;
  }

  async activateConnection(connectionHash: string): Promise<OAuthConnectionResponse> {
    const res = await apiClient.post<OAuthConnectionResponse>(
      `${BASE}/connections/${connectionHash}/activate`,
      {},
    );
    return res as unknown as OAuthConnectionResponse;
  }

  async disableConnection(connectionHash: string): Promise<OAuthConnectionResponse> {
    const res = await apiClient.post<OAuthConnectionResponse>(
      `${BASE}/connections/${connectionHash}/disable`,
      {},
    );
    return res as unknown as OAuthConnectionResponse;
  }

  async deleteConnection(connectionHash: string): Promise<OAuthConnectionDeleteResponse> {
    const res = await apiClient.delete<OAuthConnectionDeleteResponse>(
      `${BASE}/connections/${connectionHash}`,
    );
    return res as unknown as OAuthConnectionDeleteResponse;
  }

  // --- credentials (root-gated, write-only; JSON so secrets stay out of form logs) -----
  async getCredentials(connectionHash: string): Promise<OAuthCredentialsStatusResponse> {
    const res = await apiClient.get<OAuthCredentialsStatusResponse>(
      `${BASE}/connections/${connectionHash}/credentials`,
    );
    return res as unknown as OAuthCredentialsStatusResponse;
  }

  /** Set or rotate. The server never echoes the value back — only a fingerprint. */
  async setCredentials(
    connectionHash: string,
    data: OAuthCredentialsRequest,
  ): Promise<OAuthCredentialsStatusResponse> {
    const res = await apiClient.put<OAuthCredentialsStatusResponse>(
      `${BASE}/connections/${connectionHash}/credentials`,
      data,
    );
    return res as unknown as OAuthCredentialsStatusResponse;
  }

  /** Non-persisting probe: adapter validation plus, for OIDC, a discovery fetch. */
  async testCredentials(
    connectionHash: string,
    data: OAuthCredentialsRequest,
  ): Promise<OAuthCredentialProbeResponse> {
    const res = await apiClient.post<OAuthCredentialProbeResponse>(
      `${BASE}/connections/${connectionHash}/credentials/test`,
      data,
    );
    return res as unknown as OAuthCredentialProbeResponse;
  }

  // --- bindings ------------------------------------------------------------------------
  async listConnectionBindings(connectionHash: string): Promise<OAuthBindingListResponse> {
    const res = await apiClient.get<OAuthBindingListResponse>(
      `${BASE}/connections/${connectionHash}/bindings`,
    );
    return res as unknown as OAuthBindingListResponse;
  }

  async listProjectBindings(projectHash: string): Promise<OAuthBindingListResponse> {
    const res = await apiClient.get<OAuthBindingListResponse>(`${BASE}/projects/${projectHash}/bindings`);
    return res as unknown as OAuthBindingListResponse;
  }

  /** Creates or updates the binding stored under ``connection_key`` for this project. */
  async upsertBinding(
    projectHash: string,
    connectionKey: string,
    data: OAuthBindingUpsertRequest,
  ): Promise<OAuthBindingResponse> {
    const res = await apiClient.put<OAuthBindingResponse>(
      `${BASE}/projects/${projectHash}/bindings/${segment(connectionKey)}`,
      data,
    );
    return res as unknown as OAuthBindingResponse;
  }

  async deleteBinding(projectHash: string, connectionKey: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      `${BASE}/projects/${projectHash}/bindings/${segment(connectionKey)}`,
    );
  }

  // --- allow-listed URLs (one row per URL; matching is exact string equality) ----------
  async addBindingUrl(
    projectHash: string,
    connectionKey: string,
    data: OAuthBindingUrlCreateRequest,
  ): Promise<OAuthAllowedUrlResponse> {
    const res = await apiClient.post<OAuthAllowedUrlResponse>(
      `${BASE}/projects/${projectHash}/bindings/${segment(connectionKey)}/urls`,
      data,
    );
    return res as unknown as OAuthAllowedUrlResponse;
  }

  async removeBindingUrl(
    projectHash: string,
    connectionKey: string,
    urlId: string,
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      `${BASE}/projects/${projectHash}/bindings/${segment(connectionKey)}/urls/${segment(urlId)}`,
    );
  }

  // --- readiness -----------------------------------------------------------------------
  /** Single answer to "why is the sign-in button not working?" for one project. */
  async getProjectReadiness(projectHash: string): Promise<OAuthProjectReadinessResponse> {
    const res = await apiClient.get<OAuthProjectReadinessResponse>(
      `${BASE}/projects/${projectHash}/readiness`,
    );
    return res as unknown as OAuthProjectReadinessResponse;
  }
}

export const oauthService = new OAuthService();
export default OAuthService;
