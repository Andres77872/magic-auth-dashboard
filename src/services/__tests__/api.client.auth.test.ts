import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api.client';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

const refreshResponse = (): {
  success: boolean;
  message: string;
  expires_at: string;
  refresh_expires_at: string;
  remember_me: boolean;
} => ({
  success: true,
  message: 'refreshed',
  expires_at: '2026-07-11T20:15:00Z',
  refresh_expires_at: '2026-08-10T20:00:00Z',
  remember_me: true,
});

const validationResponse = (): {
  success: boolean;
  message: string;
  valid: boolean;
  user: { user_hash: string; username: string; user_type: string };
  session: {
    expires_at: string;
    refresh_expires_at: string;
    remember_me: boolean;
  };
} => ({
  success: true,
  message: 'valid',
  valid: true,
  user: { user_hash: 'user-1', username: 'admin', user_type: 'admin' },
  session: {
    expires_at: '2026-07-11T20:15:00Z',
    refresh_expires_at: '2026-08-10T20:00:00Z',
    remember_me: true,
  },
});

describe('apiClient cookie-backed auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('includes credentials and refreshes once before retrying a protected 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'expired' }, 401)
      )
      .mockResolvedValueOnce(
        jsonResponse(refreshResponse())
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, message: 'ok', data: { ok: true } })
      );

    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('magic_auth_token', 'stale-token');

    const response = await apiClient.get<{ ok: boolean }>('/protected');

    expect(response.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/auth/refresh');

    for (const call of fetchMock.mock.calls) {
      const init = call[1] as RequestInit;
      expect(init.credentials).toBe('include');
      expect(
        (init.headers as Record<string, string>).Authorization
      ).toBeUndefined();
    }
  });

  it('shares one refresh between concurrent protected 401 responses', async () => {
    let sessionRefreshed = false;
    let finishRefresh = (): void => undefined;
    const refreshGate = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = requestUrl(input);

        if (url.includes('/auth/refresh')) {
          await refreshGate;
          sessionRefreshed = true;
          return jsonResponse(refreshResponse());
        }

        if (!sessionRefreshed) {
          return jsonResponse({ success: false, message: 'expired' }, 401);
        }

        return jsonResponse({
          success: true,
          message: 'ok',
          data: { ok: true },
        });
      }
    );
    vi.stubGlobal('fetch', fetchMock);

    const first = apiClient.get<{ ok: boolean }>('/protected/first');
    const second = apiClient.get<{ ok: boolean }>('/protected/second');

    await vi.waitFor(() => {
      expect(
        fetchMock.mock.calls.filter(([input]) =>
          requestUrl(input).includes('/auth/refresh')
        )
      ).toHaveLength(1);
    });
    finishRefresh();

    const responses = await Promise.all([first, second]);
    expect(responses.every((response) => response.success)).toBe(true);
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        requestUrl(input).includes('/auth/refresh')
      )
    ).toHaveLength(1);
  });

  it('serializes project switching behind an in-flight refresh rotation', async () => {
    let sessionRefreshed = false;
    let finishRefresh = (): void => undefined;
    const refreshGate = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = requestUrl(input);
        if (url.includes('/auth/refresh')) {
          await refreshGate;
          sessionRefreshed = true;
          return jsonResponse(refreshResponse());
        }
        if (url.includes('/auth/switch-project')) {
          return jsonResponse({
            ...refreshResponse(),
            message: 'switched',
            project: { project_hash: 'project-2', project_name: 'Project 2' },
          });
        }
        if (!sessionRefreshed) {
          return jsonResponse({ success: false, message: 'expired' }, 401);
        }
        return jsonResponse({ success: true, message: 'ok' });
      }
    );
    vi.stubGlobal('fetch', fetchMock);

    const protectedRequest = apiClient.get('/protected');
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          requestUrl(input).includes('/auth/refresh')
        )
      ).toBe(true)
    );
    const switchRequest = apiClient.postForm('/auth/switch-project', {
      project_hash: 'project-2',
    });
    await Promise.resolve();
    expect(
      fetchMock.mock.calls.some(([input]) =>
        requestUrl(input).includes('/auth/switch-project')
      )
    ).toBe(false);

    finishRefresh();
    await expect(protectedRequest).resolves.toMatchObject({ success: true });
    await expect(switchRequest).resolves.toMatchObject({ success: true });
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        requestUrl(input).includes('/auth/refresh')
      )
    ).toHaveLength(1);
  });

  it('does not accept a malformed 2xx refresh body as a rotation success', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'expired' }, 401)
      )
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'missing metadata' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/protected')).rejects.toThrow('expired');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not force logout when refresh fails transiently', async () => {
    const unauthorized = vi.fn();
    window.addEventListener('magic-auth-unauthorized', unauthorized);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'expired' }, 401)
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'temporarily unavailable' }, 503)
      );
    vi.stubGlobal('fetch', fetchMock);

    try {
      await expect(apiClient.get('/protected')).rejects.toThrow('expired');
      expect(unauthorized).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('magic-auth-unauthorized', unauthorized);
    }
  });

  it('replaces refresh metadata with a signed-out boundary on logout', async () => {
    localStorage.setItem(
      'magic-auth-refresh-generation',
      JSON.stringify({
        generation: 'old',
        completedAt: Date.now(),
        status: 'success',
        expiresAt: '2026-07-11T20:15:00Z',
        rememberMe: true,
      })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ success: true, message: 'bye' }))
    );

    await expect(apiClient.post('/auth/logout')).resolves.toMatchObject({
      success: true,
    });

    const marker = localStorage.getItem('magic-auth-refresh-generation');
    expect(marker).toContain('signed_out');
    expect(marker).not.toContain('expiresAt');
    expect(marker).not.toContain('rememberMe');
  });

  it('rebases a durable signed-out marker after successful validation', async () => {
    localStorage.setItem(
      'magic-auth-refresh-generation',
      JSON.stringify({
        generation: 'signed-out',
        completedAt: Date.now() - 60_000,
        status: 'signed_out',
      })
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(validationResponse()))
    );

    await expect(apiClient.get('/auth/validate')).resolves.toMatchObject({
      valid: true,
    });

    const marker = localStorage.getItem('magic-auth-refresh-generation');
    expect(marker).toContain('"status":"success"');
    expect(marker).toContain('"rememberMe":true');
  });

  it('does not adopt a stale validation response that completes after logout', async () => {
    let finishValidation = (): void => undefined;
    const validationGate = new Promise<void>((resolve) => {
      finishValidation = resolve;
    });
    let validationCalls = 0;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = requestUrl(input);
        if (url.includes('/auth/logout')) {
          return jsonResponse({ success: true, message: 'bye' });
        }
        if (url.includes('/auth/validate')) {
          validationCalls += 1;
          if (validationCalls === 1) {
            await validationGate;
            return jsonResponse(validationResponse());
          }
          return jsonResponse({ success: false, message: 'signed out' }, 401);
        }
        throw new Error(`Unexpected request: ${url}`);
      }
    );
    vi.stubGlobal('fetch', fetchMock);

    const validation = apiClient.get('/auth/validate');
    await vi.waitFor(() => expect(validationCalls).toBe(1));
    await apiClient.post('/auth/logout');
    finishValidation();

    await expect(validation).rejects.toThrow('signed out');
    expect(validationCalls).toBe(2);
    expect(localStorage.getItem('magic-auth-refresh-generation')).toContain(
      'signed_out'
    );
  });
});
