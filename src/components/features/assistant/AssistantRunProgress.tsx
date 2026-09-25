import { useEffect, useState, type JSX } from 'react';
import {
  CheckCircle2,
  Circle,
  CirclePause,
  Hand,
  Loader2,
  PenLine,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  formatElapsed,
  type AssistantProgress,
  type AssistantStep,
} from '@/utils/assistant/progress';

const VISIBLE_STEPS = 5;

function useElapsed(startedAt: number | null): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return startedAt === null ? null : Math.max(0, now / 1000 - startedAt);
}

function StepIcon({
  status,
}: {
  status: AssistantStep['status'];
}): JSX.Element {
  if (status === 'running')
    return (
      <Loader2
        aria-hidden="true"
        className="assistant-spin size-3.5 shrink-0 text-primary"
      />
    );
  if (status === 'failed')
    return (
      <XCircle
        aria-hidden="true"
        className="size-3.5 shrink-0 text-destructive"
      />
    );
  return (
    <CheckCircle2
      aria-hidden="true"
      className="size-3.5 shrink-0 text-success"
    />
  );
}

/** Live summary of what the active run is doing, shown at the end of the chat. */
export function AssistantRunProgress({
  progress,
}: {
  progress: AssistantProgress;
}): JSX.Element {
  const elapsed = useElapsed(progress.startedAt);
  const hidden = Math.max(0, progress.steps.length - VISIBLE_STEPS);
  const steps = progress.steps.slice(-VISIBLE_STEPS);
  const done = progress.todos.filter(
    (todo) => todo.status === 'completed'
  ).length;
  const waiting = progress.phase === 'waiting';
  return (
    <section
      aria-label="Assistant progress"
      className={cn(
        'rounded-md border p-3 text-xs',
        waiting
          ? 'border-warning/40 bg-warning/5'
          : 'border-primary/25 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2">
        {waiting ? (
          <Hand aria-hidden="true" className="size-4 shrink-0 text-warning" />
        ) : progress.phase === 'writing' ? (
          <PenLine
            aria-hidden="true"
            className="size-4 shrink-0 text-primary"
          />
        ) : (
          <Loader2
            aria-hidden="true"
            className="assistant-spin size-4 shrink-0 text-primary"
          />
        )}
        <p
          role="status"
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground"
        >
          {progress.headline}
          {!waiting && progress.phase !== 'stopping' && (
            <span className="assistant-ellipsis" aria-hidden="true" />
          )}
        </p>
        {elapsed !== null && (
          <span
            className="shrink-0 tabular-nums text-muted-foreground"
            title="Time since this run started"
          >
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>
      {progress.todos.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-2">
          <p className="mb-1.5 flex items-center justify-between font-medium text-muted-foreground">
            <span>Plan</span>
            <span className="tabular-nums">
              {done}/{progress.todos.length}
            </span>
          </p>
          <ol className="space-y-1">
            {progress.todos.map((todo, index) => (
              <li key={index} className="flex items-start gap-2">
                {todo.status === 'completed' ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-px size-3.5 shrink-0 text-success"
                  />
                ) : todo.status === 'in_progress' && waiting ? (
                  <CirclePause
                    aria-hidden="true"
                    className="mt-px size-3.5 shrink-0 text-warning"
                  />
                ) : todo.status === 'in_progress' ? (
                  <Loader2
                    aria-hidden="true"
                    className="assistant-spin mt-px size-3.5 shrink-0 text-primary"
                  />
                ) : (
                  <Circle
                    aria-hidden="true"
                    className="mt-px size-3.5 shrink-0 text-muted-foreground/60"
                  />
                )}
                <span
                  className={cn(
                    'min-w-0 break-words',
                    todo.status === 'completed' &&
                      'text-muted-foreground line-through decoration-muted-foreground/50',
                    todo.status === 'in_progress' && 'font-medium'
                  )}
                >
                  {todo.content}
                  <span className="sr-only">
                    {' '}
                    ({todo.status.replace('_', ' ')})
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {steps.length > 0 && (
        <div className="mt-3 border-t border-border/60 pt-2">
          <p className="mb-1.5 font-medium text-muted-foreground">Steps</p>
          <ul className="space-y-1">
            {hidden > 0 && (
              <li className="pl-5 text-muted-foreground">
                {hidden} earlier {hidden === 1 ? 'step' : 'steps'}
              </li>
            )}
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2">
                <StepIcon status={step.status} />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate',
                    step.status !== 'running' && 'text-muted-foreground'
                  )}
                  title={step.name}
                >
                  {step.label}
                  <span className="sr-only">
                    {' '}
                    (
                    {step.status === 'running'
                      ? 'in progress'
                      : step.status === 'failed'
                        ? 'failed'
                        : 'done'}
                    )
                  </span>
                </span>
                {step.mutating && (
                  <Badge variant="warning" size="sm">
                    Changes data
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {progress.totalTokens > 0 && (
        <p className="mt-2 text-right tabular-nums text-muted-foreground">
          {progress.totalTokens.toLocaleString()} tokens
        </p>
      )}
    </section>
  );
}
