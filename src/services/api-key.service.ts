import { deleteJson, getJson, postFormJson, putFormJson, seg } from './request';
import { asUtcTimestamp as asUtc } from '@/utils/formatters';
import type {
  ApiKey,
  ApiKeyListParams,
  ApiKeyPage,
  CreateApiKeyRequest,
  CreatedApiKey,
  RevokedApiKey,
  UpdateApiKeyRequest,
} from '@/types/api-key.types';

/**
 * Admin-managed API keys (api.auth `api_keys.py`, prefix `/api-keys`).
 *
 * Every route answers `{success, message, data}`; methods return `data`.
 * Create/update/revoke are Form-encoded and need a recent sign-in: the
 * backend answers `401 AUTH_1008` when the operator's sign-in is older than
 * the recent-auth window (5 minutes by default).
 *
 * The one-time secret (`api_key` on the create response) is passed straight
 * to the caller; nothing here logs or caches it.
 */

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

function unwrap<T>(response: Envelope<T>, what: string): T {
  if (response.data === undefined || response.data === null) {
    throw new Error(`The ${what} response did not include any data.`);
  }
  return response.data;
}

function normalizeKey<T extends ApiKey>(key: T): T {
  return {
    ...key,
    description: key.description ?? null,
    expires_at: asUtc(key.expires_at),
    last_used_at: asUtc(key.last_used_at),
    created_at: asUtc(key.created_at) ?? key.created_at,
    updated_at: asUtc(key.updated_at),
    revoked_at: asUtc(key.revoked_at),
    revoke_reason: key.revoke_reason ?? null,
    hash_algorithm: key.hash_algorithm ?? null,
  };
}

class ApiKeyService {
  /**
   * `GET /api-keys`. With `userHash` and/or `projectHash` the listing is
   * scoped to them. Without filters, root gets `400` and an admin gets the
   * keys of every project they administer (each project paged separately and
   * concatenated, so only the first page is reliable).
   */
  async listKeys(params: ApiKeyListParams = {}): Promise<ApiKeyPage> {
    const response = await getJson<Envelope<ApiKeyPage>>('/api-keys', {
      user_hash: params.userHash,
      project_hash: params.projectHash,
      active_only: params.activeOnly ? true : undefined,
      limit: params.limit,
      offset: params.offset,
    });
    const page = unwrap(response, 'API key list');
    return { ...page, keys: page.keys.map((key) => normalizeKey(key)) };
  }

  /** `GET /api-keys/{key_id}` — metadata with project and owner details. */
  async getKey(keyId: string): Promise<ApiKey> {
    const response = await getJson<Envelope<ApiKey>>(`/api-keys/${seg(keyId)}`);
    return normalizeKey(unwrap(response, 'API key'));
  }

  /** `POST /api-keys` — returns the one-time `api_key` token with the metadata. */
  async createKey(request: CreateApiKeyRequest): Promise<CreatedApiKey> {
    const response = await postFormJson<Envelope<CreatedApiKey>>(
      '/api-keys',
      request
    );
    const created = unwrap(response, 'API key creation');
    if (!created.api_key) {
      throw new Error(
        'The API key was created but its token was not returned.'
      );
    }
    return normalizeKey(created);
  }

  /** `PUT /api-keys/{key_id}` — revoked keys are refused with `400 AUTH_1012`. */
  async updateKey(
    keyId: string,
    request: UpdateApiKeyRequest
  ): Promise<ApiKey> {
    const response = await putFormJson<Envelope<ApiKey>>(
      `/api-keys/${seg(keyId)}`,
      request
    );
    return normalizeKey(unwrap(response, 'API key update'));
  }

  /** `DELETE /api-keys/{key_id}` with an optional form `revoke_reason` kept on the key. */
  async revokeKey(keyId: string, reason?: string): Promise<RevokedApiKey> {
    const trimmed = reason?.trim();
    const response = await deleteJson<Envelope<RevokedApiKey>>(
      `/api-keys/${seg(keyId)}`,
      trimmed ? { revoke_reason: trimmed } : undefined
    );
    return unwrap(response, 'API key revocation');
  }
}

export const apiKeyService = new ApiKeyService();
export default apiKeyService;
