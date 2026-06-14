import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '../auth.service';
import { apiClient } from '../api.client';
import type { LoginResponse } from '@/types/auth.types';

vi.mock('../api.client', () => ({
  apiClient: {
    post: vi.fn(),
    postForm: vi.fn(),
  },
}));

describe('authService remember-me contract', () => {
  const mockedApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes remember_me to platform login', async () => {
    const loginResponse: LoginResponse = {
      success: true,
      message: 'ok',
      session_token: 'access-token',
      user: { user_hash: 'usr-1', username: 'admin', email: '', user_type: 'admin', created_at: '', is_active: true },
      accessible_projects: [],
      expires_at: '2026-06-13T12:15:00Z',
      refresh_expires_at: '2026-07-13T12:00:00Z',
    };

    mockedApiClient.postForm.mockResolvedValue(loginResponse);

    await authService.platformLogin({
      username: 'admin',
      password: 'password123',
      remember_me: true,
    });

    expect(mockedApiClient.postForm.mock.calls[0]).toEqual([
      '/auth/platform/login',
      {
        username: 'admin',
        password: 'password123',
        remember_me: true,
      },
      true
    ]);
  });

});
