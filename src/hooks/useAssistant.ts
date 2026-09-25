import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AssistantConnection,
  AssistantRpcError,
  type AssistantConnectionState,
} from '@/services/assistant.service';
import type {
  AssistantBootstrap,
  AssistantDecision,
  AssistantEvent,
  AssistantMethods,
  AssistantProfileInput,
  AssistantRun,
  AssistantSettings,
  AssistantSession,
  AssistantMessage,
  AssistantSnapshot,
} from '@/types/assistant.types';
import { sessionRefreshCoordinator } from '@/services/session-refresh-coordinator';
import { mergeAssistantEvents, textField } from '@/utils/assistant/state';

export function useAssistant(
  owner: string,
  refreshSession: () => Promise<boolean>
): {
  connectionState: AssistantConnectionState;
  bootstrap: AssistantBootstrap | null;
  snapshot: AssistantSnapshot | null;
  snapshotSeq: number;
  error: string | null;
  busy: boolean;
  selectSession: (id: string) => Promise<void>;
  createSession: () => Promise<void>;
  loadOlderSessions: () => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  hasOlderSessions: boolean;
  deleteSession: () => Promise<boolean>;
  send: (message: string, profileId?: string) => Promise<boolean>;
  cancel: () => Promise<void>;
  resume: (
    answer?: unknown,
    decisions?: AssistantDecision[],
    responses?: Record<string, unknown>
  ) => Promise<void>;
  updateSettings: (settings: Partial<AssistantSettings>) => Promise<boolean>;
  saveProfile: (profile: AssistantProfileInput) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  dismissError: () => void;
  retryConnection: () => void;
} {
  const [connectionState, setConnectionState] =
    useState<AssistantConnectionState>('connecting');
  const [bootstrap, setBootstrap] = useState<AssistantBootstrap | null>(null);
  const [snapshot, setSnapshot] = useState<AssistantSnapshot | null>(null);
  const [snapshotSeq, setSnapshotSeq] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasOlderSessions, setHasOlderSessions] = useState(false);
  const olderSessions = useRef(new Map<string, AssistantSession>());
  const olderPagesLoaded = useRef(false);
  const sessionHistoryCursor = useRef<number | undefined>(undefined);
  const olderMessages = useRef(new Map<string, AssistantMessage[]>());
  const messagesExhausted = useRef(new Set<string>());
  const connection = useRef<AssistantConnection | null>(null);
  const selected = useRef<string | null>(null);
  const currentSnapshot = useRef<AssistantSnapshot | null>(null);
  const bootstrapRef = useRef<AssistantBootstrap | null>(null);
  const generation = useRef(0);
  const subscribed = useRef<string | null>(null);
  const storageKey = `assistant.session.${owner}`;
  const refreshRef = useRef(refreshSession);
  useEffect(() => {
    refreshRef.current = refreshSession;
  }, [refreshSession]);
  const request = useCallback(
    <K extends keyof AssistantMethods>(
      method: K,
      params: AssistantMethods[K]['params']
    ): Promise<AssistantMethods[K]['result']> => {
      if (!connection.current)
        return Promise.reject(new Error('Assistant connection is not ready.'));
      return connection.current.request(method, params);
    },
    []
  );
  const loadSession = useCallback(
    async (id: string): Promise<void> => {
      const version = ++generation.current;
      const next = await request('sessions.get', { session_id: id });
      if (olderMessages.current.has(id)) {
        const messages = new Map(
          [...(olderMessages.current.get(id) ?? []), ...next.messages].map(
            (message) => [message.id, message]
          )
        );
        next.messages = Array.from(messages.values()).sort(
          (left, right) => left.created_at - right.created_at
        );
        if (messagesExhausted.current.has(id)) next.has_older_messages = false;
      }
      if (generation.current !== version) return;
      selected.current = id;
      if (
        bootstrapRef.current &&
        !bootstrapRef.current.sessions.some((session) => session.id === id)
      ) {
        olderSessions.current.set(id, next.session);
        const updated = {
          ...bootstrapRef.current,
          sessions: [...bootstrapRef.current.sessions, next.session].sort(
            (left, right) => right.updated_at - left.updated_at
          ),
        };
        bootstrapRef.current = updated;
        setBootstrap(updated);
      }
      const seq = next.last_seq;
      currentSnapshot.current = next;
      setSnapshot(next);
      setSnapshotSeq(seq);
      try {
        localStorage.setItem(storageKey, id);
      } catch {
        /* UI preference is optional. */
      }
      if (subscribed.current && subscribed.current !== id)
        await request('sessions.unsubscribe', {
          session_id: subscribed.current,
        });
      if (generation.current !== version) return;
      await request('sessions.subscribe', { session_id: id, after_seq: seq });
      subscribed.current = id;
    },
    [request, storageKey]
  );
  const reload = useCallback(async (): Promise<void> => {
    const value = await request('bootstrap', {});
    if (!olderPagesLoaded.current) {
      setHasOlderSessions(value.sessions.length === 100);
      sessionHistoryCursor.current = value.sessions.at(-1)?.updated_at;
    }
    const combined = new Map([
      ...olderSessions.current,
      ...value.sessions.map((session): [string, AssistantSession] => [
        session.id,
        session,
      ]),
    ]);
    value.sessions = Array.from(combined.values()).sort(
      (left, right) => right.updated_at - left.updated_at
    );
    bootstrapRef.current = value;
    setBootstrap(value);
  }, [request]);
  useEffect(() => {
    let alive = true;
    let socketConnected = false;
    const client = new AssistantConnection(() => refreshRef.current());
    connection.current = client;
    const offEvent = client.onEvent((event: AssistantEvent) => {
      if (!alive) return;
      if (event.kind === 'settings.updated')
        void reload().catch(() =>
          setError(
            'Unable to synchronize assistant settings. Reconnect before continuing.'
          )
        );
      if (event.session_id !== selected.current) return;
      setSnapshot((previous) => {
        if (
          !previous ||
          previous.session.id !== event.session_id ||
          event.seq <= previous.last_seq ||
          previous.events.some((known) => known.seq === event.seq)
        )
          return previous;
        let run = previous.run;
        if (event.kind === 'run.status') {
          const id =
            textField(event.data.id) || textField(event.data.run_id) || run?.id;
          if (id && typeof event.data.status === 'string')
            run = {
              id,
              status: event.data.status as AssistantRun['status'],
              error: textField(event.data.error) || null,
            };
        }
        if (event.kind === 'interrupt' && run)
          run = { ...run, status: 'waiting_input', interrupt: event.data };
        const next = {
          ...previous,
          run,
          events: mergeAssistantEvents(previous.events, [event]),
        };
        currentSnapshot.current = next;
        return next;
      });
      if (event.kind === 'run.status')
        void reload().catch(() => {
          /* Session events remain available during brief outages. */
        });
    });
    const offError = client.onError((failure) => {
      if (alive) setError(failure.message);
    });
    const offRefresh = sessionRefreshCoordinator.subscribe((event) => {
      if (event.success) client.reconnect();
      else if (event.terminal || event.signedOut) client.stop();
    });
    const loadGeneration = generation;
    const offState = client.onState((state) => {
      if (!alive) return;
      setConnectionState(state);
      socketConnected = state === 'connected';
      if (state !== 'connected') return;
      olderPagesLoaded.current = false;
      void (async () => {
        await reload();
        if (!alive) return;
        let remembered: string | null = selected.current;
        if (!remembered) {
          try {
            remembered = localStorage.getItem(storageKey);
          } catch {
            /* Storage can be unavailable. */
          }
        }
        const sessions = bootstrapRef.current?.sessions ?? [];
        const id = remembered ?? sessions[0]?.id;
        if (id) {
          try {
            await loadSession(id);
          } catch (failure) {
            if (
              failure instanceof AssistantRpcError &&
              failure.code === 'not_found' &&
              sessions[0]
            )
              await loadSession(sessions[0].id);
            else throw failure;
          }
        }
        if (alive) setError(null);
      })().catch((failure: unknown) => {
        if (alive)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Unable to restore assistant.'
          );
      });
    });
    const settingsTimer = setInterval(() => {
      if (!socketConnected) return;
      void client
        .request('settings.get', {})
        .then((settings) => {
          if (!alive) return;
          setBootstrap((current) => {
            if (!current) return current;
            const next = { ...current, settings };
            bootstrapRef.current = next;
            return next;
          });
        })
        .catch(() => {
          /* Reconnect and the next heartbeat refresh current settings. */
        });
    }, 20000);
    client.start();
    return () => {
      alive = false;
      clearInterval(settingsTimer);
      loadGeneration.current++;
      offRefresh();
      offError();
      offEvent();
      offState();
      client.stop();
      connection.current = null;
      currentSnapshot.current = null;
    };
  }, [loadSession, reload, storageKey]);
  const action = useCallback(
    async <T>(work: () => Promise<T>): Promise<T | undefined> => {
      setBusy(true);
      setError(null);
      try {
        return await work();
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : 'The assistant request failed.'
        );
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    []
  );
  const selectSession = useCallback(
    async (id: string): Promise<void> => {
      await action(() => loadSession(id));
    },
    [action, loadSession]
  );
  const createSession = useCallback(async (): Promise<void> => {
    await action(async () => {
      const session = await request('sessions.create', {});
      await reload();
      await loadSession(session.id);
    });
  }, [action, loadSession, reload, request]);
  const loadOlderMessages = useCallback(async (): Promise<void> => {
    await action(async () => {
      const current = currentSnapshot.current;
      const oldest = current?.messages[0];
      if (!current || !oldest) return;
      const next = await request('messages.list', {
        session_id: current.session.id,
        before_id: oldest.id,
        limit: 100,
      });
      const previous = olderMessages.current.get(current.session.id) ?? [];
      olderMessages.current.set(current.session.id, [
        ...next.messages,
        ...previous,
      ]);
      if (!next.has_more) messagesExhausted.current.add(current.session.id);
      setSnapshot((snapshot) => {
        if (!snapshot || snapshot.session.id !== current.session.id)
          return snapshot;
        const combined = new Map(
          [...next.messages, ...snapshot.messages].map((message) => [
            message.id,
            message,
          ])
        );
        const updated = {
          ...snapshot,
          has_older_messages: next.has_more,
          messages: Array.from(combined.values()).sort(
            (left, right) => left.created_at - right.created_at
          ),
        };
        currentSnapshot.current = updated;
        return updated;
      });
    });
  }, [action, request]);
  const loadOlderSessions = useCallback(async (): Promise<void> => {
    await action(async () => {
      const sessions = bootstrapRef.current?.sessions ?? [];
      if (!sessions.length) return;
      const next = await request('sessions.list', {
        before: sessionHistoryCursor.current,
        limit: 100,
      });
      olderPagesLoaded.current = true;
      sessionHistoryCursor.current =
        next.at(-1)?.updated_at ?? sessionHistoryCursor.current;
      next.forEach((session) => olderSessions.current.set(session.id, session));
      setHasOlderSessions(next.length === 100);
      setBootstrap((current) => {
        if (!current) return current;
        const combined = new Map(
          [...current.sessions, ...next].map((session) => [session.id, session])
        );
        const updated = {
          ...current,
          sessions: Array.from(combined.values()).sort(
            (left, right) => right.updated_at - left.updated_at
          ),
        };
        bootstrapRef.current = updated;
        return updated;
      });
    });
  }, [action, request]);
  const deleteSession = useCallback(async (): Promise<boolean> => {
    const result = await action(async () => {
      const id = selected.current;
      if (!id) return false;
      await request('sessions.unsubscribe', { session_id: id });
      subscribed.current = null;
      await request('sessions.delete', { session_id: id });
      olderSessions.current.delete(id);
      olderMessages.current.delete(id);
      messagesExhausted.current.delete(id);
      selected.current = null;
      currentSnapshot.current = null;
      setSnapshot(null);
      setSnapshotSeq(0);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* UI preference only. */
      }
      await reload();
      const next = bootstrapRef.current?.sessions[0];
      if (next) await loadSession(next.id);
      return true;
    });
    return result === true;
  }, [action, loadSession, reload, request, storageKey]);
  const send = useCallback(
    async (message: string, profileId?: string): Promise<boolean> => {
      const result = await action(async () => {
        let id = selected.current;
        if (!id) {
          const session = await request('sessions.create', {
            profile_id: profileId,
          });
          id = session.id;
          await loadSession(id);
        }
        const run = await request('runs.start', {
          session_id: id,
          message,
          request_id: crypto.randomUUID(),
          profile_id: profileId,
        });
        setSnapshot((previous) => (previous ? { ...previous, run } : previous));
        await loadSession(id);
        await reload();
        return true;
      });
      return result === true;
    },
    [action, loadSession, reload, request]
  );
  const cancel = useCallback(async (): Promise<void> => {
    await action(async () => {
      const current = currentSnapshot.current;
      if (!current?.run) return;
      await request('runs.cancel', {
        session_id: current.session.id,
        run_id: current.run.id,
      });
      await loadSession(current.session.id);
    });
  }, [action, loadSession, request]);
  const resume = useCallback(
    async (
      answer?: unknown,
      decisions?: AssistantDecision[],
      responses?: Record<string, unknown>
    ): Promise<void> => {
      await action(async () => {
        const current = currentSnapshot.current;
        if (!current?.run) return;
        await request('runs.resume', {
          session_id: current.session.id,
          run_id: current.run.id,
          answer,
          decisions,
          responses,
          request_id: crypto.randomUUID(),
        });
        await loadSession(current.session.id);
      });
    },
    [action, loadSession, request]
  );
  const updateSettings = useCallback(
    async (settings: Partial<AssistantSettings>): Promise<boolean> =>
      (await action(async () => {
        await request('settings.update', settings);
        await reload();
        return true;
      })) === true,
    [action, reload, request]
  );
  const saveProfile = useCallback(
    async (profile: AssistantProfileInput): Promise<boolean> =>
      (await action(async () => {
        await request('profiles.save', profile);
        await reload();
        return true;
      })) === true,
    [action, reload, request]
  );
  const deleteProfile = useCallback(
    async (id: string): Promise<boolean> =>
      (await action(async () => {
        await request('profiles.delete', { id });
        await reload();
        return true;
      })) === true,
    [action, reload, request]
  );
  return {
    connectionState,
    bootstrap,
    snapshot,
    snapshotSeq,
    error,
    busy,
    selectSession,
    createSession,
    loadOlderSessions,
    loadOlderMessages,
    hasOlderSessions,
    deleteSession,
    send,
    cancel,
    resume,
    updateSettings,
    saveProfile,
    deleteProfile,
    dismissError: () => setError(null),
    retryConnection: () => {
      setError(null);
      connection.current?.retry();
    },
  };
}
