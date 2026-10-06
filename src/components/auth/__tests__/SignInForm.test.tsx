import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SignInForm } from '../SignInForm';
import { useAuth } from '@/hooks/useAuth';

type AuthContextValue = ReturnType<typeof useAuth>;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('SignInForm', () => {
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
      dismissSessionExpiryWarning: vi.fn<() => void>(),
      isAuthenticated: false,
      platformLogin,
      isLoading: false,
      logout: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
      refreshExpiresAt: null,
      refreshRetryCount: 0,
      refreshSession: vi.fn<() => Promise<boolean>>().mockResolvedValue(false),
      rememberMe: false,
      sessionExpiresAt: null,
      showSessionExpiryWarning: false,
      state: {
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        sessionExpiresAt: null,
        refreshExpiresAt: null,
        rememberMe: false,
      },
      user: null,
      userType: null,
      validateSession: vi
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined),
    });
  });

  const submitCredentials = (): void => {
    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  };

  it('requests a remembered session when selected', async () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText(/remember me for 30 days/i));
    submitCredentials();

    await waitFor(() => {
      expect(platformLogin).toHaveBeenCalledWith('admin', 'password123', true);
    });
  });

  it('accepts an email address as the sign-in identifier', async () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username or email/i), {
      target: { value: 'root@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(platformLogin).toHaveBeenCalledWith(
        'root@example.com',
        'password123',
        false
      );
    });
  });

  it('shows inline errors instead of calling the API when fields are empty', async () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(
      await screen.findByText(/enter your username or email/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/enter your password\./i)).toBeInTheDocument();
    expect(platformLogin).not.toHaveBeenCalled();
  });

  it('does not request a remembered session by default', async () => {
    render(
      <MemoryRouter>
        <SignInForm />
      </MemoryRouter>
    );

    submitCredentials();

    await waitFor(() => {
      expect(platformLogin).toHaveBeenCalledWith('admin', 'password123', false);
    });
  });
});
