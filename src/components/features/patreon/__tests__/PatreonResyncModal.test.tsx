import './resize-observer';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatreonResyncModal } from '../PatreonResyncModal';
import { ApiError } from '@/utils/error-handler';

const resync = vi.fn();
const showToast = vi.fn();

vi.mock('@/hooks', () => ({
  useResyncPatreon: () => ({ resync, isResyncing: false, error: null }),
  useToast: () => ({ showToast }),
}));

describe('PatreonResyncModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires a user hash for a per-user resync', async () => {
    render(<PatreonResyncModal isOpen onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /queue resync/i }));
    expect(await screen.findByText(/enter the user hash/i)).toBeInTheDocument();
    expect(resync).not.toHaveBeenCalled();
  });

  it('sends an optional note (capped at 128 characters) and the priority flag', async () => {
    resync.mockResolvedValue({
      accepted: true,
      status: 'queued',
      correlationId: 'psj-1',
      message: null,
    });
    const onClose = vi.fn();
    render(
      <PatreonResyncModal isOpen onClose={onClose} defaultUserHash="usr-aaa" />
    );

    const note = screen.getByLabelText(/note/i);
    expect(note).toHaveAttribute('maxLength', '128');
    fireEvent.change(note, { target: { value: 'after tier change' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /high priority/i }));
    fireEvent.click(screen.getByRole('button', { name: /queue resync/i }));

    await waitFor(() =>
      expect(resync).toHaveBeenCalledWith({
        scope: 'user',
        userHash: 'usr-aaa',
        reason: 'after tier change',
        force: true,
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('turns a rate limit into a retry hint instead of a raw HTTP error', async () => {
    const error = new ApiError('Patreon resync rate limit exceeded.', 429);
    error.retryAfterSeconds = 42;
    resync.mockRejectedValue(error);
    render(
      <PatreonResyncModal isOpen onClose={vi.fn()} defaultUserHash="usr-aaa" />
    );

    fireEvent.click(screen.getByRole('button', { name: /queue resync/i }));
    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        'Resync limit reached. Try again in 42s.',
        'error'
      )
    );
  });

  it('warns that a job waits when the worker is not running', () => {
    render(
      <PatreonResyncModal isOpen onClose={vi.fn()} workerHealthy={false} />
    );
    expect(screen.getByText(/not reporting a heartbeat/i)).toBeInTheDocument();
  });
});
