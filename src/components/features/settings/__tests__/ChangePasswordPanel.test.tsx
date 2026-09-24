import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/utils/error-handler';

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/services/auth.service', () => ({
  authService: { changePassword: mocks.changePassword },
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

const { ChangePasswordPanel } = await import('../ChangePasswordPanel');

function fill(current: string, next: string, confirm = next): void {
  fireEvent.change(screen.getByLabelText('Current password'), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText('New password'), {
    target: { value: next },
  });
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: confirm },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
}

describe('ChangePasswordPanel', () => {
  beforeEach(() => {
    mocks.changePassword.mockReset();
    mocks.showToast.mockReset();
  });

  it('checks the form before calling the API', () => {
    render(<ChangePasswordPanel />);
    fill('old-secret-1', 'short', 'shorter');
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('rejects reusing the current password', () => {
    render(<ChangePasswordPanel />);
    fill('same-secret-1', 'same-secret-1');
    expect(
      screen.getByText('Choose a password you are not using now.')
    ).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it('changes the password, clears the form and confirms', async () => {
    mocks.changePassword.mockResolvedValue(undefined);
    render(<ChangePasswordPanel />);
    fill('old-secret-1', 'new-secret-2');

    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        'Password changed. Your other sessions were signed out.',
        'success'
      )
    );
    expect(mocks.changePassword).toHaveBeenCalledWith(
      'old-secret-1',
      'new-secret-2'
    );
    expect(screen.getByLabelText('Current password')).toHaveValue('');
  });

  it('flags a wrong current password on its field', async () => {
    mocks.changePassword.mockRejectedValue(
      new ApiError('Invalid credentials', 401, 'AUTH_1001')
    );
    render(<ChangePasswordPanel />);
    fill('wrong-secret', 'new-secret-2');

    expect(
      await screen.findByText('The current password is incorrect.')
    ).toBeInTheDocument();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('explains a policy rejection and throttling', async () => {
    mocks.changePassword.mockRejectedValueOnce(
      new ApiError('Weak password (VAL_3007)', 400, 'VAL_3007')
    );
    render(<ChangePasswordPanel />);
    fill('old-secret-1', 'password123');
    expect(
      await screen.findByText(/This password is too weak/)
    ).toBeInTheDocument();

    const throttled = new ApiError('Too many attempts', 429, 'INT_7005');
    throttled.retryAfterSeconds = 30;
    mocks.changePassword.mockRejectedValueOnce(throttled);
    fill('old-secret-1', 'new-secret-2');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts. Try again in 30 seconds.'
    );
  });
});
