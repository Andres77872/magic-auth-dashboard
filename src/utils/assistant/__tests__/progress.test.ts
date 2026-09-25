import { describe, expect, it } from 'vitest';
import type {
  AssistantEvent,
  AssistantRun,
  AssistantSnapshot,
  AssistantTool,
} from '@/types/assistant.types';
import {
  describeEvent,
  formatElapsed,
  humanizeName,
  runProgress,
  runStatus,
  toolLabel,
} from '../progress';

const tools: AssistantTool[] = [
  {
    id: 'users__list',
    name: 'users__list',
    description: 'List users',
    skill_id: 'users',
    mutating: false,
    method: 'GET',
    path: '/users',
    default_enabled: true,
  },
  {
    id: 'users__delete',
    name: 'users__delete',
    description: 'Delete user',
    skill_id: 'users',
    mutating: true,
    method: 'DELETE',
    path: '/users/{user_hash}',
    default_enabled: false,
  },
];
const event = (
  seq: number,
  kind: string,
  data: Record<string, unknown>,
  created_at = 1000 + seq
): AssistantEvent => ({
  type: 'event',
  session_id: 's1',
  seq,
  kind,
  data: { run_id: 'r1', ...data },
  created_at,
});
const snapshot = (
  events: AssistantEvent[],
  run: AssistantRun | null = { id: 'r1', status: 'running' }
): AssistantSnapshot => ({
  session: {
    id: 's1',
    title: 'Conversation',
    status: run?.status ?? 'idle',
    profile_id: 'p1',
    created_at: 1,
    updated_at: 1,
  },
  messages: [],
  run,
  events,
  partial_content: '',
  last_seq: events.at(-1)?.seq ?? 0,
  has_older_messages: false,
});

describe('assistant labels', () => {
  it('maps run statuses to friendly labels and never leaks snake case', () => {
    expect(runStatus('waiting_input')).toEqual({
      label: 'Needs your input',
      tone: 'attention',
    });
    expect(runStatus('running').label).toBe('Working');
    expect(runStatus('some_new_state')).toEqual({
      label: 'Some new state',
      tone: 'muted',
    });
    expect(humanizeName('')).toBe('Unknown');
  });
  it('prefers catalog descriptions, then built-in names, then a humanized id', () => {
    expect(toolLabel('users__list', tools)).toBe('List users');
    expect(toolLabel('write_todos', tools)).toBe('Update the plan');
    expect(toolLabel('projects__archive', tools)).toBe('Projects archive');
  });
  it('formats elapsed time compactly', () => {
    expect(formatElapsed(4.7)).toBe('4s');
    expect(formatElapsed(65)).toBe('1m 05s');
    expect(formatElapsed(3720)).toBe('1h 02m');
    expect(formatElapsed(-3)).toBe('0s');
  });
});

describe('run progress', () => {
  it('is absent when no run is active', () => {
    expect(runProgress(null, '')).toBeNull();
    expect(
      runProgress(snapshot([], { id: 'r1', status: 'completed' }), '')
    ).toBeNull();
  });
  it('reports queued, thinking, writing, waiting, and stopping phases', () => {
    expect(
      runProgress(snapshot([], { id: 'r1', status: 'queued' }), '')?.phase
    ).toBe('queued');
    expect(runProgress(snapshot([]), '')?.headline).toBe('Thinking');
    expect(runProgress(snapshot([]), 'Partial answer')?.phase).toBe('writing');
    expect(
      runProgress(snapshot([], { id: 'r1', status: 'waiting_input' }), '')
        ?.headline
    ).toBe('Waiting for your response');
    expect(
      runProgress(snapshot([], { id: 'r1', status: 'cancelling' }), '')?.phase
    ).toBe('stopping');
  });
  it('tracks tool steps with catalog labels, outcomes, and write flags', () => {
    const progress = runProgress(
      snapshot([
        event(1, 'run.status', { status: 'running' }),
        event(2, 'tool.started', { id: 't1', name: 'users__list' }),
        event(3, 'tool.completed', {
          id: 't1',
          name: 'users__list',
          status: 'success',
        }),
        event(4, 'tool.started', { id: 't2', name: 'users__delete' }),
        event(5, 'tool.started', { id: 't3', name: 'write_todos' }),
        event(6, 'usage', { total_tokens: 1234 }),
      ]),
      '',
      tools
    );
    expect(progress?.phase).toBe('tool');
    expect(progress?.headline).toBe('Delete user');
    expect(progress?.steps).toEqual([
      expect.objectContaining({
        label: 'List users',
        status: 'done',
        mutating: false,
      }),
      expect.objectContaining({
        label: 'Delete user',
        status: 'running',
        mutating: true,
      }),
    ]);
    expect(progress?.startedAt).toBe(1001);
    expect(progress?.totalTokens).toBe(1234);
  });
  it('marks failed tools and names delegated subagents', () => {
    const progress = runProgress(
      snapshot([
        event(1, 'tool.started', { id: 't1', name: 'users__list' }),
        event(2, 'tool.completed', { id: 't1', status: 'error' }),
        event(3, 'tool.started', { id: 't2', name: 'task' }),
        event(4, 'subagent.started', { id: 't2', name: 'users-specialist' }),
      ]),
      '',
      tools
    );
    expect(progress?.steps.map((step) => [step.label, step.status])).toEqual([
      ['List users', 'failed'],
      ['Delegate to Users specialist', 'running'],
    ]);
  });
  it('uses the latest plan and ignores events from earlier runs', () => {
    const progress = runProgress(
      snapshot([
        event(1, 'tool.started', {
          id: 'old',
          name: 'users__list',
          run_id: 'r0',
        }),
        event(2, 'task.updated', {
          todos: [{ content: 'Old step', status: 'pending' }],
        }),
        event(3, 'task.updated', {
          todos: [
            { content: 'Look up users', status: 'completed' },
            { content: 'Summarize', status: 'in_progress' },
            { content: '', status: 'pending' },
            'invalid',
          ],
        }),
      ]),
      ''
    );
    expect(progress?.steps).toEqual([]);
    expect(progress?.todos).toEqual([
      { content: 'Look up users', status: 'completed' },
      { content: 'Summarize', status: 'in_progress' },
    ]);
    expect(progress?.headline).toBe('Thinking');
  });
});

describe('activity descriptions', () => {
  it('describes tool, audit, plan, and run events for people', () => {
    expect(
      describeEvent(event(1, 'tool.started', { name: 'users__list' }), tools)
        .label
    ).toBe('Started: List users');
    const audit = describeEvent(
      event(2, 'tool.audit', {
        operation: 'users__delete',
        mutates: true,
        ok: false,
        status: 403,
        error: 'forbidden',
      }),
      tools
    );
    expect(audit).toMatchObject({
      label: 'Changed data: Delete user',
      detail: 'Failed · HTTP 403 · forbidden',
      tone: 'danger',
    });
    expect(
      describeEvent(
        event(3, 'task.updated', {
          todos: [
            { content: 'A', status: 'completed' },
            { content: 'B', status: 'pending' },
          ],
        })
      )
    ).toMatchObject({ label: 'Plan updated', detail: '1 of 2 steps done' });
    expect(
      describeEvent(event(4, 'run.status', { status: 'failed', error: 'Boom' }))
    ).toMatchObject({ label: 'Run failed', detail: 'Boom', tone: 'danger' });
    expect(
      describeEvent(event(6, 'run.status', { status: 'running' })).label
    ).toBe('Run started');
    expect(describeEvent(event(5, 'custom.thing', {})).label).toBe(
      'Custom thing'
    );
  });
});
