import type { LoginResponse } from '@/types/auth.types';

const REFRESH_LOCK_NAME = 'magic-auth-session-refresh';
export const SESSION_REFRESH_GENERATION_KEY = 'magic-auth-refresh-generation';
export const REFRESH_COMPLETION_FRESHNESS_MS = 5_000;

type RefreshMarkerStatus =
  | 'success'
  | 'transient_failure'
  | 'terminal_failure'
  | 'signed_out';

export interface SessionRefreshMetadata {
  expiresAt?: string;
  refreshExpiresAt?: string;
  rememberMe?: boolean;
}

interface StoredRefreshMarker extends SessionRefreshMetadata {
  generation: string;
  completedAt: number;
  status: RefreshMarkerStatus;
}

export interface RefreshExecutionResult {
  success: boolean;
  terminal?: boolean;
  response?: LoginResponse;
}

export interface SessionRefreshResult extends RefreshExecutionResult {
  terminal: boolean;
  signedOut: boolean;
  source: 'local' | 'peer';
  generation: string;
  metadata: SessionRefreshMetadata;
}

export type SessionRefreshEvent = Omit<SessionRefreshResult, 'response'>;
export type SessionRefreshExecutor = () => Promise<RefreshExecutionResult>;
export type SessionRefreshListener = (event: SessionRefreshEvent) => void;

export interface SessionMutationExecution<T> {
  value: T;
  completion?: RefreshExecutionResult;
  signedOut?: boolean;
}

export interface ExclusiveLockManager {
  request<T>(
    name: string,
    options: { mode: 'exclusive' },
    callback: () => Promise<T> | T
  ): Promise<T>;
}

interface RefreshStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface RefreshEventTarget {
  addEventListener(
    type: 'storage',
    listener: (event: StorageEvent) => void
  ): void;
  removeEventListener(
    type: 'storage',
    listener: (event: StorageEvent) => void
  ): void;
}

export interface SessionRefreshCoordinatorOptions {
  storage?: RefreshStorage;
  lockManager?: ExclusiveLockManager;
  eventTarget?: RefreshEventTarget;
  now?: () => number;
  createGeneration?: () => string;
  freshnessMs?: number;
  requireCrossTabLock?: boolean;
}

const defaultGeneration = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const metadataFromResponse = (
  response: LoginResponse | undefined
): SessionRefreshMetadata => ({
  expiresAt: response?.expires_at,
  refreshExpiresAt: response?.refresh_expires_at,
  rememberMe: response?.remember_me,
});

const isStoredRefreshMarker = (
  value: unknown
): value is StoredRefreshMarker => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredRefreshMarker>;
  return (
    typeof candidate.generation === 'string' &&
    typeof candidate.completedAt === 'number' &&
    (candidate.status === 'success' ||
      candidate.status === 'transient_failure' ||
      candidate.status === 'terminal_failure' ||
      candidate.status === 'signed_out') &&
    (candidate.expiresAt === undefined ||
      typeof candidate.expiresAt === 'string') &&
    (candidate.refreshExpiresAt === undefined ||
      typeof candidate.refreshExpiresAt === 'string') &&
    (candidate.rememberMe === undefined ||
      typeof candidate.rememberMe === 'boolean')
  );
};

/**
 * Coordinates the single-use refresh cookie in this tab and across tabs. All
 * cookie-changing auth calls use the same operation queue and origin-wide Web
 * Lock, so login/logout/project-switch responses cannot race a refresh.
 */
export class SessionRefreshCoordinator {
  private readonly storage?: RefreshStorage;
  private readonly lockManager?: ExclusiveLockManager;
  private readonly eventTarget?: RefreshEventTarget;
  private readonly now: () => number;
  private readonly createGeneration: () => string;
  private readonly freshnessMs: number;
  private readonly requireCrossTabLock: boolean;
  private readonly listeners = new Set<SessionRefreshListener>();
  private inFlight: Promise<SessionRefreshResult> | null = null;
  private operationTail: Promise<void> = Promise.resolve();
  private fallbackMarker: StoredRefreshMarker | null = null;
  private lastNotifiedGeneration: string | null = null;
  private storageListenerAttached = false;

  private readonly handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== SESSION_REFRESH_GENERATION_KEY || !event.newValue) {
      return;
    }

    const marker = this.parseMarker(event.newValue);
    const currentMarker = this.readMarker();

    // Ignore delayed storage events when a newer completion is already stored.
    if (!marker || marker.generation !== currentMarker?.generation) {
      return;
    }

    this.notifyMarker(marker, 'peer');
  };

  constructor(options: SessionRefreshCoordinatorOptions = {}) {
    this.storage = options.storage;
    this.lockManager = options.lockManager;
    this.eventTarget = options.eventTarget;
    this.now = options.now ?? Date.now;
    this.createGeneration = options.createGeneration ?? defaultGeneration;
    this.freshnessMs = options.freshnessMs ?? REFRESH_COMPLETION_FRESHNESS_MS;
    this.requireCrossTabLock = options.requireCrossTabLock ?? false;
  }

  getGeneration(): string | null {
    return this.readMarker()?.generation ?? null;
  }

  subscribe(listener: SessionRefreshListener): () => void {
    this.listeners.add(listener);
    this.attachStorageListener();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.detachStorageListener();
      }
    };
  }

  refresh(
    execute: SessionRefreshExecutor,
    observedGeneration: string | null = this.getGeneration()
  ): Promise<SessionRefreshResult> {
    if (!this.inFlight) {
      this.inFlight = this.runRefresh(execute, observedGeneration).finally(
        () => {
          this.inFlight = null;
        }
      );
    }

    return this.inFlight;
  }

  runSessionMutation<T>(
    execute: () => Promise<SessionMutationExecution<T>>,
    options: { requiresCrossTabLock?: boolean } = {}
  ): Promise<T> {
    if (
      options.requiresCrossTabLock &&
      this.requireCrossTabLock &&
      !this.lockManager
    ) {
      return Promise.reject(
        new Error('Cross-tab authentication coordination is unavailable')
      );
    }

    return this.runExclusive(async () => {
      const mutation = await execute();

      if (mutation.signedOut) {
        const marker = this.storeBoundary('signed_out');
        this.notifyMarker(marker, 'local');
      } else if (mutation.completion) {
        const marker = this.storeCompletion(mutation.completion);
        this.notifyMarker(marker, 'local');
      }

      return mutation.value;
    });
  }

  adoptValidatedSession(
    metadata: SessionRefreshMetadata,
    observedGeneration: string | null
  ): Promise<boolean> {
    return this.runExclusive(() => {
      if (this.getGeneration() !== observedGeneration) {
        return false;
      }

      const currentMarker = this.readMarker();
      if (
        currentMarker?.status === 'success' &&
        currentMarker.expiresAt === metadata.expiresAt &&
        currentMarker.refreshExpiresAt === metadata.refreshExpiresAt &&
        currentMarker.rememberMe === metadata.rememberMe
      ) {
        return true;
      }

      const marker = this.storeSuccessMetadata(metadata);
      this.notifyMarker(marker, 'local');
      return true;
    });
  }

  private async runRefresh(
    execute: SessionRefreshExecutor,
    observedGeneration: string | null
  ): Promise<SessionRefreshResult> {
    if (this.requireCrossTabLock && !this.lockManager) {
      const marker = this.storeCompletion({ success: false, terminal: true });
      const result = this.resultFromMarker(marker, 'local');
      this.notifyMarker(marker, 'local');
      return result;
    }

    return this.runExclusive(async () => {
      const currentMarker = this.readMarker();
      const generationChanged =
        currentMarker?.generation !== observedGeneration;
      const completionAge = currentMarker
        ? this.now() - currentMarker.completedAt
        : Number.POSITIVE_INFINITY;
      const recentlyCompleted =
        completionAge >= 0 && completionAge <= this.freshnessMs;
      const terminalBoundary =
        currentMarker?.status === 'terminal_failure' ||
        currentMarker?.status === 'signed_out';

      if (
        currentMarker &&
        (terminalBoundary || generationChanged || recentlyCompleted)
      ) {
        return this.resultFromMarker(currentMarker, 'peer');
      }

      let execution: RefreshExecutionResult;
      try {
        execution = await execute();
      } catch {
        execution = { success: false, terminal: false };
      }

      const marker = this.storeCompletion(execution);
      const result: SessionRefreshResult = {
        ...execution,
        terminal: execution.terminal === true,
        signedOut: false,
        source: 'local',
        generation: marker.generation,
        metadata: metadataFromResponse(execution.response),
      };

      this.notifyMarker(marker, 'local');
      return result;
    });
  }

  private runExclusive<T>(callback: () => Promise<T> | T): Promise<T> {
    const previous = this.operationTail;
    let release = (): void => undefined;
    this.operationTail = new Promise<void>((resolve) => {
      release = resolve;
    });

    return (async (): Promise<T> => {
      await previous;
      try {
        if (!this.lockManager) {
          return await callback();
        }

        return await this.lockManager.request(
          REFRESH_LOCK_NAME,
          { mode: 'exclusive' },
          callback
        );
      } finally {
        release();
      }
    })();
  }

  private resultFromMarker(
    marker: StoredRefreshMarker,
    source: SessionRefreshResult['source']
  ): SessionRefreshResult {
    const success = marker.status === 'success';
    const terminal =
      marker.status === 'terminal_failure' || marker.status === 'signed_out';
    const result: SessionRefreshResult = {
      success,
      terminal,
      signedOut: marker.status === 'signed_out',
      source,
      generation: marker.generation,
      metadata: {
        expiresAt: marker.expiresAt,
        refreshExpiresAt: marker.refreshExpiresAt,
        rememberMe: marker.rememberMe,
      },
    };

    this.notifyMarker(marker, source);
    return result;
  }

  private storeCompletion(
    execution: RefreshExecutionResult
  ): StoredRefreshMarker {
    const status: RefreshMarkerStatus = execution.success
      ? 'success'
      : execution.terminal
        ? 'terminal_failure'
        : 'transient_failure';
    const marker: StoredRefreshMarker = {
      generation: this.createGeneration(),
      completedAt: this.now(),
      status,
      ...(execution.success ? metadataFromResponse(execution.response) : {}),
    };

    this.writeMarker(marker);
    return marker;
  }

  private storeBoundary(status: 'signed_out'): StoredRefreshMarker {
    const marker: StoredRefreshMarker = {
      generation: this.createGeneration(),
      completedAt: this.now(),
      status,
    };
    this.writeMarker(marker);
    return marker;
  }

  private storeSuccessMetadata(
    metadata: SessionRefreshMetadata
  ): StoredRefreshMarker {
    const marker: StoredRefreshMarker = {
      generation: this.createGeneration(),
      completedAt: this.now(),
      status: 'success',
      ...metadata,
    };
    this.writeMarker(marker);
    return marker;
  }

  private writeMarker(marker: StoredRefreshMarker): void {
    this.fallbackMarker = marker;
    try {
      this.storage?.setItem(
        SESSION_REFRESH_GENERATION_KEY,
        JSON.stringify(marker)
      );
    } catch {
      // Storage can be unavailable in privacy-restricted contexts. Production
      // refresh fails closed without an origin-wide Web Lock.
    }
  }

  private readMarker(): StoredRefreshMarker | null {
    if (this.storage) {
      try {
        const storedValue = this.storage.getItem(
          SESSION_REFRESH_GENERATION_KEY
        );
        if (!storedValue) {
          this.fallbackMarker = null;
          return null;
        }

        const marker = this.parseMarker(storedValue);
        if (marker) {
          this.fallbackMarker = marker;
          return marker;
        }

        return null;
      } catch {
        // Fall through to this tab's last known marker.
      }
    }

    return this.fallbackMarker;
  }

  private parseMarker(value: string): StoredRefreshMarker | null {
    try {
      const parsed: unknown = JSON.parse(value);
      return isStoredRefreshMarker(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private notifyMarker(
    marker: StoredRefreshMarker,
    source: SessionRefreshResult['source']
  ): void {
    if (
      marker.status === 'transient_failure' ||
      this.lastNotifiedGeneration === marker.generation
    ) {
      return;
    }

    this.lastNotifiedGeneration = marker.generation;
    const result = this.resultFromMarkerWithoutNotify(marker, source);
    const { response: _response, ...safeEvent } = result;
    void _response;
    this.listeners.forEach((listener) => listener(safeEvent));
  }

  private resultFromMarkerWithoutNotify(
    marker: StoredRefreshMarker,
    source: SessionRefreshResult['source']
  ): SessionRefreshResult {
    return {
      success: marker.status === 'success',
      terminal:
        marker.status === 'terminal_failure' || marker.status === 'signed_out',
      signedOut: marker.status === 'signed_out',
      source,
      generation: marker.generation,
      metadata: {
        expiresAt: marker.expiresAt,
        refreshExpiresAt: marker.refreshExpiresAt,
        rememberMe: marker.rememberMe,
      },
    };
  }

  private attachStorageListener(): void {
    if (this.storageListenerAttached || !this.eventTarget) {
      return;
    }

    this.eventTarget.addEventListener('storage', this.handleStorageEvent);
    this.storageListenerAttached = true;
  }

  private detachStorageListener(): void {
    if (!this.storageListenerAttached || !this.eventTarget) {
      return;
    }

    this.eventTarget.removeEventListener('storage', this.handleStorageEvent);
    this.storageListenerAttached = false;
  }
}

const getBrowserStorage = (): RefreshStorage | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

const browserStorage = getBrowserStorage();
const browserEventTarget =
  typeof window !== 'undefined'
    ? (window as unknown as RefreshEventTarget)
    : undefined;
const browserLockManager =
  typeof navigator !== 'undefined' && navigator.locks
    ? (navigator.locks as unknown as ExclusiveLockManager)
    : undefined;

export const sessionRefreshCoordinator = new SessionRefreshCoordinator({
  storage: browserStorage,
  eventTarget: browserEventTarget,
  lockManager: browserLockManager,
  requireCrossTabLock: import.meta.env.PROD,
});
