import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { useAuth } from '@/hooks/useAuth';

type AuthContextValue = ReturnType<typeof useAuth>;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginForm', () => {
  const platformLogin = vi.fn<AuthContextValue['platformLogin']>();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      }
    );
    platformLogin.mockResolvedValue(true);
    vi.mocked(useAuth).mockReturnValue({
      canAccessRoute: vi.fn<() => boolean>().mockReturnValue(false),
      clearError: vi.fn<() => void>(),
      currentProject: null,
      dismissSessionExpiryWarning: vi.fn<() => void>(),
      effectivePermissions: [],
      hasPermission: vi.fn<() => boolean>().mockReturnValue(false),
      isAuthenticated: false,
      platformLogin,
      isLoading: false,
      loadUserPermissions: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      login: vi.fn<AuthContextValue['login']>(),
      logout: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      permissionsLoading: false,
      refreshExpiresAt: null,
      refreshRetryCount: 0,
      refreshSession: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
      rememberMe: false,
      sessionExpiresAt: null,
      showSessionExpiryWarning: false,
      state: {
        isAuthenticated: false,
        user: null,
        token: null,
        currentProject: null,
        accessibleProjects: [],
        isLoading: false,
        error: null,
        effectivePermissions: [],
        permissionsLoading: false,
        sessionExpiresAt: null,
        refreshExpiresAt: null,
        rememberMe: false,
      },
      user: null,
      userType: null,
      validateToken: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    });
  });

  it('submits remember-me selection to platform login', async () => {
    render(
      <MemoryRouter>
        <LoginForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/remember me for 30 days/i));
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(platformLogin).toHaveBeenCalledWith('admin', 'password123', true);
    });
  });
});
