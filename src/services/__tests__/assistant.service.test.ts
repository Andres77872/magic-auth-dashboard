import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AssistantConnection,
  AssistantRpcError,
  assistantWebSocketUrl,
  isAssistantEvent,
} from '../assistant.service';

class Socket {
  static all: Socket[] = [];
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: { id: string; method: string; params: unknown }[] = [];
  url: string;
  constructor(url: string) {
    this.url = url;
    Socket.all.push(this);
  }
  send(value: string): void {
    this.sent.push(
      JSON.parse(value) as { id: string; method: string; params: unknown }
    );
  }
  close(code = 1000): void {
    this.onclose?.({ code });
  }
  open(): void {
    this.onopen?.();
  }
  receive(value: unknown): void {
    this.onmessage?.({ data: JSON.stringify(value) });
  }
}
const event = {
  type: 'event',
  session_id: 'session-1',
  seq: 1,
  kind: 'message.delta',
  data: { content: 'Hello' },
  created_at: 1790292000.2,
};
describe('assistant WebSocket transport', () => {
  let connection: AssistantConnection;
  beforeEach(() => {
    vi.useFakeTimers();
    Socket.all = [];
    vi.stubGlobal('WebSocket', Socket);
    connection = new AssistantConnection(
      vi.fn().mockResolvedValue(true),
      'wss://api.example/admin/assistant/ws'
    );
  });
  afterEach(() => {
    connection.stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('uses browser cookies without tokens in the URL', () => {
    expect(assistantWebSocketUrl('https://auth.example')).toBe(
      'wss://auth.example/admin/assistant/ws'
    );
    expect(assistantWebSocketUrl('http://localhost:5000')).toBe(
      'ws://localhost:5000/admin/assistant/ws'
    );
  });
  it('accepts the backend Unix-seconds event envelope and rejects malformed frames', () => {
    expect(isAssistantEvent(event)).toBe(true);
    expect(isAssistantEvent({ ...event, seq: -1 })).toBe(false);
    expect(isAssistantEvent({ ...event, created_at: '2026-09-24' })).toBe(
      false
    );
    expect(isAssistantEvent({ ...event, data: null })).toBe(false);
  });
  it('matches RPC replies and exposes actionable errors', async () => {
    connection.start();
    const socket = Socket.all[0];
    socket.open();
    const request = connection.request('ping', {});
    const id = socket.sent[0].id;
    socket.receive({ id, result: { time: 1 } });
    await expect(request).resolves.toEqual({ time: 1 });
    const failed = connection.request('ping', {});
    const rejection = expect(failed).rejects.toBeInstanceOf(AssistantRpcError);
    socket.receive({
      id: socket.sent[1].id,
      error: { code: 'unauthorized', message: 'Sign in again' },
    });
    await rejection;
  });
  it('delivers durable events and ignores unrelated frames', () => {
    const listener = vi.fn();
    connection.onEvent(listener);
    connection.start();
    const socket = Socket.all[0];
    socket.open();
    socket.receive(event);
    socket.receive({ type: 'event', data: {} });
    socket.receive({ id: 'unknown', result: {} });
    expect(listener).toHaveBeenCalledExactlyOnceWith(event);
  });
  it('reconnects without replaying an uncertain write command', async () => {
    connection.start();
    const socket = Socket.all[0];
    socket.open();
    const pending = connection.request('runs.start', {
      session_id: 'session-1',
      message: 'Change a user',
      request_id: 'run-request-1',
    });
    const rejection = expect(pending).rejects.toThrow('may have been accepted');
    socket.close(1006);
    await rejection;
    await vi.advanceTimersByTimeAsync(1300);
    expect(Socket.all).toHaveLength(2);
    Socket.all[1].open();
    expect(Socket.all[1].sent).toEqual([]);
  });
  it('refreshes expired cookies using the supplied coordinated refresh callback', async () => {
    const refresh = vi.fn().mockResolvedValue(true);
    connection = new AssistantConnection(refresh);
    connection.start();
    Socket.all[0].open();
    Socket.all[0].close(4401);
    await vi.advanceTimersByTimeAsync(1300);
    expect(refresh).toHaveBeenCalledOnce();
    expect(Socket.all).toHaveLength(2);
  });
  it('retries transient refresh failures with increasing authentication backoff', async () => {
    const refresh = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);
    connection = new AssistantConnection(refresh);
    connection.start();
    Socket.all[0].open();
    Socket.all[0].close(4401);
    await vi.advanceTimersByTimeAsync(1300);
    expect(Socket.all).toHaveLength(2);
    Socket.all[1].open();
    Socket.all[1].close(4401);
    await vi.advanceTimersByTimeAsync(1500);
    expect(Socket.all).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(Socket.all).toHaveLength(3);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
  it('reconnects immediately after cookie rotation without a second refresh or duplicate socket', async () => {
    const refresh = vi.fn().mockImplementation(() => {
      connection.reconnect();
      return Promise.resolve(true);
    });
    connection = new AssistantConnection(refresh);
    connection.start();
    Socket.all[0].open();
    Socket.all[0].close(4401);
    await vi.advanceTimersByTimeAsync(1300);
    expect(Socket.all).toHaveLength(2);
    expect(refresh).toHaveBeenCalledOnce();
  });
  it('stops on forbidden access and does not reconnect after disposal', async () => {
    connection.start();
    Socket.all[0].open();
    Socket.all[0].close(4403);
    await vi.advanceTimersByTimeAsync(31000);
    expect(Socket.all).toHaveLength(1);
    connection.stop();
    await vi.advanceTimersByTimeAsync(31000);
    expect(Socket.all).toHaveLength(1);
  });
  it('sends a heartbeat while the panel is idle', async () => {
    connection.start();
    Socket.all[0].open();
    await vi.advanceTimersByTimeAsync(20000);
    expect(Socket.all[0].sent[0].method).toBe('ping');
    Socket.all[0].receive({
      id: Socket.all[0].sent[0].id,
      result: { time: 2 },
    });
  });
});
