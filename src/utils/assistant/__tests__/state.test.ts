import { describe, expect, it } from 'vitest';
import type {
  AssistantEvent,
  AssistantSnapshot,
} from '@/types/assistant.types';
import {
  activeRun,
  mergeAssistantEvents,
  readInterrupts,
  transcript,
} from '../state';
const event = (
  seq: number,
  kind: string,
  data: Record<string, unknown>
): AssistantEvent => ({
  type: 'event',
  session_id: 's1',
  seq,
  kind,
  data,
  created_at: 123,
});
const snapshot = (events: AssistantEvent[] = []): AssistantSnapshot => ({
  session: {
    id: 's1',
    title: 'Conversation',
    status: 'running',
    profile_id: 'p1',
    created_at: 1,
    updated_at: 1,
  },
  messages: [{ id: 'm1', role: 'user', content: 'Hello', created_at: 1 }],
  run: { id: 'r1', status: 'running' },
  events,
  partial_content: 'Preserved ',
  last_seq: 100,
  has_older_messages: false,
});
describe('assistant replay state', () => {
  it('retains the durable partial response and appends only post-snapshot deltas', () => {
    const current = snapshot([
      event(90, 'message.delta', { content: 'already restored' }),
      event(101, 'message.delta', { content: 'response' }),
    ]);
    expect(transcript(current, 100).streaming).toBe('Preserved response');
  });
  it('deduplicates replay events and replaces the streaming buffer with completed output', () => {
    const delta = event(101, 'message.delta', { content: 'response' });
    const completed = event(102, 'message.completed', {
      content: 'Preserved response',
    });
    const events = mergeAssistantEvents([delta], [completed, delta]);
    expect(events.map((item) => item.seq)).toEqual([101, 102]);
    const result = transcript(snapshot(events), 100);
    expect(result.streaming).toBe('');
    expect(result.messages.map((item) => item.content)).toEqual([
      'Hello',
      'Preserved response',
    ]);
  });
  it('does not duplicate messages included in an atomic snapshot', () => {
    const current = snapshot([
      event(99, 'message.completed', { content: 'Finished' }),
    ]);
    current.partial_content = '';
    current.messages.push({
      id: 'm2',
      role: 'assistant',
      content: 'Finished',
      created_at: 2,
    });
    expect(transcript(current, 100).messages).toHaveLength(2);
  });
  it('renders a user turn started by another browser and clears old partial output', () => {
    const result = transcript(
      snapshot([
        event(101, 'message.created', { role: 'user', content: 'Next task' }),
      ]),
      100
    );
    expect(result.messages.at(-1)?.content).toBe('Next task');
    expect(result.streaming).toBe('');
  });
  it('accepts multiple questions and approval requests while waiting for input', () => {
    const current = snapshot([
      event(101, 'interrupt', {
        run_id: 'r1',
        interrupts: [
          {
            id: 'q1',
            type: 'ask_user',
            question: 'Which project?',
            options: ['A', 'B'],
          },
          {
            id: 'a1',
            type: 'approval',
            action_requests: [{ name: 'users__delete', args: { user: 'u1' } }],
          },
        ],
      }),
    ]);
    current.run = { id: 'r1', status: 'waiting_input' };
    expect(readInterrupts(current).map((item) => item.type)).toEqual([
      'ask_user',
      'approval',
    ]);
    expect(readInterrupts(current)[1].actions[0].name).toBe('users__delete');
    current.run.status = 'interrupted';
    expect(readInterrupts(current)).toEqual([]);
  });
  it('keeps cancellation pending but does not treat a server-interrupted run as resumable', () => {
    expect(activeRun({ id: 'r1', status: 'cancelling' })).toBe(true);
    expect(activeRun({ id: 'r1', status: 'waiting_input' })).toBe(true);
    expect(activeRun({ id: 'r1', status: 'interrupted' })).toBe(false);
  });
});
