import {
  useLayoutEffect,
  useRef,
  useState,
  type JSX,
  type RefObject,
} from 'react';
import { ArrowUp, Settings, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { AssistantProfile } from '@/types/assistant.types';

export const COMPOSER_LIMIT = 32000;
const MAX_HEIGHT = 200;

export type ComposerBlock =
  | { kind: 'runtime' }
  | { kind: 'disabled' }
  | { kind: 'profile' }
  | null;

/**
 * Message input. While a run is active the send button turns into Stop; the
 * draft stays editable so the next question can be prepared meanwhile.
 */
export function AssistantComposer({
  composer,
  draft,
  setDraft,
  profiles,
  profile,
  setProfile,
  running,
  waiting,
  busy,
  connected,
  block,
  onSend,
  onStop,
  onOpenSettings,
}: {
  composer: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  setDraft: (value: string) => void;
  profiles: AssistantProfile[];
  profile: string;
  setProfile: (value: string) => void;
  running: boolean;
  waiting: boolean;
  busy: boolean;
  connected: boolean;
  block: ComposerBlock;
  onSend: (message: string) => Promise<boolean>;
  onStop: () => Promise<void>;
  onOpenSettings: () => void;
}): JSX.Element {
  const [sending, setSending] = useState(false);
  const [stopping, setStopping] = useState(false);
  const message = draft.trim();
  const canSend =
    !!message && !running && !busy && connected && !block && !!profile;
  // Grow with the content up to MAX_HEIGHT, including programmatic changes
  // (suggestions, retry, clearing after send).
  const field = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = field.current?.querySelector('textarea');
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT)}px`;
  }, [draft]);
  const submit = (): void => {
    if (!canSend) return;
    setSending(true);
    void onSend(message).then((ok) => {
      setSending(false);
      if (ok) setDraft('');
    });
  };
  const nearLimit = draft.length > COMPOSER_LIMIT * 0.8;
  return (
    <form
      className="shrink-0 space-y-2 border-t border-border bg-card p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {block && (
        <div
          role={block.kind === 'runtime' ? 'alert' : 'status'}
          className={cn(
            'flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs',
            block.kind === 'runtime'
              ? 'border-destructive/30 bg-destructive/5 text-destructive'
              : 'border-border bg-muted/40 text-muted-foreground'
          )}
        >
          <p className="flex-1">
            {block.kind === 'runtime'
              ? 'Assistant dependencies are not installed on the API server.'
              : block.kind === 'disabled'
                ? 'Set up a provider connection and enable the assistant to start chatting.'
                : 'Choose an enabled provider connection to start chatting.'}
          </p>
          {block.kind !== 'runtime' && (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={onOpenSettings}
            >
              <Settings />
              Open provider settings
            </Button>
          )}
        </div>
      )}
      <div
        ref={field}
        className={cn(
          'rounded-md border border-input bg-card transition-[border-color,box-shadow]',
          'focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring'
        )}
      >
        <Textarea
          ref={composer}
          aria-label="Message the assistant"
          aria-describedby="assistant-composer-hint"
          placeholder={
            !connected
              ? 'Waiting for the connection…'
              : waiting
                ? 'Respond to the request above to continue…'
                : running
                  ? 'The assistant is working. You can draft your next message…'
                  : 'Ask a question or describe a task…'
          }
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={COMPOSER_LIMIT}
          rows={1}
          readOnly={sending}
          disabled={block?.kind === 'disabled'}
          className="max-h-[200px] min-h-[44px] resize-none border-0 bg-transparent focus-visible:border-0 focus-visible:ring-0"
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
        <div className="flex items-center gap-2 px-2 pb-2">
          <label className="sr-only" htmlFor="assistant-profile">
            AI connection
          </label>
          <select
            id="assistant-profile"
            title="AI connection used for the next message"
            className="h-7 min-w-0 max-w-[60%] truncate rounded-sm border border-transparent bg-muted/60 px-2 text-xs text-muted-foreground hover:border-input hover:text-foreground"
            value={profile}
            onChange={(event) => setProfile(event.target.value)}
            disabled={running || busy || !connected}
          >
            <option value="" disabled>
              Configure an AI connection
            </option>
            {profiles.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.name} · {connection.model}
              </option>
            ))}
          </select>
          <span className="flex-1" />
          {nearLimit && (
            <span
              className={cn(
                'tabular-nums text-[11px]',
                draft.length >= COMPOSER_LIMIT
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              {draft.length.toLocaleString()}/{COMPOSER_LIMIT.toLocaleString()}
            </span>
          )}
          {running ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              aria-label="Stop the current run"
              title="Stop the current run"
              disabled={busy || !connected}
              loading={stopping}
              onClick={() => {
                setStopping(true);
                void onStop().finally(() => setStopping(false));
              }}
            >
              {!stopping && <Square className="fill-current" />}
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              title="Send (Enter)"
              className="size-8 rounded-full"
              disabled={!canSend}
              loading={sending}
            >
              {!sending && <ArrowUp />}
            </Button>
          )}
        </div>
      </div>
      <p
        id="assistant-composer-hint"
        className="text-[11px] text-muted-foreground"
      >
        {running
          ? 'Runs continue on the server if you close this panel.'
          : 'Enter to send · Shift+Enter for a new line'}
      </p>
    </form>
  );
}
