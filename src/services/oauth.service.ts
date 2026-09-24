/**
 * OAuth admin service — provider catalog (kill switch), connections (write-only
 * encrypted credentials), per-project bindings, exact-match URL allow-lists and
 * readiness, via api.auth ``/admin/oauth`` (``src/routes/admin_oauth.py``).
 *
 * Every OAuth admin endpoint takes a JSON body (api.auth declares them all as
 * ``Body(...)``), which also keeps secrets out of URL-encoded request logs. Methods
 * return payloads, not envelopes; a response without its payload key is reported as an
 * error rather than papered over with a default.
 *
 * Reads are admin-level; every route that accepts a secret, creates or changes a
 * connection or flips the catalog is root-only server-side. Project bindings, their
 * URLs and readiness are scoped to projects the caller administers.
 */

import { deleteJson, getJson, postJson, putJson, seg } from './request';
import type { PaginationResponse } from '@/types/api.types';
import type {
  OAuthAllowedUrl,
  OAuthBindingInfo,
  OAuthBindingUpsertRequest,
  OAuthBindingUrlCreateRequest,
  OAuthConnectionCreateRequest,
  OAuthConnectionDeleteOutcome,
  OAuthConnectionInfo,
  OAuthConnectionListItem,
  OAuthConnectionListParams,
  OAuthConnectionPage,
  OAuthConnectionUpdateRequest,
  OAuthCredentialProbeRequest,
  OAuthCredentialProbeResult,
  OAuthCredentialsRequest,
  OAuthCredentialsStatus,
  OAuthProjectReadiness,
  OAuthProjectReadinessEntry,
  OAuthProviderCatalog,
  OAuthProviderCatalogEntry,
  OAuthProviderCatalogUpdateRequest,
} from '@/types/oauth.types';

const BASE = '/admin/oauth';

function unexpected(what: string): Error {
  return new Error(`The ${what} response was not in the expected format.`);
}

function requireValue<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) throw unexpected(what);
  return value;
}

function requireList<T>(value: T[] | null | undefined, what: string): T[] {
  if (!Array.isArray(value)) throw unexpected(what);
  return value;
}

function requireFlag(value: boolean | null | undefined, what: string): boolean {
  if (typeof value !== 'boolean') throw unexpected(what);
  return value;
}

const connectionPath = (connectionHash: string): string =>
  `${BASE}/connections/${seg(connectionHash)}`;
const bindingPath = (projectHash: string, connectionKey: string): string =>
  `${BASE}/projects/${seg(projectHash)}/bindings/${seg(connectionKey)}`;

class OAuthService {
  // --- provider catalog (root writes; the global kill switch) --------------------------

  /** ``GET /providers`` (admin). */
  async listProviders(): Promise<OAuthProviderCatalog> {
    const res = await getJson<{
      oauth_enabled?: boolean;
      providers?: OAuthProviderCatalogEntry[];
    }>(`${BASE}/providers`);
    return {
      oauth_enabled: requireFlag(res.oauth_enabled, 'OAuth provider catalog'),
      providers: requireList(res.providers, 'OAuth provider catalog'),
    };
  }

  /**
   * ``PUT /providers/{type}`` (root). The response echoes the raw catalog row rather
   * than the catalog DTO, so callers refetch the catalog instead of reading it.
   */
  async updateProvider(
    providerType: string,
    data: OAuthProviderCatalogUpdateRequest
  ): Promise<void> {
    await putJson(`${BASE}/providers/${seg(providerType)}`, data);
  }

  // --- connections ---------------------------------------------------------------------

  /** ``GET /connections`` (admin; admins only see shared connections and their projects'). */
  async listConnections(
    params: OAuthConnectionListParams = {}
  ): Promise<OAuthConnectionPage> {
    const res = await getJson<{
      connections?: OAuthConnectionListItem[];
      pagination?: PaginationResponse;
    }>(`${BASE}/connections`, {
      provider_type: params.provider_type,
      status: params.status,
      search: params.search?.trim(),
      limit: params.limit,
      offset: params.offset,
    });
    return {
      connections: requireList(res.connections, 'OAuth connections'),
      pagination: requireValue(res.pagination, 'OAuth connections'),
    };
  }

  /** ``POST /connections`` (root). The connection is created as ``draft`` — credentials come next. */
  async createConnection(
    data: OAuthConnectionCreateRequest
  ): Promise<OAuthConnectionInfo> {
    const res = await postJson<{ connection?: OAuthConnectionInfo }>(
      `${BASE}/connections`,
      data
    );
    return requireValue(res.connection, 'OAuth connection');
  }

  /** ``GET /connections/{hash}`` (admin). ``403`` for another project's connection. */
  async getConnection(connectionHash: string): Promise<OAuthConnectionInfo> {
    const res = await getJson<{ connection?: OAuthConnectionInfo }>(
      connectionPath(connectionHash)
    );
    return requireValue(res.connection, 'OAuth connection');
  }

  /** ``PUT /connections/{hash}`` (root). ``409`` when a locked identity namespace would move. */
  async updateConnection(
    connectionHash: string,
    data: OAuthConnectionUpdateRequest
  ): Promise<OAuthConnectionInfo> {
    const res = await putJson<{ connection?: OAuthConnectionInfo }>(
      connectionPath(connectionHash),
      data
    );
    return requireValue(res.connection, 'OAuth connection');
  }

  /** ``POST /connections/{hash}/activate`` (root, no body). ``400`` until credentials are active. */
  async activateConnection(
    connectionHash: string
  ): Promise<OAuthConnectionInfo> {
    const res = await postJson<{ connection?: OAuthConnectionInfo }>(
      `${connectionPath(connectionHash)}/activate`
    );
    return requireValue(res.connection, 'OAuth connection');
  }

  /** ``POST /connections/{hash}/disable`` (root, no body). Credentials and bindings are kept. */
  async disableConnection(
    connectionHash: string
  ): Promise<OAuthConnectionInfo> {
    const res = await postJson<{ connection?: OAuthConnectionInfo }>(
      `${connectionPath(connectionHash)}/disable`
    );
    return requireValue(res.connection, 'OAuth connection');
  }

  /**
   * ``DELETE /connections/{hash}`` (root). ``409`` while any project binding uses it.
   * The backend itself defaults the outcome to ``deleted``.
   */
  async deleteConnection(
    connectionHash: string
  ): Promise<OAuthConnectionDeleteOutcome> {
    const res = await deleteJson<{ outcome?: string }>(
      connectionPath(connectionHash)
    );
    return res.outcome === 'archived' ? 'archived' : 'deleted';
  }

  // --- credentials (root, write-only; JSON so secrets stay out of form logs) -----------

  /** ``PUT /connections/{hash}/credentials``. The server never echoes the value — only a fingerprint. */
  async setCredentials(
    connectionHash: string,
    data: OAuthCredentialsRequest
  ): Promise<OAuthCredentialsStatus> {
    const res = await putJson<{ credentials?: OAuthCredentialsStatus }>(
      `${connectionPath(connectionHash)}/credentials`,
      data
    );
    return requireValue(res.credentials, 'OAuth credentials');
  }

  /**
   * ``POST /connections/{hash}/credentials/test``: validates the STORED configuration and
   * fingerprints a candidate secret without saving anything. The body is required, so an
   * empty probe still sends ``{}``.
   */
  async testCredentials(
    connectionHash: string,
    data: OAuthCredentialProbeRequest = {}
  ): Promise<OAuthCredentialProbeResult> {
    const res = await postJson<{ result?: OAuthCredentialProbeResult }>(
      `${connectionPath(connectionHash)}/credentials/test`,
      { client_secret: data.client_secret }
    );
    return requireValue(res.result, 'OAuth credential test');
  }

  // --- bindings ------------------------------------------------------------------------

  /** ``GET /connections/{hash}/bindings`` (admin; admins only see their projects' bindings). */
  async listConnectionBindings(
    connectionHash: string
  ): Promise<OAuthBindingInfo[]> {
    const res = await getJson<{ bindings?: OAuthBindingInfo[] }>(
      `${connectionPath(connectionHash)}/bindings`
    );
    return requireList(res.bindings, 'OAuth bindings');
  }

  /** ``GET /projects/{hash}/bindings`` (root or an admin of the project). */
  async listProjectBindings(projectHash: string): Promise<OAuthBindingInfo[]> {
    const res = await getJson<{ bindings?: OAuthBindingInfo[] }>(
      `${BASE}/projects/${seg(projectHash)}/bindings`
    );
    return requireList(res.bindings, 'OAuth bindings');
  }

  /**
   * ``PUT /projects/{hash}/bindings/{key}``: creates the binding, or UPDATES the one already
   * stored under that key (re-pointing it at ``connection_hash``). ``409`` when the
   * connection is already bound to the project under another key.
   */
  async upsertBinding(
    projectHash: string,
    connectionKey: string,
    data: OAuthBindingUpsertRequest
  ): Promise<OAuthBindingInfo> {
    const res = await putJson<{ binding?: OAuthBindingInfo }>(
      bindingPath(projectHash, connectionKey),
      data
    );
    return requireValue(res.binding, 'OAuth binding');
  }

  /** ``DELETE /projects/{hash}/bindings/{key}``: removes the binding and its URLs; the connection stays. */
  async deleteBinding(
    projectHash: string,
    connectionKey: string
  ): Promise<void> {
    await deleteJson(bindingPath(projectHash, connectionKey));
  }

  // --- allow-listed URLs (one row per URL; matching is exact string equality) ----------

  /** ``POST .../urls``. Adding a URL that is already listed returns the existing row. */
  async addBindingUrl(
    projectHash: string,
    connectionKey: string,
    data: OAuthBindingUrlCreateRequest
  ): Promise<OAuthAllowedUrl> {
    const res = await postJson<{ url?: OAuthAllowedUrl }>(
      `${bindingPath(projectHash, connectionKey)}/urls`,
      data
    );
    return requireValue(res.url, 'OAuth allowed URL');
  }

  async removeBindingUrl(
    projectHash: string,
    connectionKey: string,
    urlId: string
  ): Promise<void> {
    await deleteJson(
      `${bindingPath(projectHash, connectionKey)}/urls/${seg(urlId)}`
    );
  }

  // --- readiness -----------------------------------------------------------------------

  /** ``GET /projects/{hash}/readiness``: per-binding checks plus the deployment switch. */
  async getProjectReadiness(
    projectHash: string
  ): Promise<OAuthProjectReadiness> {
    const res = await getJson<{
      oauth_enabled?: boolean;
      providers?: OAuthProjectReadinessEntry[];
    }>(`${BASE}/projects/${seg(projectHash)}/readiness`);
    return {
      oauth_enabled: requireFlag(res.oauth_enabled, 'OAuth readiness'),
      providers: requireList(res.providers, 'OAuth readiness'),
    };
  }
}

export const oauthService = new OAuthService();
export default OAuthService;
