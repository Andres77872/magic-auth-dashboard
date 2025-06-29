import { apiClient } from './api.client';
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  RegisterResponse,
  ValidationResponse,
  AvailabilityRequest,
  AvailabilityResponse 
} from '@/types/auth.types';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login', 
      credentials,
      true // Skip auth for login
    );
    
    if (response.success && (response as any).session_token) {
      // Store token on successful login
      apiClient.setAuthToken((response as any).session_token);
    }
    
    return response as LoginResponse;
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
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

  // Check username/email availability
  async checkAvailability(data: AvailabilityRequest): Promise<AvailabilityResponse> {
    return await apiClient.post<AvailabilityResponse>(
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
}

export const authService = new AuthService();
export default authService; 