import { useState, type JSX } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type {
  AssistantDecision,
  AssistantSnapshot,
} from '@/types/assistant.types';
import { readInterrupts, record, textField } from '@/utils/assistant/state';

export function AssistantActivity({
  snapshot,
}: {
  snapshot: AssistantSnapshot | null;
}): JSX.Element | null {
  if (!snapshot) return null;
  const activity = snapshot.events.filter(
    (event) => !event.kind.startsWith('message.')
  );
  const taskEvent = [...activity]
    .reverse()
    .find((event) => event.kind === 'task.updated');
  const todos: unknown[] = Array.isArray(taskEvent?.data.todos)
    ? taskEvent.data.todos
    : [];
  const usageByRun = new Map<string, number>();
  for (const event of activity) {
    if (event.kind === 'usage' && typeof event.data.total_tokens === 'number')
      usageByRun.set(
        textField(event.data.run_id) || 'current',
        event.data.total_tokens
      );
  }
  const usage = Array.from(usageByRun.values()).reduce(
    (total, tokens) => total + tokens,
    0
  );
  return (
    <details className="rounded border border-border bg-muted/20">
      <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
        Activity · {activity.length} events
        {usage > 0 ? ` · ${usage.toLocaleString()} tokens` : ''}
      </summary>
      <div className="max-h-64 space-y-2 overflow-auto border-t border-border p-3">
        {todos.length > 0 && (
          <ol className="space-y-1 border-b border-border pb-2 text-xs">
            {todos.map((todo, index) => {
              const item = record(todo);
              return (
                <li key={index}>
                  <span className="mr-2">
                    {item.status === 'completed'
                      ? '✓'
                      : item.status === 'in_progress'
                        ? '↻'
                        : '○'}
                  </span>
                  {textField(item.content)}{' '}
                  <span className="text-muted-foreground">
                    {textField(item.status).replaceAll('_', ' ')}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Tool calls, tasks, subagents, and token usage appear here.
          </p>
        ) : (
          activity.slice(-100).map((event) => (
            <details key={event.seq} className="text-xs">
              <summary className="cursor-pointer break-words">
                <span className="text-muted-foreground">
                  {new Date(event.created_at * 1000).toLocaleTimeString()}
                </span>{' '}
                {event.kind.replaceAll('.', ' ')}{' '}
                {textField(event.data.name) || textField(event.data.status)}
              </summary>
              <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px]">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </details>
          ))
        )}
      </div>
    </details>
  );
}
export function AssistantInterruptions({
  snapshot,
  busy,
  resume,
}: {
  snapshot: AssistantSnapshot | null;
  busy: boolean;
  resume: (
    answer?: unknown,
    decisions?: AssistantDecision[],
    responses?: Record<string, unknown>
  ) => Promise<void>;
}): JSX.Element | null {
  const interrupts = readInterrupts(snapshot);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<
    Record<string, 'approve' | 'reject'>
  >({});
  if (!interrupts.length) return null;
  const ready = interrupts.every((item) =>
    item.type === 'ask_user' ? !!answers[item.id]?.trim() : !!decisions[item.id]
  );
  return (
    <form
      className="space-y-3 rounded border border-primary/40 bg-primary/5 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const responses = Object.fromEntries(
          interrupts.map((item) => [
            item.id,
            item.type === 'ask_user'
              ? { answer: answers[item.id] }
              : {
                  decisions: item.actions.map(() => ({
                    type: decisions[item.id],
                  })),
                },
          ])
        );
        void resume(undefined, undefined, responses);
      }}
    >
      <p className="text-sm font-medium">Your input is needed</p>
      {interrupts.map((item) => (
        <div className="space-y-2" key={item.id}>
          {item.type === 'ask_user' ? (
            <>
              <Textarea
                label={item.question || 'Clarification'}
                value={answers[item.id] ?? ''}
                maxLength={12000}
                onChange={(event) =>
                  setAnswers({ ...answers, [item.id]: event.target.value })
                }
                required
              />
              {item.options.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.options.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="xs"
                      variant="secondary"
                      onClick={() =>
                        setAnswers({ ...answers, [item.id]: option })
                      }
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-warning">
                Review the proposed changes before allowing execution.
              </p>
              {item.actions.map((action, index) => (
                <details
                  open
                  key={index}
                  className="rounded border border-border p-2"
                >
                  <summary className="text-xs font-medium">
                    {action.name}
                  </summary>
                  {action.description && (
                    <p className="mt-1 text-xs">{action.description}</p>
                  )}
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs">
                    {JSON.stringify(action.args, null, 2)}
                  </pre>
                </details>
              ))}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    decisions[item.id] === 'approve' ? 'primary' : 'secondary'
                  }
                  aria-pressed={decisions[item.id] === 'approve'}
                  disabled={busy}
                  onClick={() =>
                    setDecisions({ ...decisions, [item.id]: 'approve' })
                  }
                >
                  Approve {item.actions.length > 1 ? 'these changes' : 'change'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={
                    decisions[item.id] === 'reject'
                      ? 'destructive'
                      : 'secondary'
                  }
                  aria-pressed={decisions[item.id] === 'reject'}
                  disabled={busy}
                  onClick={() =>
                    setDecisions({ ...decisions, [item.id]: 'reject' })
                  }
                >
                  Reject
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
      <Button type="submit" disabled={busy || !ready}>
        Send response
      </Button>
    </form>
  );
}
