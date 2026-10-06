import { apiClient } from './api.client';
import type { SessionRefreshResult } from './session-refresh-coordinator';
import type {
  PlatformLoginRequest,
  SessionResponse,
  ValidationResponse,
  AvailabilityResponse,
} from '@/types/auth.types';

class AuthService {
  async platformLogin(
    credentials: PlatformLoginRequest
  ): Promise<SessionResponse> {
    return apiClient.postForm<SessionResponse>(
      '/auth/platform/login',
      credentials,
      true
    );
  }

  async validateSession(): Promise<ValidationResponse> {
    return apiClient.get<ValidationResponse>('/auth/validate');
  }

  async checkUsernameAvailability(
    username: string
  ): Promise<AvailabilityResponse> {
    return apiClient.postForm<AvailabilityResponse>(
      '/auth/check-availability',
      { username },
      true
    );
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  /** Wrong current-password proof is reported without signing the operator out. */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.postForm('/auth/password/change', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async refreshToken(): Promise<SessionRefreshResult> {
    return apiClient.refreshAuthSession();
  }
}

export const authService = new AuthService();
