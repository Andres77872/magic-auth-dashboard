import type {
  AssistantEvent,
  AssistantRunStatus,
  AssistantSnapshot,
  AssistantTool,
} from '@/types/assistant.types';
import { activeRun, record, textField } from './state';

export type AssistantStatusTone =
  | 'active'
  | 'attention'
  | 'success'
  | 'danger'
  | 'muted';

const RUN_STATUS: Record<
  AssistantRunStatus | 'idle',
  { label: string; tone: AssistantStatusTone }
> = {
  idle: { label: 'Idle', tone: 'muted' },
  queued: { label: 'Queued', tone: 'active' },
  running: { label: 'Working', tone: 'active' },
  waiting_input: { label: 'Needs your input', tone: 'attention' },
  cancelling: { label: 'Stopping', tone: 'active' },
  completed: { label: 'Completed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Stopped', tone: 'muted' },
  interrupted: { label: 'Interrupted', tone: 'attention' },
};

/** Sentence-case a snake/dotted identifier without inventing meaning. */
export function humanizeName(name: string): string {
  const words = name.replace(/[_.\-\s]+/g, ' ').trim();
  return words ? words[0].toUpperCase() + words.slice(1) : 'Unknown';
}

export function runStatus(status: string): {
  label: string;
  tone: AssistantStatusTone;
} {
  return (
    RUN_STATUS[status as AssistantRunStatus] ?? {
      label: humanizeName(status),
      tone: 'muted',
    }
  );
}

/** Agent-framework tools that are not part of the app tool catalog. */
const BUILTIN_TOOLS: Record<string, string> = {
  write_todos: 'Update the plan',
  task: 'Delegate to a subagent',
  ask_user: 'Ask for clarification',
  ls: 'Browse skill files',
  read_file: 'Read skill instructions',
  glob: 'Search skill files',
  grep: 'Search skill content',
};

export function toolLabel(name: string, tools: AssistantTool[] = []): string {
  const tool = tools.find((candidate) => candidate.name === name);
  return tool?.description || BUILTIN_TOOLS[name] || humanizeName(name);
}

export type AssistantStepStatus = 'running' | 'done' | 'failed';
export interface AssistantStep {
  id: string;
  name: string;
  label: string;
  status: AssistantStepStatus;
  mutating: boolean;
}
export interface AssistantTodo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}
export type AssistantPhase =
  | 'queued'
  | 'thinking'
  | 'tool'
  | 'writing'
  | 'waiting'
  | 'stopping';
export interface AssistantProgress {
  phase: AssistantPhase;
  /** Human sentence for the current phase. */
  headline: string;
  steps: AssistantStep[];
  todos: AssistantTodo[];
  /** Unix seconds of the first event observed for the run. */
  startedAt: number | null;
  totalTokens: number;
}

function eventsForRun(
  events: AssistantEvent[],
  runId: string
): AssistantEvent[] {
  return events.filter((event) => {
    const owner = textField(event.data.run_id);
    return !owner || owner === runId;
  });
}

export function readTodos(events: AssistantEvent[]): AssistantTodo[] {
  const latest = [...events]
    .reverse()
    .find((event) => event.kind === 'task.updated');
  const todos: unknown[] = Array.isArray(latest?.data.todos)
    ? latest.data.todos
    : [];
  return todos
    .map((todo) => {
      const item = record(todo);
      const status = textField(item.status);
      return {
        content: textField(item.content),
        status:
          status === 'completed' || status === 'in_progress'
            ? status
            : 'pending',
      } satisfies AssistantTodo;
    })
    .filter((todo) => todo.content);
}

/**
 * Derive a live, human-readable view of the active run from its events. The
 * backend never streams tool arguments here, only names and outcomes.
 */
export function runProgress(
  snapshot: AssistantSnapshot | null,
  streaming: string,
  tools: AssistantTool[] = []
): AssistantProgress | null {
  const run = snapshot?.run;
  if (!snapshot || !run || !activeRun(run)) return null;
  const events = eventsForRun(snapshot.events, run.id);
  const steps = new Map<string, AssistantStep>();
  let totalTokens = 0;
  for (const event of events) {
    const id = textField(event.data.id);
    const name = textField(event.data.name);
    if (event.kind === 'tool.started' && id && name !== 'write_todos') {
      const catalog = tools.find((tool) => tool.name === name);
      steps.set(id, {
        id,
        name,
        label: toolLabel(name, tools),
        status: 'running',
        mutating: catalog?.mutating ?? false,
      });
    }
    if (event.kind === 'tool.completed' && id && steps.has(id)) {
      const step = steps.get(id);
      if (step)
        steps.set(id, {
          ...step,
          status: textField(event.data.status) === 'error' ? 'failed' : 'done',
        });
    }
    if (event.kind === 'subagent.started' && id && steps.has(id)) {
      const step = steps.get(id);
      if (step && name)
        steps.set(id, { ...step, label: `Delegate to ${humanizeName(name)}` });
    }
    if (event.kind === 'usage' && typeof event.data.total_tokens === 'number')
      totalTokens = event.data.total_tokens;
  }
  const list = Array.from(steps.values());
  const running = [...list].reverse().find((step) => step.status === 'running');
  let phase: AssistantPhase;
  let headline: string;
  if (run.status === 'queued') {
    phase = 'queued';
    headline = 'Queued — starting shortly';
  } else if (run.status === 'cancelling') {
    phase = 'stopping';
    headline = 'Stopping…';
  } else if (run.status === 'waiting_input') {
    phase = 'waiting';
    headline = 'Waiting for your response';
  } else if (running) {
    phase = 'tool';
    headline = running.label;
  } else if (streaming) {
    phase = 'writing';
    headline = 'Writing a response';
  } else {
    phase = 'thinking';
    headline = list.length ? 'Reviewing results' : 'Thinking';
  }
  return {
    phase,
    headline,
    steps: list,
    todos: readTodos(events),
    startedAt: events[0]?.created_at ?? null,
    totalTokens,
  };
}

export interface AssistantActivityEntry {
  seq: number;
  label: string;
  detail: string;
  tone: AssistantStatusTone;
  createdAt: number;
}

const RUN_EVENT_LABELS: Record<string, string> = {
  queued: 'Run queued',
  running: 'Run started',
  waiting_input: 'Waiting for your input',
  cancelling: 'Stopping the run',
  completed: 'Run completed',
  failed: 'Run failed',
  cancelled: 'Run stopped',
  interrupted: 'Run interrupted',
};

/** Turn a raw event into a short log line for the activity drawer. */
export function describeEvent(
  event: AssistantEvent,
  tools: AssistantTool[] = []
): AssistantActivityEntry {
  const name = textField(event.data.name);
  const base = { seq: event.seq, createdAt: event.created_at, detail: '' };
  switch (event.kind) {
    case 'run.status': {
      const value = textField(event.data.status);
      const status = runStatus(value);
      return {
        ...base,
        label: RUN_EVENT_LABELS[value] ?? `Run ${status.label.toLowerCase()}`,
        detail: textField(event.data.error),
        tone: status.tone,
      };
    }
    case 'tool.started':
      return {
        ...base,
        label: `Started: ${toolLabel(name, tools)}`,
        tone: 'active',
      };
    case 'tool.completed': {
      const failed = textField(event.data.status) === 'error';
      return {
        ...base,
        label: `${failed ? 'Failed' : 'Finished'}: ${toolLabel(name, tools)}`,
        tone: failed ? 'danger' : 'success',
      };
    }
    case 'tool.audit': {
      const operation = textField(event.data.operation);
      const ok = event.data.ok === true;
      const status =
        typeof event.data.status === 'number'
          ? ` · HTTP ${event.data.status}`
          : '';
      return {
        ...base,
        label: `${event.data.mutates === true ? 'Changed data' : 'Read data'}: ${toolLabel(operation, tools)}`,
        detail: `${ok ? 'Succeeded' : 'Failed'}${status}${textField(event.data.error) ? ` · ${textField(event.data.error)}` : ''}`,
        tone: ok
          ? event.data.mutates === true
            ? 'attention'
            : 'muted'
          : 'danger',
      };
    }
    case 'subagent.started':
      return {
        ...base,
        label: `Subagent started: ${humanizeName(name || 'general purpose')}`,
        tone: 'active',
      };
    case 'subagent.completed':
      return { ...base, label: 'Subagent finished', tone: 'success' };
    case 'task.updated': {
      const todos = readTodos([event]);
      const done = todos.filter((todo) => todo.status === 'completed').length;
      return {
        ...base,
        label: 'Plan updated',
        detail: todos.length ? `${done} of ${todos.length} steps done` : '',
        tone: 'muted',
      };
    }
    case 'interrupt':
      return { ...base, label: 'Asked for your input', tone: 'attention' };
    case 'usage':
      return {
        ...base,
        label: 'Token usage',
        detail:
          typeof event.data.total_tokens === 'number'
            ? `${event.data.total_tokens.toLocaleString()} tokens so far`
            : '',
        tone: 'muted',
      };
    default:
      return { ...base, label: humanizeName(event.kind), tone: 'muted' };
  }
}

/** "4s", "1m 05s", "1h 02m" */
export function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  if (minutes < 60)
    return `${minutes}m ${String(total % 60).padStart(2, '0')}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}
