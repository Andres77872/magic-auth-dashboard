import { describe, expect, it, vi } from 'vitest';
import type { LoginResponse } from '@/types/auth.types';
import {
  SessionRefreshCoordinator,
  SESSION_REFRESH_GENERATION_KEY,
  type ExclusiveLockManager,
} from '../session-refresh-coordinator';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

class MemoryEventTarget {
  private readonly listeners = new Set<(event: StorageEvent) => void>();

  addEventListener(
    _type: 'storage',
    listener: (event: StorageEvent) => void
  ): void {
    this.listeners.add(listener);
  }

  removeEventListener(
    _type: 'storage',
    listener: (event: StorageEvent) => void
  ): void {
    this.listeners.delete(listener);
  }

  dispatch(newValue: string): void {
    const event = new StorageEvent('storage', {
      key: SESSION_REFRESH_GENERATION_KEY,
      newValue,
    });
    this.listeners.forEach((listener) => listener(event));
  }
}

class QueueLockManager implements ExclusiveLockManager {
  private tail: Promise<void> = Promise.resolve();

  async request<T>(
    _name: string,
    _options: { mode: 'exclusive' },
    callback: () => Promise<T> | T
  ): Promise<T> {
    const previous = this.tail;
    let release = (): void => undefined;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

const deferred = <T>(): Deferred<T> => {
  let resolvePromise: (value: T) => void = () => {
    throw new Error('Deferred promise was not initialized');
  };
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
};

const loginResponse = (): LoginResponse => ({
  success: true,
  message: 'refreshed',
  session_token: 'must-not-be-persisted',
  remember_me: true,
  user: {
    user_hash: 'usr-1',
    username: 'admin',
    email: 'admin@example.com',
    user_type: 'admin',
    created_at: '2026-01-01T00:00:00Z',
    is_active: true,
  },
  accessible_projects: [],
  expires_at: '2026-07-11T20:00:00Z',
  refresh_expires_at: '2026-08-10T19:55:00Z',
});

describe('SessionRefreshCoordinator', () => {
  it('returns one same-tab promise to concurrent refresh callers', async () => {
    const coordinator = new SessionRefreshCoordinator({
      storage: new MemoryStorage(),
      now: (): number => 1_000,
      createGeneration: (): string => 'generation-1',
    });
    const completion = deferred<{ success: boolean }>();
    const execute = vi.fn(
      (): Promise<{ success: boolean }> => completion.promise
    );

    const first = coordinator.refresh(execute);
    const second = coordinator.refresh(execute);

    expect(first).toBe(second);
    await vi.waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    completion.resolve({ success: true });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual(secondResult);
    expect(firstResult.source).toBe('local');
  });

  it('allows only one cross-tab rotation and notifies the waiting tab', async () => {
    const storage = new MemoryStorage();
    const locks = new QueueLockManager();
    let generation = 0;
    const options = {
      storage,
      lockManager: locks,
      now: (): number => 10_000,
      createGeneration: (): string => `generation-${++generation}`,
    };
    const firstTab = new SessionRefreshCoordinator(options);
    const secondTab = new SessionRefreshCoordinator(options);
    const peerListener = vi.fn();
    secondTab.subscribe(peerListener);

    const firstCompletion = deferred<{
      success: boolean;
      response: LoginResponse;
    }>();
    const firstExecutor = vi.fn(
      (): Promise<{ success: boolean; response: LoginResponse }> =>
        firstCompletion.promise
    );
    const secondExecutor = vi.fn().mockResolvedValue({ success: true });

    const firstRefresh = firstTab.refresh(firstExecutor);
    await vi.waitFor(() => expect(firstExecutor).toHaveBeenCalledTimes(1));
    const secondRefresh = secondTab.refresh(secondExecutor);
    firstCompletion.resolve({ success: true, response: loginResponse() });

    const [firstResult, secondResult] = await Promise.all([
      firstRefresh,
      secondRefresh,
    ]);

    expect(firstResult.source).toBe('local');
    expect(secondResult).toMatchObject({
      success: true,
      source: 'peer',
      metadata: {
        expiresAt: '2026-07-11T20:00:00Z',
        refreshExpiresAt: '2026-08-10T19:55:00Z',
        rememberMe: true,
      },
    });
    expect(secondExecutor).not.toHaveBeenCalled();
    expect(peerListener).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'peer', generation: 'generation-1' })
    );
  });

  it('uses the completion freshness window when a tab observes the new generation', async () => {
    const storage = new MemoryStorage();
    const locks = new QueueLockManager();
    let now = 20_000;
    let generation = 0;
    const options = {
      storage,
      lockManager: locks,
      now: (): number => now,
      createGeneration: (): string => `generation-${++generation}`,
      freshnessMs: 5_000,
    };
    const firstTab = new SessionRefreshCoordinator(options);
    const lateTab = new SessionRefreshCoordinator(options);

    await firstTab.refresh(
      (): Promise<{ success: boolean }> => Promise.resolve({ success: true })
    );
    const alreadyCurrentGeneration = lateTab.getGeneration();
    const lateExecutor = vi.fn().mockResolvedValue({ success: true });

    const sharedResult = await lateTab.refresh(
      lateExecutor,
      alreadyCurrentGeneration
    );

    expect(sharedResult.source).toBe('peer');
    expect(lateExecutor).not.toHaveBeenCalled();

    now += 5_001;
    const laterResult = await lateTab.refresh(lateExecutor);
    expect(laterResult.source).toBe('local');
    expect(lateExecutor).toHaveBeenCalledTimes(1);
  });

  it('skips rotation when the request began against an older generation', async () => {
    const storage = new MemoryStorage();
    const locks = new QueueLockManager();
    let now = 30_000;
    let generation = 0;
    const options = {
      storage,
      lockManager: locks,
      now: (): number => now,
      createGeneration: (): string => `generation-${++generation}`,
      freshnessMs: 5_000,
    };
    const firstTab = new SessionRefreshCoordinator(options);
    const staleRequestTab = new SessionRefreshCoordinator(options);
    const requestGeneration = staleRequestTab.getGeneration();

    await firstTab.refresh(
      (): Promise<{ success: boolean }> => Promise.resolve({ success: true })
    );
    now += 6_000;
    const staleExecutor = vi.fn().mockResolvedValue({ success: true });

    const result = await staleRequestTab.refresh(
      staleExecutor,
      requestGeneration
    );

    expect(result.source).toBe('peer');
    expect(staleExecutor).not.toHaveBeenCalled();
  });

  it('persists only non-sensitive refresh metadata', async () => {
    const storage = new MemoryStorage();
    const coordinator = new SessionRefreshCoordinator({
      storage,
      now: (): number => 40_000,
      createGeneration: (): string => 'generation-safe',
    });

    await coordinator.refresh(
      (): Promise<{ success: boolean; response: LoginResponse }> =>
        Promise.resolve({ success: true, response: loginResponse() })
    );

    const stored = storage.getItem(SESSION_REFRESH_GENERATION_KEY);
    expect(stored).toContain('generation-safe');
    expect(stored).toContain('refreshExpiresAt');
    expect(stored).not.toContain('must-not-be-persisted');
    expect(stored).not.toContain('admin@example.com');
  });

  it('serializes a session mutation behind an active refresh', async () => {
    const coordinator = new SessionRefreshCoordinator({
      storage: new MemoryStorage(),
      now: (): number => 50_000,
      createGeneration: (): string => 'generation-queued',
    });
    const refreshCompletion = deferred<{
      success: boolean;
      response: LoginResponse;
    }>();
    const refreshExecutor = vi.fn(() => refreshCompletion.promise);
    const mutationExecutor = vi.fn(() =>
      Promise.resolve({
        value: 'switched',
        completion: { success: true, response: loginResponse() },
      })
    );

    const refresh = coordinator.refresh(refreshExecutor);
    await vi.waitFor(() => expect(refreshExecutor).toHaveBeenCalledOnce());
    const mutation = coordinator.runSessionMutation(mutationExecutor);
    await Promise.resolve();
    expect(mutationExecutor).not.toHaveBeenCalled();

    refreshCompletion.resolve({ success: true, response: loginResponse() });
    await expect(refresh).resolves.toMatchObject({ success: true });
    await expect(mutation).resolves.toBe('switched');
    expect(mutationExecutor).toHaveBeenCalledOnce();
  });

  it('broadcasts terminal failure but keeps transient failure retryable', async () => {
    const storage = new MemoryStorage();
    let generation = 0;
    let now = 60_000;
    const coordinator = new SessionRefreshCoordinator({
      storage,
      now: (): number => now,
      createGeneration: (): string => `generation-${++generation}`,
      freshnessMs: 0,
    });
    const listener = vi.fn();
    coordinator.subscribe(listener);

    const transient = await coordinator.refresh(() =>
      Promise.resolve({ success: false, terminal: false })
    );
    expect(transient).toMatchObject({ success: false, terminal: false });
    expect(listener).not.toHaveBeenCalled();

    now += 1;
    const terminal = await coordinator.refresh(() =>
      Promise.resolve({ success: false, terminal: true })
    );
    expect(terminal).toMatchObject({ success: false, terminal: true });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, terminal: true })
    );
  });

  it('writes a metadata-free signed-out boundary and blocks stale refresh', async () => {
    const storage = new MemoryStorage();
    let now = 70_000;
    const coordinator = new SessionRefreshCoordinator({
      storage,
      now: (): number => now,
      createGeneration: (): string => 'generation-signed-out',
    });
    const listener = vi.fn();
    coordinator.subscribe(listener);

    await coordinator.runSessionMutation(() =>
      Promise.resolve({ value: undefined, signedOut: true })
    );

    const stored = storage.getItem(SESSION_REFRESH_GENERATION_KEY);
    expect(stored).toContain('signed_out');
    expect(stored).not.toContain('expiresAt');
    expect(stored).not.toContain('refreshExpiresAt');
    now += 10_000;
    const executor = vi.fn().mockResolvedValue({ success: true });
    const result = await coordinator.refresh(executor);
    expect(result).toMatchObject({
      success: false,
      terminal: true,
      signedOut: true,
      source: 'peer',
    });
    expect(executor).not.toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ terminal: true, signedOut: true })
    );
  });

  it('adopts a validated external session over a durable signed-out boundary', async () => {
    const storage = new MemoryStorage();
    let now = 75_000;
    let generation = 0;
    const coordinator = new SessionRefreshCoordinator({
      storage,
      now: (): number => now,
      createGeneration: (): string => `generation-${++generation}`,
      freshnessMs: 5_000,
    });
    await coordinator.runSessionMutation(() =>
      Promise.resolve({ value: undefined, signedOut: true })
    );
    const signedOutGeneration = coordinator.getGeneration();

    await expect(
      coordinator.adoptValidatedSession(
        {
          expiresAt: '2026-07-11T20:15:00Z',
          refreshExpiresAt: '2026-08-10T20:00:00Z',
          rememberMe: true,
        },
        signedOutGeneration
      )
    ).resolves.toBe(true);

    now += 5_001;
    const executor = vi.fn().mockResolvedValue({ success: true });
    const result = await coordinator.refresh(executor);
    expect(result).toMatchObject({ success: true, source: 'local' });
    expect(executor).toHaveBeenCalledOnce();
  });

  it('rejects validation adoption after a newer session boundary wins', async () => {
    const coordinator = new SessionRefreshCoordinator({
      storage: new MemoryStorage(),
      createGeneration: (() => {
        let generation = 0;
        return (): string => `generation-${++generation}`;
      })(),
    });
    const observedGeneration = coordinator.getGeneration();
    await coordinator.runSessionMutation(() =>
      Promise.resolve({ value: undefined, signedOut: true })
    );

    await expect(
      coordinator.adoptValidatedSession(
        { expiresAt: '2026-07-11T20:15:00Z', rememberMe: true },
        observedGeneration
      )
    ).resolves.toBe(false);
  });

  it('keeps validation adoption idempotent across tabs', async () => {
    const storage = new MemoryStorage();
    const lockManager = new QueueLockManager();
    let generation = 0;
    const options = {
      storage,
      lockManager,
      createGeneration: (): string => `generation-${++generation}`,
    };
    const firstTab = new SessionRefreshCoordinator(options);
    const secondTab = new SessionRefreshCoordinator(options);
    const metadata = {
      expiresAt: '2026-07-11T20:15:00Z',
      refreshExpiresAt: '2026-08-10T20:00:00Z',
      rememberMe: true,
    };

    await expect(
      firstTab.adoptValidatedSession(metadata, firstTab.getGeneration())
    ).resolves.toBe(true);
    const adoptedGeneration = firstTab.getGeneration();
    await expect(
      secondTab.adoptValidatedSession(metadata, secondTab.getGeneration())
    ).resolves.toBe(true);

    expect(secondTab.getGeneration()).toBe(adoptedGeneration);
    expect(generation).toBe(1);
  });

  it('hydrates a passive tab from a sanitized storage event', async () => {
    const storage = new MemoryStorage();
    const eventTarget = new MemoryEventTarget();
    const leader = new SessionRefreshCoordinator({
      storage,
      now: (): number => 80_000,
      createGeneration: (): string => 'generation-passive',
    });
    const passive = new SessionRefreshCoordinator({ storage, eventTarget });
    const listener = vi.fn();
    passive.subscribe(listener);

    await leader.refresh(() =>
      Promise.resolve({ success: true, response: loginResponse() })
    );
    const stored = storage.getItem(SESSION_REFRESH_GENERATION_KEY);
    expect(stored).not.toBeNull();
    eventTarget.dispatch(stored ?? '');

    expect(listener).toHaveBeenCalledOnce();
    const event: unknown = listener.mock.calls[0]?.[0];
    expect(event).toMatchObject({
      success: true,
      source: 'peer',
      metadata: { rememberMe: true },
    });
    expect(event).not.toHaveProperty('response');
  });

  it('fails closed when production requires an unavailable cross-tab lock', async () => {
    const coordinator = new SessionRefreshCoordinator({
      storage: new MemoryStorage(),
      requireCrossTabLock: true,
      createGeneration: (): string => 'generation-unsupported',
    });
    const executor = vi.fn().mockResolvedValue({ success: true });

    const result = await coordinator.refresh(executor);

    expect(result).toMatchObject({ success: false, terminal: true });
    expect(executor).not.toHaveBeenCalled();

    const switchExecutor = vi.fn(() =>
      Promise.resolve({ value: 'switched' })
    );
    await expect(
      coordinator.runSessionMutation(switchExecutor, {
        requiresCrossTabLock: true,
      })
    ).rejects.toThrow('coordination is unavailable');
    expect(switchExecutor).not.toHaveBeenCalled();
  });
});
