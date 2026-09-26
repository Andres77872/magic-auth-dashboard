import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SESSION_POINTS,
  SESSION_TRACE,
  type TraceStep,
} from '../landing-content';

const STATUS_TONE: Record<TraceStep['tone'], string> = {
  success: 'bg-success-subtle text-success-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
  destructive: 'bg-destructive-subtle text-destructive-subtle-foreground',
};

const STEP_DELAY_MS = 320;

/**
 * Plays the trace once when it scrolls into view; "Replay" runs it again.
 * Without IntersectionObserver (or with reduced motion) lines show at once.
 */
function useTracePlayback(): {
  ref: React.RefObject<HTMLDivElement | null>;
  run: number;
  replay: () => void;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  const [run, setRun] = useState(() =>
    typeof IntersectionObserver === 'undefined' ? 1 : 0
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRun((value) => (value === 0 ? 1 : value));
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, run, replay: () => setRun((value) => value + 1) };
}

function TraceLine({
  step,
  index,
  run,
}: {
  step: TraceStep;
  index: number;
  run: number;
}): React.JSX.Element {
  return (
    <li
      className={cn(
        'grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-border/70 px-4 py-3 last:border-0',
        run === 0
          ? 'opacity-0'
          : 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-2 motion-safe:fill-mode-both motion-safe:duration-300'
      )}
      style={
        run === 0 ? undefined : { animationDelay: `${index * STEP_DELAY_MS}ms` }
      }
    >
      <span
        className={cn(
          'text-[11px] font-semibold',
          step.method === 'POST' ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {step.method}
      </span>
      <span className="truncate text-[12.5px] text-foreground">
        {step.path}
      </span>
      <span
        className={cn(
          'rounded px-1.5 py-px text-[11px] font-medium tabular-nums',
          STATUS_TONE[step.tone]
        )}
      >
        {step.status}
      </span>
      <span className="col-span-2 col-start-2 font-sans text-xs text-muted-foreground">
        {step.note}
      </span>
    </li>
  );
}

/** A condensed session trace next to the rules the console and API follow. */
export function SessionTrace(): React.JSX.Element {
  const { ref, run, replay } = useTracePlayback();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
      <div
        ref={ref}
        className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
      >
        <div className="flex h-10 items-center justify-between border-b border-border px-4">
          <span className="font-mono text-[11px] text-muted-foreground">
            session trace
          </span>
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Replay
          </button>
        </div>
        <ol
          aria-label="Example session requests"
          className="m-0 list-none p-0 font-mono"
        >
          {SESSION_TRACE.map((step, index) => (
            <TraceLine
              key={`${run}-${index}`}
              step={step}
              index={index}
              run={run}
            />
          ))}
        </ol>
      </div>

      <ol className="m-0 grid list-none content-center gap-7 p-0">
        {SESSION_POINTS.map((point, index) => (
          <li key={point.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[11px] text-muted-foreground"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="m-0 text-sm font-semibold text-foreground">
                {point.title}
              </h3>
              <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default SessionTrace;
