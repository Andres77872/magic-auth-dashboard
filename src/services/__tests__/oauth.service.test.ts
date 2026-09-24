import { beforeEach, describe, expect, it, vi } from 'vitest';
import { oauthService } from '../oauth.service';
import { apiClient } from '../api.client';
import type { ApiResponse } from '@/types/api.types';
import type {
  OAuthBindingInfo,
  OAuthConnectionInfo,
} from '@/types/oauth.types';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    postForm: vi.fn(),
    putForm: vi.fn(),
    patchForm: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

/** The transport resolves with the raw JSON body; tests hand it route-shaped payloads. */
function respond(
  method: 'get' | 'post' | 'put' | 'delete',
  body: Record<string, unknown>
): void {
  const response: ApiResponse = { success: true, message: 'ok', ...body };
  mockedApiClient[method].mockResolvedValueOnce(response);
}

const CONNECTION: OAuthConnectionInfo = {
  connection_hash: 'ABC123',
  provider_type: 'google',
  display_name: 'Acme Google',
  status: 'draft',
  tenant_endpoints_allowed: false,
  binding_count: 0,
  linked_identity_count: 0,
  namespace_locked: false,
  credentials: {
    credential_status: 'absent',
    has_client_secret: false,
    has_signing_key: false,
  },
};

const BINDING: OAuthBindingInfo = {
  connection_key: 'google',
  connection_hash: 'ABC123',
  provider_type: 'google',
  connection_display_name: 'Acme Google',
  connection_status: 'active',
  credential_status: 'active',
  project_hash: 'proj-1',
  enabled: false,
  login_enabled: true,
  link_enabled: true,
  provisioning_mode: 'disabled',
  existing_user_policy: 'deny',
  init_mode: 'api',
  has_legacy_redeem: false,
  delivery_mode: 'bff',
  urls: [],
  ready: false,
  readiness: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('oauthService provider catalog', () => {
  it('returns the catalog payload with the deployment switch', async () => {
    respond('get', { success: true, oauth_enabled: false, providers: [] });

    await expect(oauthService.listProviders()).resolves.toEqual({
      oauth_enabled: false,
      providers: [],
    });
    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/oauth/providers');
  });

  it('reports a catalog response without its payload instead of defaulting it', async () => {
    respond('get', { success: true });

    await expect(oauthService.listProviders()).rejects.toThrow(
      /not in the expected format/
    );
  });

  it('PUTs a JSON catalog update for one provider type', async () => {
    respond('put', { success: true, provider: {} });

    await oauthService.updateProvider('google', {
      status: 'enabled',
      login_enabled: true,
    });

    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/providers/google',
      { status: 'enabled', login_enabled: true },
    ]);
  });
});

describe('oauthService connections', () => {
  it('GETs the list with only the supplied filters and returns connections plus pagination', async () => {
    const pagination = { limit: 25, offset: 0, total: 0, has_more: false };
    respond('get', { success: true, connections: [], pagination });

    const page = await oauthService.listConnections({
      provider_type: 'google',
      status: undefined,
      search: '  ',
      limit: 25,
      offset: 0,
    });

    expect(page).toEqual({ connections: [], pagination });
    expect(mockedApiClient.get.mock.calls[0]).toEqual([
      '/admin/oauth/connections',
      { provider_type: 'google', limit: 25, offset: 0 },
    ]);
  });

  it('POSTs a JSON body to create a connection and returns the connection', async () => {
    respond('post', { success: true, connection: CONNECTION });

    const created = await oauthService.createConnection({
      provider_type: 'oidc',
      display_name: 'Acme Okta',
      client_id: 'client-1',
      issuer: 'https://acme.okta.com',
    });

    expect(created).toEqual(CONNECTION);
    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/connections',
      {
        provider_type: 'oidc',
        display_name: 'Acme Okta',
        client_id: 'client-1',
        issuer: 'https://acme.okta.com',
      },
    ]);
    expect(mockedApiClient.postForm.mock.calls).toHaveLength(0);
  });

  it('encodes the connection hash in every connection path', async () => {
    respond('get', { success: true, connection: CONNECTION });
    respond('put', { success: true, connection: CONNECTION });
    respond('delete', { success: true, outcome: 'deleted' });

    await oauthService.getConnection('a/b c');
    await oauthService.updateConnection('a/b c', { display_name: 'Renamed' });
    await oauthService.deleteConnection('a/b c');

    expect(mockedApiClient.get.mock.calls[0][0]).toBe(
      '/admin/oauth/connections/a%2Fb%20c'
    );
    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/connections/a%2Fb%20c',
      { display_name: 'Renamed' },
    ]);
    expect(mockedApiClient.delete.mock.calls[0][0]).toBe(
      '/admin/oauth/connections/a%2Fb%20c'
    );
  });

  it('POSTs the status transitions without a body', async () => {
    respond('post', {
      success: true,
      connection: { ...CONNECTION, status: 'active' },
    });
    respond('post', {
      success: true,
      connection: { ...CONNECTION, status: 'disabled' },
    });

    await expect(
      oauthService.activateConnection('ABC123')
    ).resolves.toMatchObject({ status: 'active' });
    await expect(
      oauthService.disableConnection('ABC123')
    ).resolves.toMatchObject({ status: 'disabled' });

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/connections/ABC123/activate',
      undefined,
    ]);
    expect(mockedApiClient.post.mock.calls[1]).toEqual([
      '/admin/oauth/connections/ABC123/disable',
      undefined,
    ]);
  });

  it('returns the delete outcome, including archived connections', async () => {
    respond('delete', { success: true, outcome: 'archived' });
    respond('delete', { success: true, outcome: 'deleted' });

    await expect(oauthService.deleteConnection('ABC123')).resolves.toBe(
      'archived'
    );
    await expect(oauthService.deleteConnection('ABC123')).resolves.toBe(
      'deleted'
    );
  });
});

describe('oauthService credentials', () => {
  it('PUTs credentials as JSON, never as form data, and returns the status', async () => {
    respond('put', {
      success: true,
      credentials: {
        credential_status: 'active',
        has_client_secret: true,
        has_signing_key: false,
      },
    });

    const status = await oauthService.setCredentials('ABC123', {
      client_secret: 'secret-value',
    });

    expect(status.credential_status).toBe('active');
    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/connections/ABC123/credentials',
      { client_secret: 'secret-value' },
    ]);
    expect(mockedApiClient.putForm.mock.calls).toHaveLength(0);
    expect(mockedApiClient.postForm.mock.calls).toHaveLength(0);
  });

  it('always sends a JSON object to the credential probe (the body is required)', async () => {
    respond('post', { success: true, result: { valid: true, problems: [] } });
    respond('post', {
      success: true,
      result: { valid: false, problems: ['issuer is required'] },
    });

    await oauthService.testCredentials('ABC123', {
      client_secret: 'secret-value',
    });
    const result = await oauthService.testCredentials('ABC123');

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/connections/ABC123/credentials/test',
      { client_secret: 'secret-value' },
    ]);
    expect(mockedApiClient.post.mock.calls[1]).toEqual([
      '/admin/oauth/connections/ABC123/credentials/test',
      { client_secret: undefined },
    ]);
    expect(result).toEqual({ valid: false, problems: ['issuer is required'] });
  });
});

describe('oauthService bindings, URLs and readiness', () => {
  it('lists bindings from both directions', async () => {
    respond('get', { success: true, bindings: [BINDING] });
    respond('get', { success: true, bindings: [] });

    await expect(
      oauthService.listConnectionBindings('ABC123')
    ).resolves.toEqual([BINDING]);
    await expect(oauthService.listProjectBindings('proj-1')).resolves.toEqual(
      []
    );

    expect(mockedApiClient.get.mock.calls[0][0]).toBe(
      '/admin/oauth/connections/ABC123/bindings'
    );
    expect(mockedApiClient.get.mock.calls[1][0]).toBe(
      '/admin/oauth/projects/proj-1/bindings'
    );
  });

  it('PUTs a JSON binding upsert under the connection key and returns the binding', async () => {
    respond('put', { success: true, binding: BINDING });

    const binding = await oauthService.upsertBinding('proj-1', 'google', {
      connection_hash: 'ABC123',
    });

    expect(binding).toEqual(BINDING);
    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/projects/proj-1/bindings/google',
      { connection_hash: 'ABC123' },
    ]);
  });

  it('URL-encodes free-form keys and URL ids in the path', async () => {
    respond('delete', { success: true });
    respond('delete', { success: true });

    await oauthService.deleteBinding('proj-1', 'acme okta/v2');
    await oauthService.removeBindingUrl('proj-1', 'google', 'pau/1');

    expect(mockedApiClient.delete.mock.calls[0][0]).toBe(
      '/admin/oauth/projects/proj-1/bindings/acme%20okta%2Fv2'
    );
    expect(mockedApiClient.delete.mock.calls[1][0]).toBe(
      '/admin/oauth/projects/proj-1/bindings/google/urls/pau%2F1'
    );
  });

  it('POSTs one allow-listed URL at a time and returns the stored row', async () => {
    const row = {
      id: 'pau-1',
      kind: 'redirect_uri',
      url: 'https://app.example.com/auth/callback',
    };
    respond('post', { success: true, url: row });

    await expect(
      oauthService.addBindingUrl('proj-1', 'google', {
        kind: 'redirect_uri',
        url: row.url,
      })
    ).resolves.toEqual(row);
    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/projects/proj-1/bindings/google/urls',
      { kind: 'redirect_uri', url: row.url },
    ]);
  });

  it('GETs the project readiness roll-up', async () => {
    respond('get', { success: true, oauth_enabled: true, providers: [] });

    await expect(oauthService.getProjectReadiness('proj-1')).resolves.toEqual({
      oauth_enabled: true,
      providers: [],
    });
    expect(mockedApiClient.get.mock.calls[0][0]).toBe(
      '/admin/oauth/projects/proj-1/readiness'
    );
  });

  it('rejects a binding write whose response lacks the binding', async () => {
    respond('put', { success: true });

    await expect(
      oauthService.upsertBinding('proj-1', 'google', {
        connection_hash: 'ABC123',
      })
    ).rejects.toThrow(/not in the expected format/);
  });
});
