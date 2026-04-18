import { apiClient } from './api.client';
import type {
  LoginRequest,
  LoginResponse,
  PlatformLoginRequest,
  PlatformLoginResponse,
  RegisterRequest,
  RegisterResponse,
  ValidationResponse,
  AvailabilityRequest,
  AvailabilityResponse,
} from '@/types/auth.types';

class AuthService {
  /**
   * Project-scoped login (for consumer users).
   * POST /auth/login — requires project_hash.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.postForm<LoginResponse>(
      '/auth/login',
      credentials,
      true // Skip auth for login
    );

    if (response.success && response.data) {
      const loginData = response.data as LoginResponse;
      if ('session_token' in loginData) {
        // Store token on successful login
        apiClient.setAuthToken(loginData.session_token);
      }
    }

    return response as LoginResponse;
  }

  /**
   * Platform login (for root/admin dashboard users).
   * POST /auth/platform/login — no project_hash required.
   * Only accepts user_type: root | admin.
   */
  async platformLogin(credentials: PlatformLoginRequest): Promise<PlatformLoginResponse> {
    const response = await apiClient.postForm<PlatformLoginResponse>(
      '/auth/platform/login',
      credentials,
      true // Skip auth for login
    );

    if (response.success && response.data) {
      const loginData = response.data as PlatformLoginResponse;
      if ('session_token' in loginData) {
        // Store token on successful login
        apiClient.setAuthToken(loginData.session_token);
      }
    }

    return response as PlatformLoginResponse;
  }

  // Register new user - uses form data per API spec
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.postForm<RegisterResponse>(
      '/auth/register',
      userData,
      true // Skip auth for registration
    );
    return response as RegisterResponse;
  }

  // Validate current session
  async validateSession(): Promise<ValidationResponse> {
    const response = await apiClient.get<ValidationResponse>('/auth/validate');
    return response as ValidationResponse;
  }

  // Check username/email availability - uses form data per API spec
  async checkAvailability(
    data: AvailabilityRequest
  ): Promise<AvailabilityResponse> {
    return await apiClient.postForm<AvailabilityResponse>(
      '/auth/check-availability',
      data,
      true // Skip auth
    );
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if it exists
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local auth data
      apiClient.clearAuthToken();
    }
  }

  // Refresh token (if needed)
  async refreshToken(): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/refresh');
    return response as LoginResponse;
  }

  // Switch project for multi-project users - uses form data per API spec
  async switchProject(projectHash: string): Promise<LoginResponse> {
    const response = await apiClient.postForm<LoginResponse>(
      '/auth/switch-project',
      { project_hash: projectHash }
    );

    if (response.success && response.data) {
      const loginData = response.data as LoginResponse;
      if ('session_token' in loginData) {
        // Update token with new project context
        apiClient.setAuthToken(loginData.session_token);
      }
    }

    return response as LoginResponse;
  }

  // Middleware access check (HEAD request)
  async checkAccess(): Promise<boolean> {
    try {
      const response = await apiClient.head('/access');
      return response.status === 204;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
