import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent,
} from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Plus,
  Send,
  Settings,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAssistant } from '@/hooks/useAssistant';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { activeRun, transcript } from '@/utils/assistant/state';
import { AssistantSettings } from './AssistantSettings';
import { AssistantActivity, AssistantInterruptions } from './AssistantActivity';
import { Markdown } from './markdown';
import './assistant.css';

type PanelPreference = {
  open: boolean;
  width: number;
  height: number;
  maximized: boolean;
};
function readPreference(key: string): PanelPreference {
  const fallback = { open: false, width: 480, height: 680, maximized: false };
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!value || typeof value !== 'object') return fallback;
    const entry = value as Partial<PanelPreference>;
    return {
      open: entry.open === true,
      width:
        typeof entry.width === 'number' && Number.isFinite(entry.width)
          ? Math.max(340, Math.min(1200, entry.width))
          : fallback.width,
      height:
        typeof entry.height === 'number' && Number.isFinite(entry.height)
          ? Math.max(360, Math.min(1200, entry.height))
          : fallback.height,
      maximized: entry.maximized === true,
    };
  } catch {
    return fallback;
  }
}
function AssistantWorkspace({ owner }: { owner: string }): JSX.Element {
  const { refreshSession } = useAuth();
  const assistant = useAssistant(owner, refreshSession);
  const storageKey = `assistant.panel.${owner}`;
  const [panel, setPanel] = useState(() => readPreference(storageKey));
  const [view, setView] = useState<'chat' | 'settings'>('chat');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const sessionKey = assistant.snapshot?.session.id ?? 'new';
  const draft = drafts[sessionKey] ?? '';
  const profile = profiles[sessionKey] ?? '';
  const setDraft = (value: string): void =>
    setDrafts((previous) => ({ ...previous, [sessionKey]: value }));
  const setProfile = (value: string): void =>
    setProfiles((previous) => ({ ...previous, [sessionKey]: value }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const resize = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const data = assistant.bootstrap;
  const settings = data?.settings;
  const running = activeRun(assistant.snapshot?.run ?? null);
  const connected = assistant.connectionState === 'connected';
  const { messages, streaming } = transcript(
    assistant.snapshot,
    assistant.snapshotSeq
  );
  const enabledProfiles =
    data?.profiles.filter((connection) => connection.enabled) ?? [];
  const selectedProfile = enabledProfiles.some(
    (connection) => connection.id === profile
  )
    ? profile
    : (enabledProfiles.find(
        (connection) => connection.id === assistant.snapshot?.session.profile_id
      )?.id ??
      enabledProfiles.find(
        (connection) => connection.id === settings?.default_profile_id
      )?.id ??
      enabledProfiles[0]?.id ??
      '');
  const writes =
    data?.tools.filter(
      (tool) =>
        tool.mutating &&
        settings?.enabled_tools.includes(tool.name) &&
        settings.enabled_skills.includes(tool.skill_id)
    ) ?? [];
  const close = (): void => {
    setPanel((previous) => ({ ...previous, open: false }));
    requestAnimationFrame(() => launcher.current?.focus());
  };
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(panel));
    } catch {
      /* Conversation data remains on the server. */
    }
  }, [panel, storageKey]);
  useEffect(() => {
    if (panel.open && view === 'chat') composer.current?.focus();
  }, [panel.open, view]);
  useEffect(() => {
    if (stickToBottom.current)
      scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [messages.length, streaming]);
  const resizeMove = (event: PointerEvent<HTMLButtonElement>): void => {
    if (!resize.current) return;
    const initial = resize.current;
    setPanel((previous) => ({
      ...previous,
      width: Math.max(
        340,
        Math.min(
          window.innerWidth - 24,
          initial.width + initial.x - event.clientX
        )
      ),
      height: Math.max(
        360,
        Math.min(
          window.innerHeight - 24,
          initial.height + initial.y - event.clientY
        )
      ),
    }));
  };
  return (
    <>
      <Button
        ref={launcher}
        className={`fixed bottom-5 right-5 z-40 rounded-full shadow-lg ${settings?.mutations_enabled ? 'ring-2 ring-warning' : ''} ${panel.open ? 'invisible' : ''}`}
        size="lg"
        aria-label="Open AI assistant"
        onClick={() => setPanel((previous) => ({ ...previous, open: true }))}
      >
        <Bot />
        AI assistant
        {running && (
          <span
            aria-label="Run active"
            className="size-2 animate-pulse rounded-full bg-current"
          />
        )}
        {settings?.mutations_enabled && (
          <AlertTriangle aria-label="Write tools active" />
        )}
      </Button>
      {panel.open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
          className="assistant-panel fixed bottom-4 right-4 z-50 flex flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-2xl"
          style={{
            width: panel.maximized
              ? 'calc(100vw - 32px)'
              : `min(${panel.width}px, calc(100vw - 32px))`,
            height: panel.maximized
              ? 'calc(100dvh - 32px)'
              : `min(${panel.height}px, calc(100dvh - 32px))`,
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
            <Bot className="size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <h2 id="assistant-title" className="text-sm font-semibold">
                AI assistant{' '}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  Root
                </span>
              </h2>
              <p className="text-[11px] text-muted-foreground" role="status">
                {assistant.connectionState === 'connected'
                  ? running
                    ? `Session ${assistant.snapshot?.run?.status ?? 'running'} · runs in background`
                    : 'Connected · history saved on server'
                  : assistant.connectionState === 'disconnected'
                    ? 'Disconnected · sign in again or refresh'
                    : 'Reconnecting · backend runs continue'}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              title={view === 'chat' ? 'Assistant settings' : 'Back to chat'}
              aria-label={
                view === 'chat' ? 'Assistant settings' : 'Back to chat'
              }
              onClick={() => setView(view === 'chat' ? 'settings' : 'chat')}
            >
              {view === 'chat' ? <Settings /> : <ChevronLeft />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={
                panel.maximized
                  ? 'Restore assistant size'
                  : 'Maximize assistant'
              }
              onClick={() =>
                setPanel((previous) => ({
                  ...previous,
                  maximized: !previous.maximized,
                }))
              }
            >
              {panel.maximized ? <Minimize2 /> : <Maximize2 />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close assistant (keep running)"
              onClick={close}
            >
              <X />
            </Button>
          </header>
          {settings?.mutations_enabled && (
            <div
              role="status"
              className="flex shrink-0 items-start gap-2 border-b border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <strong>Write access is active</strong>
                <p>
                  {writes.length} selected tools can change app data after
                  approval.
                </p>
              </div>
              <Button
                className="ml-auto"
                size="xs"
                variant="ghost"
                disabled={assistant.busy || !connected}
                onClick={() => {
                  void assistant.updateSettings({ mutations_enabled: false });
                }}
              >
                Disable
              </Button>
            </div>
          )}
          {assistant.error && (
            <div
              role="alert"
              className="flex shrink-0 items-start gap-2 border-b border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <p className="flex-1">{assistant.error}</p>
              <button
                aria-label="Dismiss assistant error"
                onClick={assistant.dismissError}
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          {view === 'settings' ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {data ? (
                <AssistantSettings
                  data={data}
                  busy={assistant.busy || !connected}
                  update={assistant.updateSettings}
                  saveProfile={assistant.saveProfile}
                  deleteProfile={assistant.deleteProfile}
                />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  Connecting to assistant settings…
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-1 border-b border-border p-2">
                <label htmlFor="assistant-session" className="sr-only">
                  Conversation
                </label>
                <select
                  id="assistant-session"
                  className="h-8 min-w-0 flex-1 rounded border border-input bg-card px-2 text-xs"
                  value={assistant.snapshot?.session.id ?? ''}
                  disabled={!connected || assistant.busy}
                  onChange={(event) => {
                    setConfirmDelete(false);
                    stickToBottom.current = true;
                    void assistant.selectSession(event.target.value);
                  }}
                >
                  <option value="" disabled>
                    Choose a conversation
                  </option>
                  {data?.sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title || 'Untitled session'}
                      {session.status === 'running' ||
                      session.status === 'queued' ||
                      session.status === 'waiting_input'
                        ? ` · ${session.status}`
                        : ''}
                    </option>
                  ))}
                </select>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="New conversation"
                  disabled={!connected || assistant.busy}
                  onClick={() => {
                    stickToBottom.current = true;
                    void assistant.createSession();
                  }}
                >
                  <Plus />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete conversation"
                  disabled={
                    !assistant.snapshot ||
                    running ||
                    assistant.busy ||
                    !connected
                  }
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 />
                </Button>
              </div>
              {assistant.hasOlderSessions && (
                <Button
                  className="shrink-0 rounded-none border-b border-border"
                  size="xs"
                  variant="ghost"
                  disabled={!connected || assistant.busy}
                  onClick={() => {
                    void assistant.loadOlderSessions();
                  }}
                >
                  Load older conversations
                </Button>
              )}
              {confirmDelete && (
                <div
                  role="alert"
                  className="border-b border-border p-3 text-xs"
                >
                  Permanently delete this conversation and its activity?
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="destructive"
                      size="xs"
                      disabled={assistant.busy}
                      onClick={() => {
                        void assistant
                          .deleteSession()
                          .then(() => setConfirmDelete(false));
                      }}
                    >
                      Delete conversation
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Keep conversation
                    </Button>
                  </div>
                </div>
              )}
              <div
                ref={scroll}
                onScroll={() => {
                  const element = scroll.current;
                  if (element)
                    stickToBottom.current =
                      element.scrollHeight -
                        element.scrollTop -
                        element.clientHeight <
                      80;
                }}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
              >
                {assistant.snapshot?.has_older_messages && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    disabled={assistant.busy || !connected}
                    onClick={() => {
                      const previousHeight = scroll.current?.scrollHeight ?? 0;
                      const previousTop = scroll.current?.scrollTop ?? 0;
                      stickToBottom.current = false;
                      void assistant.loadOlderMessages().then(() =>
                        requestAnimationFrame(() => {
                          if (scroll.current)
                            scroll.current.scrollTop =
                              scroll.current.scrollHeight -
                              previousHeight +
                              previousTop;
                        })
                      );
                    }}
                  >
                    Load earlier messages
                  </Button>
                )}
                {messages.length === 0 && !streaming && (
                  <div className="py-8 text-center">
                    <Bot className="mx-auto mb-3 size-8 text-primary" />
                    <h3 className="text-base font-medium">How can I help?</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                      Ask a question, review app activity, or manage users,
                      groups, projects, and security.
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {settings?.mutations_enabled
                        ? 'Change tools require your approval.'
                        : 'Read access is enabled by default. Changes are disabled.'}
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {[
                        'Summarize recent activity',
                        'Explain user group access',
                        'Review security settings',
                      ].map((prompt) => (
                        <Button
                          key={prompt}
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setDraft(prompt);
                            composer.current?.focus();
                          }}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages
                  .filter(
                    (message) =>
                      message.role !== 'tool' && message.role !== 'system'
                  )
                  .map((message) => (
                    <article
                      key={message.id}
                      className={
                        message.role === 'user'
                          ? 'ml-8 rounded-lg border border-border bg-muted/60 p-3'
                          : 'min-w-0'
                      }
                      aria-label={
                        message.role === 'user'
                          ? 'Your message'
                          : 'Assistant message'
                      }
                    >
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </p>
                      {message.role === 'assistant' ? (
                        <Markdown content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm">
                          {message.content}
                        </p>
                      )}
                    </article>
                  ))}
                {streaming && (
                  <article
                    aria-label="Assistant generating"
                    className="min-w-0"
                  >
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Assistant
                    </p>
                    <Markdown
                      content={streaming}
                      streaming={assistant.snapshot?.run?.status === 'running'}
                    />
                  </article>
                )}
                {running && !streaming && (
                  <p
                    className="animate-pulse text-xs text-muted-foreground"
                    role="status"
                  >
                    {assistant.snapshot?.run?.status === 'waiting_input'
                      ? 'Waiting for your response…'
                      : 'Working in the background…'}
                  </p>
                )}
                {assistant.snapshot?.run?.status === 'interrupted' &&
                  !assistant.snapshot.run.error && (
                    <p
                      role="alert"
                      className="rounded border border-warning/30 bg-warning/5 p-3 text-xs text-warning"
                    >
                      Run interrupted when the server stopped. Review activity
                      and start a new conversation; changes are not
                      automatically retried.
                    </p>
                  )}
                {assistant.snapshot?.run?.status === 'cancelled' && (
                  <p role="status" className="text-xs text-muted-foreground">
                    Run cancelled. Partial output is retained.
                  </p>
                )}
                {assistant.snapshot?.run?.error && (
                  <p
                    role="alert"
                    className="rounded border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive"
                  >
                    {assistant.snapshot.run.error}
                  </p>
                )}
                <AssistantInterruptions
                  key={assistant.snapshot?.run?.id ?? 'none'}
                  snapshot={assistant.snapshot}
                  busy={assistant.busy || !connected}
                  resume={assistant.resume}
                />
                <AssistantActivity snapshot={assistant.snapshot} />
              </div>
              <form
                className="shrink-0 space-y-2 border-t border-border bg-card p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (
                    !draft.trim() ||
                    running ||
                    assistant.busy ||
                    !connected ||
                    !selectedProfile ||
                    !settings?.enabled ||
                    data?.runtime_available === false
                  )
                    return;
                  stickToBottom.current = true;
                  void assistant
                    .send(draft.trim(), selectedProfile || undefined)
                    .then((ok) => {
                      if (ok) setDraft('');
                    });
                }}
              >
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor="assistant-profile">
                    AI connection
                  </label>
                  <select
                    id="assistant-profile"
                    className="h-7 min-w-0 flex-1 rounded border border-input bg-card px-2 text-xs"
                    value={selectedProfile}
                    onChange={(event) => setProfile(event.target.value)}
                    disabled={running || assistant.busy || !connected}
                  >
                    <option value="" disabled>
                      Configure an AI connection
                    </option>
                    {enabledProfiles.map((connection) => (
                      <option key={connection.id} value={connection.id}>
                        {connection.name} · {connection.model}
                      </option>
                    ))}
                  </select>
                  {running && (
                    <Button
                      size="xs"
                      type="button"
                      variant="destructive"
                      disabled={assistant.busy || !connected}
                      onClick={() => {
                        void assistant.cancel();
                      }}
                    >
                      <Square />
                      Stop
                    </Button>
                  )}
                </div>
                {data?.runtime_available === false && (
                  <p role="alert" className="text-xs text-destructive">
                    Assistant dependencies are not installed on the API server.
                  </p>
                )}
                {!settings?.enabled && data && (
                  <p className="text-xs text-muted-foreground">
                    The assistant is disabled.{' '}
                    <button
                      type="button"
                      className="text-primary underline"
                      onClick={() => setView('settings')}
                    >
                      Enable it in settings
                    </button>
                    .
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={composer}
                    aria-label="Message the assistant"
                    placeholder={
                      running
                        ? 'Wait for this run or open a new conversation…'
                        : 'Ask a question or describe a task…'
                    }
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={32000}
                    rows={2}
                    disabled={assistant.busy || !settings?.enabled}
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
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Send message"
                    disabled={
                      !draft.trim() ||
                      running ||
                      assistant.busy ||
                      !connected ||
                      !settings?.enabled ||
                      !selectedProfile ||
                      data?.runtime_available === false
                    }
                  >
                    <Send />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Enter to send · Shift+Enter for a new line · Closing keeps
                  runs active
                </p>
              </form>
            </>
          )}
          {!panel.maximized && (
            <button
              aria-label="Resize assistant"
              className="absolute left-0 top-0 size-3 cursor-nwse-resize touch-none rounded-tl-lg border-l-2 border-t-2 border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
              onPointerDown={(event) => {
                const bounds =
                  event.currentTarget.parentElement?.getBoundingClientRect();
                resize.current = {
                  x: event.clientX,
                  y: event.clientY,
                  width: bounds?.width || panel.width,
                  height: bounds?.height || panel.height,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={resizeMove}
              onPointerUp={(event) => {
                resize.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                resize.current = null;
              }}
              onKeyDown={(event) => {
                const steps = {
                  ArrowLeft: [40, 0],
                  ArrowRight: [-40, 0],
                  ArrowUp: [0, 40],
                  ArrowDown: [0, -40],
                }[event.key];
                if (steps) {
                  event.preventDefault();
                  setPanel((previous) => ({
                    ...previous,
                    width: Math.max(
                      340,
                      Math.min(
                        window.innerWidth - 24,
                        previous.width + steps[0]
                      )
                    ),
                    height: Math.max(
                      360,
                      Math.min(
                        window.innerHeight - 24,
                        previous.height + steps[1]
                      )
                    ),
                  }));
                }
              }}
            />
          )}
        </section>
      )}
    </>
  );
}
/** Do not initialize a socket or fetch configuration for non-root accounts. */
export default function AssistantPanel(): JSX.Element | null {
  const { user, userType, isAuthenticated } = useAuth();
  return isAuthenticated && userType === 'root' && user ? (
    <AssistantWorkspace key={user.user_hash} owner={user.user_hash} />
  ) : null;
}
