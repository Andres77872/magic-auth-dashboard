import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateUserModal } from '../CreateUserModal';
import { EditUserDialog } from '../EditUserDialog';

const toast = vi.hoisted(() => ({ showToast: vi.fn() }));
vi.mock('@/hooks', () => ({ useToast: () => toast }));

const response = (username: string): Response =>
  new Response(
    JSON.stringify({
      success: true,
      user: {
        user_hash: 'usr-1',
        username,
        email: null,
        user_type: 'root',
        created_at: null,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  toast.showToast.mockClear();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  );
});

describe('current user identity form contracts', () => {
  it('creates a root with username and password through the real service and transport', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response('new-root'));
    vi.stubGlobal('fetch', fetchMock);
    const onCreated = vi.fn();
    render(
      <CreateUserModal open onOpenChange={vi.fn()} onCreated={onCreated} />
    );
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: ' new-root ' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'AstrongPass!42' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'AstrongPass!42' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Create root user' }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('usr-1'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe('/user-types/root');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(
      Object.fromEntries(
        new URLSearchParams(
          init.body instanceof URLSearchParams ? init.body.toString() : ''
        )
      )
    ).toEqual({
      username: 'new-root',
      password: 'AstrongPass!42',
    });
  });

  it('renames an account without sending an email through the real service and transport', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response('renamed-root'));
    vi.stubGlobal('fetch', fetchMock);
    const onSaved = vi.fn();
    render(
      <EditUserDialog
        user={{ user_hash: 'usr-1', username: 'old-root' }}
        open
        onOpenChange={vi.fn()}
        onSaved={onSaved}
      />
    );
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: ' renamed-root ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe('/users/usr-1');
    expect(init.method).toBe('PUT');
    expect(init.credentials).toBe('include');
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect(
      Object.fromEntries(
        new URLSearchParams(
          init.body instanceof URLSearchParams ? init.body.toString() : ''
        )
      )
    ).toEqual({ username: 'renamed-root' });
  });
});
