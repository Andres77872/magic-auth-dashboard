import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AssistantBootstrap,
  AssistantEvent,
  AssistantSnapshot,
} from '@/types/assistant.types';
import { useAssistant } from '../useAssistant';
const mock = vi.hoisted(() => ({
  request: vi.fn(),
  stop: vi.fn(),
  onEvent: null as null | ((event: AssistantEvent) => void),
  onState: null as null | ((state: 'connected' | 'reconnecting') => void),
}));
vi.mock('@/services/assistant.service', () => ({
  AssistantConnection: class {
    request = mock.request;
    onEvent(callback: (event: AssistantEvent) => void): () => void {
      mock.onEvent = callback;
      return () => undefined;
    }
    onState(
      callback: (state: 'connected' | 'reconnecting') => void
    ): () => void {
      mock.onState = callback;
      return () => undefined;
    }
    onError(): () => void {
      return () => undefined;
    }
    start(): void {
      queueMicrotask(() => mock.onState?.('connected'));
    }
    reconnect(): void {
      mock.onState?.('connected');
    }
    stop = mock.stop;
  },
}));
const session = {
  id: 's1',
  title: 'Saved task',
  status: 'running' as const,
  profile_id: 'p1',
  created_at: 1,
  updated_at: 1,
};
const bootstrap: AssistantBootstrap = {
  settings: {
    enabled: true,
    mutations_enabled: false,
    enabled_skills: [],
    enabled_tools: [],
    features: { planning: true, memory: true, ask_user: true, subagents: true },
    default_profile_id: 'p1',
  },
  profiles: [],
  skills: [],
  tools: [],
  sessions: [session],
  runtime_available: true,
};
const snapshot: AssistantSnapshot = {
  session,
  messages: [],
  events: [],
  run: { id: 'r1', status: 'running' },
  partial_content: 'Restored generation',
  last_seq: 42,
  has_older_messages: false,
};
const refresh = vi.fn().mockResolvedValue(true);
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mock.request.mockImplementation(
    (method: string, params: { session_id?: string }) => {
      if (method === 'bootstrap') return Promise.resolve(bootstrap);
      if (method === 'sessions.get')
        return Promise.resolve({
          ...snapshot,
          session: { ...session, id: params.session_id },
        });
      return Promise.resolve({ subscribed: method === 'sessions.subscribe' });
    }
  );
});
describe('assistant session restoration', () => {
  it('hydrates persisted output, subscribes after the atomic watermark and reconnects using a fresh snapshot', async () => {
    const { result, unmount } = renderHook(() =>
      useAssistant('root-1', refresh)
    );
    await waitFor(() =>
      expect(result.current.snapshot?.partial_content).toBe(
        'Restored generation'
      )
    );
    expect(mock.request).toHaveBeenCalledWith('sessions.subscribe', {
      session_id: 's1',
      after_seq: 42,
    });
    act(() =>
      mock.onEvent?.({
        type: 'event',
        session_id: 's1',
        seq: 43,
        kind: 'message.delta',
        data: { content: ' live' },
        created_at: 1,
      })
    );
    expect(result.current.snapshot?.events).toHaveLength(1);
    act(() =>
      mock.onEvent?.({
        type: 'event',
        session_id: 's1',
        seq: 43,
        kind: 'message.delta',
        data: { content: ' live' },
        created_at: 1,
      })
    );
    expect(result.current.snapshot?.events).toHaveLength(1);
    act(() => mock.onState?.('reconnecting'));
    act(() => mock.onState?.('connected'));
    await waitFor(() =>
      expect(
        mock.request.mock.calls.filter(
          ([method]) => method === 'sessions.subscribe'
        )
      ).toHaveLength(2)
    );
    unmount();
    expect(mock.stop).toHaveBeenCalledOnce();
  });
  it('unsubscribes the previous conversation when switching sessions', async () => {
    const { result, unmount } = renderHook(() =>
      useAssistant('root-1', refresh)
    );
    await waitFor(() => expect(result.current.snapshot?.session.id).toBe('s1'));
    await act(() => result.current.selectSession('s2'));
    expect(mock.request).toHaveBeenCalledWith('sessions.unsubscribe', {
      session_id: 's1',
    });
    expect(mock.request).toHaveBeenCalledWith('sessions.subscribe', {
      session_id: 's2',
      after_seq: 42,
    });
    unmount();
  });
  it('prepends earlier messages while preserving live events and the snapshot cursor', async () => {
    mock.request.mockImplementation((method: string) => {
      if (method === 'bootstrap') return Promise.resolve(bootstrap);
      if (method === 'sessions.get')
        return Promise.resolve({
          ...snapshot,
          messages: [
            { id: 'm2', role: 'user', content: 'Recent', created_at: 2 },
          ],
          has_older_messages: true,
        });
      if (method === 'messages.list')
        return Promise.resolve({
          messages: [
            { id: 'm1', role: 'user', content: 'Older', created_at: 1 },
          ],
          has_more: false,
        });
      return Promise.resolve({ subscribed: true });
    });
    const { result, unmount } = renderHook(() =>
      useAssistant('root-1', refresh)
    );
    await waitFor(() =>
      expect(result.current.snapshot?.messages).toHaveLength(1)
    );
    act(() =>
      mock.onEvent?.({
        type: 'event',
        session_id: 's1',
        seq: 43,
        kind: 'message.delta',
        data: { content: ' live' },
        created_at: 3,
      })
    );
    await act(() => result.current.loadOlderMessages());
    expect(
      result.current.snapshot?.messages.map((message) => message.id)
    ).toEqual(['m1', 'm2']);
    expect(result.current.snapshot?.events).toHaveLength(1);
    expect(result.current.snapshotSeq).toBe(42);
    expect(result.current.snapshot?.has_older_messages).toBe(false);
    expect(mock.request).toHaveBeenCalledWith('messages.list', {
      session_id: 's1',
      before_id: 'm2',
      limit: 100,
    });
    unmount();
  });
  it('can restore a saved session outside the most recent history page', async () => {
    localStorage.setItem('assistant.session.root-1', 'older-session');
    const { result, unmount } = renderHook(() =>
      useAssistant('root-1', refresh)
    );
    await waitFor(() =>
      expect(result.current.snapshot?.session.id).toBe('older-session')
    );
    expect(
      result.current.bootstrap?.sessions.some(
        (item) => item.id === 'older-session'
      )
    ).toBe(true);
    unmount();
  });
  it('synchronizes settings changes from other tabs', async () => {
    const { result, unmount } = renderHook(() =>
      useAssistant('root-1', refresh)
    );
    await waitFor(() => expect(result.current.bootstrap).not.toBeNull());
    const count = mock.request.mock.calls.filter(
      ([method]) => method === 'bootstrap'
    ).length;
    act(() =>
      mock.onEvent?.({
        type: 'event',
        session_id: 's1',
        seq: 44,
        kind: 'settings.updated',
        data: { mutations_enabled: true },
        created_at: 1,
      })
    );
    await waitFor(() =>
      expect(
        mock.request.mock.calls.filter(([method]) => method === 'bootstrap')
      ).toHaveLength(count + 1)
    );
    unmount();
  });
});
