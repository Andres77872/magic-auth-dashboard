import { useState, type JSX } from 'react';
import { History, MessageCircleQuestion, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  AssistantDecision,
  AssistantSnapshot,
  AssistantTool,
} from '@/types/assistant.types';
import {
  describeEvent,
  toolLabel,
  type AssistantStatusTone,
} from '@/utils/assistant/progress';
import {
  readInterrupts,
  record,
  type AssistantInterrupt,
} from '@/utils/assistant/state';

const TONE_DOT: Record<AssistantStatusTone, string> = {
  active: 'bg-primary',
  attention: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-destructive',
  muted: 'bg-muted-foreground/50',
};

export function AssistantActivity({
  snapshot,
  tools = [],
}: {
  snapshot: AssistantSnapshot | null;
  tools?: AssistantTool[];
}): JSX.Element | null {
  if (!snapshot) return null;
  const activity = snapshot.events.filter(
    (event) => !event.kind.startsWith('message.')
  );
  if (!activity.length) return null;
  const usageByRun = new Map<string, number>();
  for (const event of activity) {
    if (event.kind === 'usage' && typeof event.data.total_tokens === 'number')
      usageByRun.set(
        typeof event.data.run_id === 'string' ? event.data.run_id : 'current',
        event.data.total_tokens
      );
  }
  const usage = Array.from(usageByRun.values()).reduce(
    (total, tokens) => total + tokens,
    0
  );
  // Usage ticks once per model call; the summary total already covers them.
  const entries = activity.filter((event) => event.kind !== 'usage');
  const visible = entries.slice(-100);
  return (
    <details className="group rounded-md border border-border bg-muted/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
        <History aria-hidden="true" className="size-3.5" />
        <span className="flex-1">
          Activity log · {entries.length}{' '}
          {entries.length === 1 ? 'event' : 'events'}
          {usage > 0 ? ` · ${usage.toLocaleString()} tokens` : ''}
        </span>
        <span
          aria-hidden="true"
          className="transition-transform group-open:rotate-90"
        >
          ›
        </span>
      </summary>
      <ol className="max-h-72 space-y-0.5 overflow-auto border-t border-border p-2">
        {entries.length > visible.length && (
          <li className="px-1 py-1 text-[11px] text-muted-foreground">
            Showing the latest {visible.length} of {entries.length} events.
          </li>
        )}
        {visible.map((event) => {
          const entry = describeEvent(event, tools);
          return (
            <li key={event.seq}>
              <details className="rounded px-1 py-1 text-xs hover:bg-muted/50">
                <summary className="flex cursor-pointer list-none items-start gap-2 [&::-webkit-details-marker]:hidden">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 size-1.5 shrink-0 rounded-full',
                      TONE_DOT[entry.tone]
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="break-words">{entry.label}</span>
                    {entry.detail && (
                      <span className="block break-words text-muted-foreground">
                        {entry.detail}
                      </span>
                    )}
                  </span>
                  <time
                    className="shrink-0 tabular-nums text-[11px] text-muted-foreground"
                    dateTime={new Date(entry.createdAt * 1000).toISOString()}
                  >
                    {new Date(entry.createdAt * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </time>
                </summary>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px]">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </details>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value || '""';
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value, null, 2);
}

/** Arguments are shown as a readable field list; nested values stay JSON. */
function ActionArguments({ args }: { args: unknown }): JSX.Element {
  const entries = Object.entries(record(args));
  if (!entries.length)
    return args === undefined || args === null ? (
      <p className="text-xs text-muted-foreground">No arguments.</p>
    ) : (
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-2 text-[11px]">
        {formatValue(args)}
      </pre>
    );
  return (
    <dl className="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 rounded bg-muted/60 p-2 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="min-w-0 whitespace-pre-wrap break-words font-mono text-[11px]">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ApprovalRequest({
  item,
  tools,
  decision,
  note,
  busy,
  single,
  onDecide,
  onNote,
  onSubmit,
}: {
  item: AssistantInterrupt;
  tools: AssistantTool[];
  decision: 'approve' | 'reject' | undefined;
  note: string;
  busy: boolean;
  single: boolean;
  onDecide: (decision: 'approve' | 'reject') => void;
  onNote: (note: string) => void;
  onSubmit: (decision: 'approve' | 'reject') => void;
}): JSX.Element {
  const [rejecting, setRejecting] = useState(false);
  const plural = item.actions.length > 1;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert aria-hidden="true" className="size-4 text-warning" />
        Approve {plural ? `${item.actions.length} changes` : 'this change'}?
      </p>
      <p className="text-xs text-muted-foreground">
        Nothing runs until you approve. Review what will change below.
      </p>
      {item.actions.map((action, index) => {
        const catalog = tools.find((tool) => tool.name === action.name);
        return (
          <div
            key={index}
            className="space-y-2 rounded-md border border-border bg-card p-2.5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {toolLabel(action.name, tools)}
              </span>
              {catalog?.mutating !== false && (
                <Badge variant="warning" size="sm">
                  Changes data
                </Badge>
              )}
            </div>
            {catalog && (
              <p className="break-all font-mono text-[11px] text-muted-foreground">
                {catalog.method} {catalog.path}
              </p>
            )}
            {action.description && (
              <p className="text-xs">{action.description}</p>
            )}
            <ActionArguments args={action.args} />
          </div>
        );
      })}
      {(rejecting || decision === 'reject') && (
        <Textarea
          label="Reason for rejecting (optional)"
          helperText="Shared with the assistant so it can adjust its plan."
          value={note}
          rows={2}
          maxLength={2000}
          onChange={(event) => onNote(event.target.value)}
        />
      )}
      <div className="flex flex-wrap gap-2">
        {single ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              loading={busy && decision === 'approve'}
              onClick={() => onSubmit('approve')}
            >
              {plural ? 'Approve all and continue' : 'Approve and continue'}
            </Button>
            {rejecting ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={busy}
                loading={busy && decision === 'reject'}
                onClick={() => onSubmit('reject')}
              >
                Reject and continue
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => setRejecting(true)}
              >
                Reject…
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant={decision === 'approve' ? 'primary' : 'secondary'}
              aria-pressed={decision === 'approve'}
              disabled={busy}
              onClick={() => onDecide('approve')}
            >
              Approve {plural ? 'these changes' : 'change'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={decision === 'reject' ? 'destructive' : 'secondary'}
              aria-pressed={decision === 'reject'}
              disabled={busy}
              onClick={() => onDecide('reject')}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantInterruptions({
  snapshot,
  tools = [],
  busy,
  resume,
}: {
  snapshot: AssistantSnapshot | null;
  tools?: AssistantTool[];
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
  const [notes, setNotes] = useState<Record<string, string>>({});
  if (!interrupts.length) return null;
  const single = interrupts.length === 1;
  const submit = (
    answerOverrides: Record<string, string> = {},
    decisionOverrides: Record<string, 'approve' | 'reject'> = {}
  ): void => {
    const allAnswers = { ...answers, ...answerOverrides };
    const allDecisions = { ...decisions, ...decisionOverrides };
    setAnswers(allAnswers);
    setDecisions(allDecisions);
    const responses = Object.fromEntries(
      interrupts.map((item) => [
        item.id,
        item.type === 'ask_user'
          ? { answer: allAnswers[item.id]?.trim() }
          : {
              decisions: item.actions.map(() => {
                const type = allDecisions[item.id];
                const note = notes[item.id]?.trim();
                return type === 'reject' && note
                  ? { type, message: note }
                  : { type };
              }),
            },
      ])
    );
    void resume(undefined, undefined, responses);
  };
  const ready = interrupts.every((item) =>
    item.type === 'ask_user' ? !!answers[item.id]?.trim() : !!decisions[item.id]
  );
  const needsSharedSubmit =
    !single || interrupts.some((item) => item.type === 'ask_user');
  return (
    <form
      aria-label="Your input is needed"
      className="space-y-4 rounded-md border border-warning/40 bg-warning/5 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready && !busy) submit();
      }}
    >
      {!single && (
        <p className="text-sm font-medium">
          The assistant needs {interrupts.length} responses to continue
        </p>
      )}
      {interrupts.map((item) => (
        <div className="space-y-2" key={item.id}>
          {item.type === 'ask_user' ? (
            <>
              <p className="flex items-start gap-2 text-sm font-medium">
                <MessageCircleQuestion
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-warning"
                />
                <span>
                  {item.question || 'The assistant needs clarification.'}
                </span>
              </p>
              {item.options.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.options.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={
                        answers[item.id] === option ? 'primary' : 'secondary'
                      }
                      aria-pressed={answers[item.id] === option}
                      disabled={busy}
                      onClick={() => {
                        if (single) submit({ [item.id]: option });
                        else setAnswers({ ...answers, [item.id]: option });
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}
              <Textarea
                aria-label={item.question || 'Clarification'}
                placeholder={
                  item.options.length
                    ? 'Or type a different answer…'
                    : 'Type your answer…'
                }
                value={answers[item.id] ?? ''}
                rows={2}
                maxLength={12000}
                disabled={busy}
                onChange={(event) =>
                  setAnswers({ ...answers, [item.id]: event.target.value })
                }
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            </>
          ) : (
            <ApprovalRequest
              item={item}
              tools={tools}
              decision={decisions[item.id]}
              note={notes[item.id] ?? ''}
              busy={busy}
              single={single}
              onDecide={(decision) =>
                setDecisions({ ...decisions, [item.id]: decision })
              }
              onNote={(note) => setNotes({ ...notes, [item.id]: note })}
              onSubmit={(decision) => submit({}, { [item.id]: decision })}
            />
          )}
        </div>
      ))}
      {needsSharedSubmit && (
        <Button
          type="submit"
          size="sm"
          disabled={busy || !ready}
          loading={busy}
        >
          {single ? 'Send answer' : 'Send responses'}
        </Button>
      )}
    </form>
  );
}
