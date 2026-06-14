import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api.client';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('apiClient cookie-backed auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('includes credentials and refreshes once before retrying a protected 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, message: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'refreshed' }))
      .mockResolvedValueOnce(jsonResponse({ success: true, message: 'ok', data: { ok: true } }));

    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('magic_auth_token', 'stale-token');

    const response = await apiClient.get<{ ok: boolean }>('/protected');

    expect(response.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/auth/refresh');

    for (const call of fetchMock.mock.calls) {
      const init = call[1] as RequestInit;
      expect(init.credentials).toBe('include');
      expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    }
  });
});
