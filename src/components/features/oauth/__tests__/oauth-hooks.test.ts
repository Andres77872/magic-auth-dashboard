import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  useOAuthConnection,
  useProjectOAuthBindings,
} from '@/hooks/useOAuthConnections';
import { oauthService } from '@/services/oauth.service';
import { ApiError } from '@/utils/error-handler';
import type {
  OAuthBindingInfo,
  OAuthConnectionInfo,
} from '@/types/oauth.types';

vi.mock('@/services/oauth.service', () => ({
  oauthService: {
    getConnection: vi.fn(),
    listConnectionBindings: vi.fn(),
    listProjectBindings: vi.fn(),
    getProjectReadiness: vi.fn(),
    upsertBinding: vi.fn(),
    activateConnection: vi.fn(),
    deleteConnection: vi.fn(),
  },
}));
vi.mock('@/services/project.service', () => ({
  projectService: { getProjectGroups: vi.fn() },
}));

const service = vi.mocked(oauthService);

function connection(hash: string, name = 'Acme Google'): OAuthConnectionInfo {
  return {
    connection_hash: hash,
    provider_type: 'google',
    display_name: name,
    status: 'draft',
    tenant_endpoints_allowed: false,
    binding_count: 0,
    linked_identity_count: 0,
    namespace_locked: false,
    credentials: {
      credential_status: 'active',
      has_client_secret: true,
      has_signing_key: false,
    },
  };
}

function binding(overrides: Partial<OAuthBindingInfo>): OAuthBindingInfo {
  return {
    connection_key: 'google',
    connection_hash: 'OTHER',
    provider_type: 'google',
    connection_display_name: 'Other Google',
    connection_status: 'active',
    credential_status: 'active',
    project_hash: 'proj-1',
    enabled: true,
    login_enabled: true,
    link_enabled: true,
    provisioning_mode: 'disabled',
    existing_user_policy: 'deny',
    init_mode: 'api',
    has_legacy_redeem: false,
    delivery_mode: 'bff',
    urls: [],
    ready: true,
    readiness: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  service.getConnection.mockImplementation((hash) =>
    Promise.resolve(connection(hash))
  );
  service.listConnectionBindings.mockResolvedValue([]);
  service.getProjectReadiness.mockResolvedValue({
    oauth_enabled: true,
    providers: [],
  });
  service.upsertBinding.mockResolvedValue(binding({}));
});

describe('useOAuthConnection.assignProject', () => {
  it('refuses to re-point a binding already stored under the key', async () => {
    service.listProjectBindings.mockResolvedValue([
      binding({ connection_key: 'google', connection_hash: 'OTHER' }),
    ]);
    const { result } = renderHook(() => useOAuthConnection('CONN'));
    await waitFor(() => expect(result.current.connection).not.toBeNull());

    const error = await result.current
      .assignProject('proj-1', 'Google')
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect(service.upsertBinding.mock.calls).toHaveLength(0);
  });

  it('reports a project that already uses this connection under another key', async () => {
    service.listProjectBindings.mockResolvedValue([
      binding({ connection_key: 'acme', connection_hash: 'CONN' }),
    ]);
    const { result } = renderHook(() => useOAuthConnection('CONN'));
    await waitFor(() => expect(result.current.connection).not.toBeNull());

    await expect(
      result.current.assignProject('proj-1', 'google')
    ).rejects.toThrow(/under the key "acme"/);
    expect(service.upsertBinding.mock.calls).toHaveLength(0);
  });

  it('creates the binding with only the connection so api.auth applies its safe defaults', async () => {
    service.listProjectBindings.mockResolvedValue([
      binding({ connection_key: 'github', connection_hash: 'GH' }),
    ]);
    const { result } = renderHook(() => useOAuthConnection('CONN'));
    await waitFor(() => expect(result.current.connection).not.toBeNull());

    await result.current.assignProject('proj-1', ' Google ');

    expect(service.upsertBinding.mock.calls).toEqual([
      ['proj-1', 'google', { connection_hash: 'CONN' }],
    ]);
  });
});

describe('useOAuthConnection mutations', () => {
  it('refetches after a status change and resolves only afterwards', async () => {
    service.activateConnection.mockResolvedValue({
      ...connection('CONN'),
      status: 'active',
    });
    const { result } = renderHook(() => useOAuthConnection('CONN'));
    await waitFor(() => expect(result.current.connection).not.toBeNull());
    service.getConnection.mockResolvedValue({
      ...connection('CONN'),
      status: 'active',
    });

    await act(() => result.current.activateConnection());

    expect(service.activateConnection.mock.calls).toEqual([['CONN']]);
    expect(service.getConnection.mock.calls).toHaveLength(2);
    expect(result.current.connection?.status).toBe('active');
  });

  it('does not refetch a connection that was deleted', async () => {
    service.deleteConnection.mockResolvedValue('deleted');
    const { result } = renderHook(() => useOAuthConnection('CONN'));
    await waitFor(() => expect(result.current.connection).not.toBeNull());

    await expect(act(() => result.current.deleteConnection())).resolves.toBe(
      'deleted'
    );
    expect(service.getConnection.mock.calls).toHaveLength(1);
  });

  it('never exposes the previous connection after the route parameter changed', async () => {
    const { result, rerender } = renderHook(
      ({ hash }) => useOAuthConnection(hash),
      {
        initialProps: { hash: 'FIRST' },
      }
    );
    await waitFor(() =>
      expect(result.current.connection?.connection_hash).toBe('FIRST')
    );

    let release: (value: OAuthConnectionInfo) => void = () => undefined;
    service.getConnection.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        })
    );
    rerender({ hash: 'SECOND' });

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.connection).toBeNull();

    act(() => release(connection('SECOND', 'Second')));
    await waitFor(() =>
      expect(result.current.connection?.display_name).toBe('Second')
    );
  });
});

describe('useProjectOAuthBindings', () => {
  it('reads the deployment switch and checks the key before enabling a connection', async () => {
    service.listProjectBindings.mockResolvedValue([
      binding({ connection_key: 'google' }),
    ]);
    service.getProjectReadiness.mockResolvedValue({
      oauth_enabled: false,
      providers: [],
    });
    const { result } = renderHook(() => useProjectOAuthBindings('proj-1'));
    await waitFor(() => expect(result.current.oauthEnabled).toBe(false));

    await expect(
      result.current.enableConnection('NEW', 'google')
    ).rejects.toBeInstanceOf(ApiError);
    expect(service.upsertBinding.mock.calls).toHaveLength(0);

    await act(() => result.current.enableConnection('NEW', 'google-2'));
    expect(service.upsertBinding.mock.calls).toEqual([
      ['proj-1', 'google-2', { connection_hash: 'NEW' }],
    ]);
  });
});
