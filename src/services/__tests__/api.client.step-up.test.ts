import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api.client';
import { ApiError } from '@/utils/error-handler';

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const fetchMock = vi.fn<typeof fetch>();
const unauthorized = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  unauthorized.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  window.addEventListener('magic-auth-unauthorized', unauthorized);
});

afterEach(() => {
  window.removeEventListener('magic-auth-unauthorized', unauthorized);
  vi.unstubAllGlobals();
});

const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;
const calledPaths = (): string[] =>
  fetchMock.mock.calls.map(([input]) => new URL(urlOf(input)).pathname);

describe('step-up 401s keep the operator signed in', () => {
  it('surfaces "recent sign-in required" without refreshing or signing out', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          error: {
            code: 'AUTH_1008',
            message: 'Recent authentication required',
          },
        },
        401
      )
    );

    const error = await apiClient
      .putForm('/api-keys/pk_1', { name: 'CI' })
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 401,
      code: 'AUTH_1008',
      message: 'Recent authentication required',
    });
    expect(calledPaths()).toEqual(['/api-keys/pk_1']);
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('treats a wrong current password on password change as a form error', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          error: {
            code: 'AUTH_1001',
            message: 'Current password is incorrect',
          },
        },
        401
      )
    );

    await expect(
      apiClient.post('/auth/password/change', {
        current_password: 'x',
        new_password: 'y',
      })
    ).rejects.toMatchObject({
      status: 401,
      code: 'AUTH_1001',
    });
    expect(calledPaths()).toEqual(['/auth/password/change']);
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('still tries to refresh for an ordinary expired session', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          error: { code: 'AUTH_1001', message: 'Not authenticated' },
        },
        401
      )
    );

    await expect(apiClient.get('/users/list')).rejects.toThrow();
    expect(calledPaths()).toContain('/auth/refresh');
  });
});

describe('postBlob errors', () => {
  it('reads the backend error envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          status: 'error',
          error: { code: 'VAL_3001', message: 'limit must be 10000 or less' },
        },
        400
      )
    );

    const error = await apiClient
      .postBlob('/admin/audit/export', { source: 'activity' })
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VAL_3001',
      message: 'limit must be 10000 or less',
    });
  });
});

describe('request bodies', () => {
  it('sends an optional form body on DELETE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }, 200));
    await apiClient.delete('/api-keys/pk_1', {
      revoke_reason: 'Leaked in CI logs',
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.method).toBe('DELETE');
    expect((init?.body as URLSearchParams).toString()).toBe(
      'revoke_reason=Leaked+in+CI+logs'
    );
  });

  it('sends no body on a plain DELETE', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }, 200));
    await apiClient.delete('/users/usr-1');
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
  });

  it('keeps null (clear this field) but drops undefined in JSON bodies', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true }, 200));
    await apiClient.put('/admin/oauth/projects/p1/bindings/google', {
      default_user_group_hash: null,
      label: undefined,
      enabled: false,
    });

    const body = JSON.parse(
      fetchMock.mock.calls[0][1]?.body as string
    ) as Record<string, unknown>;
    expect(body).toEqual({ default_user_group_hash: null, enabled: false });
  });
});
