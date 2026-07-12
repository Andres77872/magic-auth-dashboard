import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '@/hooks/useAuth';
import type {
  PlatformLoginResponse,
  User,
  ValidationResponse,
} from '@/types/auth.types';

const authMocks = vi.hoisted(() => ({
  platformLogin: vi.fn(),
  refreshToken: vi.fn(),
  validateSession: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    platformLogin: authMocks.platformLogin,
    logout: vi.fn(),
    refreshToken: authMocks.refreshToken,
    validateSession: authMocks.validateSession,
  },
}));

const user: User = {
  user_hash: 'usr-1',
  username: 'admin',
  email: 'admin@example.com',
  user_type: 'admin',
  created_at: '2026-06-01T00:00:00Z',
  is_active: true,
};

const validationResponse: ValidationResponse = {
  success: true,
  message: 'valid',
  valid: true,
  user,
  session: {
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    remember_me: false,
  },
};

const loginResponse = (
  rememberMe: boolean,
  refreshExpiresIn: number
): PlatformLoginResponse => ({
  success: true,
  message: 'ok',
  session_token: 'session-token',
  refresh_expires_in: refreshExpiresIn,
  remember_me: rememberMe,
  user,
  accessible_projects: [],
  expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  refresh_expires_at: new Date(
    Date.now() + refreshExpiresIn * 1000
  ).toISOString(),
});

function AuthStateProbe(): React.JSX.Element {
  const {
    isAuthenticated,
    isLoading,
    platformLogin,
    refreshSession,
    rememberMe,
    state,
  } = useAuth();

  return (
    <>
      <p>
        {isLoading ? 'loading' : rememberMe ? 'remembered' : 'not remembered'}
      </p>
      <p data-testid="refresh-expiry">{state.refreshExpiresAt ?? 'none'}</p>
      <p>{isAuthenticated ? 'signed in' : 'signed out'}</p>
      <button
        type="button"
        onClick={() => void platformLogin('admin', 'password123', true)}
      >
        Log in
      </button>
      <button type="button" onClick={() => void refreshSession()}>
        Refresh
      </button>
    </>
  );
}

describe('AuthContext remembered-session state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authMocks.validateSession.mockResolvedValue(validationResponse);
  });

  it('keeps remember me enabled during the final seven days', async () => {
    const sixDays = 6 * 24 * 60 * 60;
    authMocks.platformLogin.mockResolvedValue(loginResponse(true, sixDays));

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await screen.findByText('not remembered');
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('remembered');
  });

  it('does not infer remember me from a long refresh lifetime', async () => {
    const thirtyDays = 30 * 24 * 60 * 60;
    authMocks.platformLogin.mockResolvedValue(loginResponse(false, thirtyDays));

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await screen.findByText('not remembered');
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(screen.getByTestId('refresh-expiry')).not.toHaveTextContent('none')
    );
    expect(authMocks.platformLogin).toHaveBeenCalledOnce();
    expect(screen.getByText('not remembered')).toBeInTheDocument();
  });

  it('logs out immediately when refresh failure is terminal', async () => {
    authMocks.refreshToken.mockResolvedValue({
      success: false,
      terminal: true,
      signedOut: false,
      source: 'local',
      generation: 'terminal-generation',
      metadata: {},
    });

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await screen.findByText('signed in');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await screen.findByText('signed out');
  });

  it('keeps the current session during a transient refresh failure', async () => {
    authMocks.refreshToken.mockResolvedValue({
      success: false,
      terminal: false,
      signedOut: false,
      source: 'local',
      generation: 'transient-generation',
      metadata: {},
    });

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await screen.findByText('signed in');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(authMocks.refreshToken).toHaveBeenCalledOnce());
    expect(screen.getByText('signed in')).toBeInTheDocument();
  });
});
