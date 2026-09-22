import { beforeEach, describe, expect, it, vi } from 'vitest';
import { oauthService } from '../oauth.service';
import { apiClient } from '../api.client';

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

beforeEach(() => {
  vi.clearAllMocks();
  mockedApiClient.get.mockResolvedValue({ success: true, message: 'ok' });
  mockedApiClient.post.mockResolvedValue({ success: true, message: 'ok' });
  mockedApiClient.put.mockResolvedValue({ success: true, message: 'ok' });
  mockedApiClient.delete.mockResolvedValue({ success: true, message: 'ok' });
});

describe('oauthService provider catalog', () => {
  it('GETs the provider catalog', async () => {
    await oauthService.listProviders();

    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/oauth/providers');
  });

  it('PUTs a JSON catalog update for one provider type', async () => {
    await oauthService.updateProvider('google', { status: 'enabled', login_enabled: true });

    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/providers/google',
      { status: 'enabled', login_enabled: true },
    ]);
  });
});

describe('oauthService connections', () => {
  it('GETs the connections list with only the supplied filters', async () => {
    await oauthService.listConnections({
      provider_type: 'google',
      status: '',
      search: undefined,
      limit: 50,
      offset: 0,
    });

    expect(mockedApiClient.get.mock.calls[0]).toEqual([
      '/admin/oauth/connections',
      { provider_type: 'google', limit: 50, offset: 0 },
    ]);
  });

  it('POSTs a JSON body to create a connection', async () => {
    await oauthService.createConnection({
      provider_type: 'oidc',
      display_name: 'Acme Okta',
      client_id: 'client-1',
      issuer: 'https://acme.okta.com',
      restrictions: { hosted_domains: ['acme.com'] },
    });

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/connections',
      {
        provider_type: 'oidc',
        display_name: 'Acme Okta',
        client_id: 'client-1',
        issuer: 'https://acme.okta.com',
        restrictions: { hosted_domains: ['acme.com'] },
      },
    ]);
    // Secrets never travel through a URL-encoded body.
    expect(mockedApiClient.postForm.mock.calls).toHaveLength(0);
  });

  it('GETs, PUTs and DELETEs one connection by hash', async () => {
    await oauthService.getConnection('conn_1');
    await oauthService.updateConnection('conn_1', { display_name: 'Renamed' });
    await oauthService.deleteConnection('conn_1');

    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/oauth/connections/conn_1');
    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/connections/conn_1',
      { display_name: 'Renamed' },
    ]);
    expect(mockedApiClient.delete.mock.calls[0][0]).toBe('/admin/oauth/connections/conn_1');
  });

  it('POSTs the status transitions with an empty JSON body', async () => {
    await oauthService.activateConnection('conn_1');
    await oauthService.disableConnection('conn_1');

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/connections/conn_1/activate',
      {},
    ]);
    expect(mockedApiClient.post.mock.calls[1]).toEqual([
      '/admin/oauth/connections/conn_1/disable',
      {},
    ]);
  });
});

describe('oauthService credentials', () => {
  it('GETs the write-only credential status', async () => {
    await oauthService.getCredentials('conn_1');

    expect(mockedApiClient.get.mock.calls[0][0]).toBe(
      '/admin/oauth/connections/conn_1/credentials',
    );
  });

  it('PUTs credentials as JSON, never as form data', async () => {
    await oauthService.setCredentials('conn_1', { client_secret: 'secret-value' });

    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/connections/conn_1/credentials',
      { client_secret: 'secret-value' },
    ]);
    expect(mockedApiClient.putForm.mock.calls).toHaveLength(0);
    expect(mockedApiClient.postForm.mock.calls).toHaveLength(0);
  });

  it('POSTs the non-persisting credential probe as JSON', async () => {
    await oauthService.testCredentials('conn_1', { client_secret: 'secret-value' });

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/connections/conn_1/credentials/test',
      { client_secret: 'secret-value' },
    ]);
    expect(mockedApiClient.postForm.mock.calls).toHaveLength(0);
  });
});

describe('oauthService bindings, URLs and readiness', () => {
  it('lists bindings from both directions', async () => {
    await oauthService.listConnectionBindings('conn_1');
    await oauthService.listProjectBindings('proj_1');

    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/oauth/connections/conn_1/bindings');
    expect(mockedApiClient.get.mock.calls[1][0]).toBe('/admin/oauth/projects/proj_1/bindings');
  });

  it('PUTs a JSON binding upsert under the connection key', async () => {
    await oauthService.upsertBinding('proj_1', 'google', {
      connection_hash: 'conn_1',
      enabled: false,
      provisioning_mode: 'disabled',
      existing_user_policy: 'deny',
    });

    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/oauth/projects/proj_1/bindings/google',
      {
        connection_hash: 'conn_1',
        enabled: false,
        provisioning_mode: 'disabled',
        existing_user_policy: 'deny',
      },
    ]);
  });

  it('URL-encodes a free-form connection key in the path', async () => {
    await oauthService.deleteBinding('proj_1', 'acme okta/v2');

    expect(mockedApiClient.delete.mock.calls[0][0]).toBe(
      '/admin/oauth/projects/proj_1/bindings/acme%20okta%2Fv2',
    );
  });

  it('POSTs and DELETEs one allow-listed URL at a time', async () => {
    await oauthService.addBindingUrl('proj_1', 'google', {
      kind: 'redirect_uri',
      url: 'https://app.example.com/auth/callback',
    });
    await oauthService.removeBindingUrl('proj_1', 'google', 'pau-123');

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/oauth/projects/proj_1/bindings/google/urls',
      { kind: 'redirect_uri', url: 'https://app.example.com/auth/callback' },
    ]);
    expect(mockedApiClient.delete.mock.calls[0][0]).toBe(
      '/admin/oauth/projects/proj_1/bindings/google/urls/pau-123',
    );
  });

  it('GETs the project readiness roll-up', async () => {
    await oauthService.getProjectReadiness('proj_1');

    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/oauth/projects/proj_1/readiness');
  });
});
