import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api.client';
import { ApiError } from '@/utils/error-handler';

const jsonResponse = (
  body: unknown,
  status: number,
  headers: Record<string, string> = {}
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

describe('apiClient error messages', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('surfaces the backend error envelope message, status, code and Retry-After', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            status: 'error',
            error: {
              code: 'INT_7005',
              message: 'Patreon resync rate limit exceeded.',
            },
          },
          429,
          { 'Retry-After': '30' }
        )
      )
    );

    const error = await apiClient
      .post('/admin/patreon/resync', { scope: 'all' })
      .catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: 'Patreon resync rate limit exceeded.',
      status: 429,
      code: 'INT_7005',
      retryAfterSeconds: 30,
    });
  });

  it('uses the backend message for 404s and 400 validation failures instead of generic text', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse(
            { status: 'error', error: { message: 'User not found' } },
            404
          )
        )
        .mockResolvedValueOnce(
          jsonResponse(
            { status: 'error', error: { message: 'user_hash is required' } },
            400
          )
        )
    );

    await expect(
      apiClient.post('/admin/patreon/resync', { scope: 'user' })
    ).rejects.toThrow('User not found');
    await expect(
      apiClient.post('/admin/patreon/resync', { scope: 'user' })
    ).rejects.toThrow('user_hash is required');
  });

  it.each([
    {
      status: 'error',
      error: { code: 'VAL_4001', message: 'Invalid username.' },
    },
    {
      detail: [
        { loc: ['body', 'username'], msg: 'Field required', type: 'missing' },
      ],
    },
  ])(
    'rejects HTTP 422 mutations without dispatching unauthorized',
    async (body) => {
      const unauthorized = vi.fn();
      window.addEventListener('magic-auth-unauthorized', unauthorized);
      try {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(body, 422));
        vi.stubGlobal('fetch', fetchMock);
        const error = await apiClient
          .put('/users/usr-1', {})
          .catch((err: unknown) => err);
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 422 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(unauthorized).not.toHaveBeenCalled();
      } finally {
        window.removeEventListener('magic-auth-unauthorized', unauthorized);
      }
    }
  );

  it('keeps the generic fallback when the body carries no message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 404)));
    await expect(apiClient.post('/somewhere', {})).rejects.toThrow(
      'Resource not found.'
    );
  });
});
