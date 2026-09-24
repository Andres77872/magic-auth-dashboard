import { API_CONFIG } from '@/utils/constants';
import type { AssistantEvent, AssistantMethods } from '@/types/assistant.types';

export type AssistantConnectionState =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';
type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
export function assistantWebSocketUrl(baseUrl = API_CONFIG.BASE_URL): string {
  const url = new URL('/admin/assistant/ws', baseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
export class AssistantRpcError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'AssistantRpcError';
    this.code = code;
  }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function isAssistantEvent(value: unknown): value is AssistantEvent {
  return (
    isRecord(value) &&
    value.type === 'event' &&
    typeof value.session_id === 'string' &&
    typeof value.kind === 'string' &&
    typeof value.seq === 'number' &&
    Number.isSafeInteger(value.seq) &&
    value.seq > 0 &&
    isRecord(value.data) &&
    typeof value.created_at === 'number' &&
    Number.isFinite(value.created_at)
  );
}

/** Cookies are browser-owned. Reconnect only restores reads; commands are never automatically retried. */
export class AssistantConnection {
  private socket: WebSocket | null = null;
  private stopped = true;
  private attempt = 0;
  private authFailures = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private pending = new Map<string, Pending>();
  private eventListeners = new Set<(event: AssistantEvent) => void>();
  private stateListeners = new Set<(state: AssistantConnectionState) => void>();
  private state: AssistantConnectionState = 'disconnected';
  private readonly refreshSession: () => Promise<boolean>;
  private readonly url: string;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private errorListeners = new Set<(error: Error) => void>();
  constructor(
    refreshSession: () => Promise<boolean>,
    url = assistantWebSocketUrl()
  ) {
    this.refreshSession = refreshSession;
    this.url = url;
  }
  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => {
      this.errorListeners.delete(listener);
    };
  }
  onEvent(listener: (event: AssistantEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }
  onState(listener: (state: AssistantConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }
  private setState(state: AssistantConnectionState): void {
    this.state = state;
    this.stateListeners.forEach((listener) => listener(state));
  }
  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.connect();
  }
  private connect(): void {
    if (this.stopped || this.socket) return;
    this.setState(this.attempt ? 'reconnecting' : 'connecting');
    const socket = new WebSocket(this.url);
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket || this.stopped) return;
      this.attempt = 0;
      this.setState('connected');
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        void this.request('ping', {}).catch(() => {
          if (this.socket === socket) socket.close(4000, 'Heartbeat timed out');
        });
      }, 20000);
    };
    socket.onmessage = (event: MessageEvent<unknown>) => {
      if (this.socket !== socket || typeof event.data !== 'string') return;
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (isAssistantEvent(message)) {
        this.eventListeners.forEach((listener) => listener(message));
        return;
      }
      if (!isRecord(message)) return;
      if (message.type === 'subscription.error' && isRecord(message.error)) {
        this.errorListeners.forEach((listener) =>
          listener(
            new Error(
              typeof message.error === 'object' &&
                message.error &&
                'message' in message.error &&
                typeof message.error.message === 'string'
                ? message.error.message
                : 'Conversation subscription failed.'
            )
          )
        );
        return;
      }
      if (typeof message.id !== 'string') return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (isRecord(message.error)) {
        pending.reject(
          new AssistantRpcError(
            typeof message.error.code === 'string'
              ? message.error.code
              : 'ASSISTANT_ERROR',
            typeof message.error.message === 'string'
              ? message.error.message
              : 'Assistant request failed.'
          )
        );
      } else if ('result' in message) {
        this.authFailures = 0;
        pending.resolve(message.result);
      } else {
        pending.reject(new Error('Invalid assistant response.'));
      }
    };
    socket.onerror = () => {
      /* close owns retry and request rejection */
    };
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.socket = null;
      clearInterval(this.heartbeatTimer);
      this.rejectPending(
        'Connection interrupted. Your request may have been accepted; reconnect to inspect the session before retrying.'
      );
      if (this.stopped) return;
      if (event.code === 4403 || event.code === 1008) {
        this.stopped = true;
        this.setState('disconnected');
        return;
      }
      this.setState('reconnecting');
      const backoff =
        event.code === 4401 ? this.authFailures++ : this.attempt++;
      const delay = Math.min(30000, 1000 * 2 ** Math.min(backoff, 5));
      this.reconnectTimer = setTimeout(
        () => {
          if (event.code === 4401) {
            // AuthContext delegates refresh to the existing cross-tab coordinator.
            void this.refreshSession().then(
              (ok) => {
                // False can mean a transient refresh outage; terminal logout
                // is handled by the shared coordinator and unmounts this client.
                if (ok || !this.stopped) this.connect();
              },
              () => this.connect()
            );
          } else {
            this.connect();
          }
        },
        delay + Math.floor(Math.random() * 250)
      );
    };
  }
  request<K extends keyof AssistantMethods>(
    method: K,
    params: AssistantMethods[K]['params']
  ): Promise<AssistantMethods[K]['result']> {
    if (!this.socket || this.state !== 'connected')
      return Promise.reject(
        new Error(
          'The assistant is reconnecting. Wait for the connection before sending.'
        )
      );
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new Error(
            'Assistant request timed out. Inspect the restored session before retrying a change.'
          )
        );
      }, 30000);
      this.pending.set(id, {
        resolve: (value) => resolve(value as AssistantMethods[K]['result']),
        reject,
        timer,
      });
      try {
        this.socket?.send(JSON.stringify({ id, method, params }));
      } catch {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error('Unable to send the assistant request.'));
      }
    });
  }
  private rejectPending(message: string): void {
    this.pending.forEach((pending) => {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
    });
    this.pending.clear();
  }
  reconnect(): void {
    if (this.stopped) return;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.heartbeatTimer);
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, 'Session credentials refreshed');
    this.rejectPending(
      'Session credentials refreshed. The connection is restoring; inspect the session before retrying a change.'
    );
    this.connect();
  }
  stop(): void {
    this.stopped = true;
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.reconnectTimer);
    this.attempt = 0;
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, 'Assistant disconnected');
    this.rejectPending('Assistant connection closed.');
    this.setState('disconnected');
  }
}
