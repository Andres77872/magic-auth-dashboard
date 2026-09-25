import {
  useEffect,
  useRef,
  useState,
  type JSX,
  type PointerEvent,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  Bot,
  ChevronLeft,
  CircleSlash,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAssistant } from '@/hooks/useAssistant';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AssistantMessage } from '@/types/assistant.types';
import { activeRun, isActiveStatus, transcript } from '@/utils/assistant/state';
import {
  runProgress,
  runStatus,
  type AssistantStatusTone,
} from '@/utils/assistant/progress';
import { formatDateTime } from '@/utils/formatters';
import { AssistantSettings } from './AssistantSettings';
import { AssistantConnectionSetup } from './AssistantConnectionSetup';
import { AssistantActivity, AssistantInterruptions } from './AssistantActivity';
import { AssistantComposer, type ComposerBlock } from './AssistantComposer';
import { AssistantRunProgress } from './AssistantRunProgress';
import { CopyButton } from './copy-button';
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

const SUGGESTIONS = [
  'Summarize recent activity',
  'Explain user group access',
  'Review security settings',
];

const TONE_DOT: Record<AssistantStatusTone, string> = {
  active: 'bg-primary',
  attention: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-destructive',
  muted: 'bg-muted-foreground',
};

function timeLabel(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function MessageItem({ message }: { message: AssistantMessage }): JSX.Element {
  const time = (
    <time
      dateTime={new Date(message.created_at * 1000).toISOString()}
      title={formatDateTime(message.created_at * 1000)}
      className="tabular-nums"
    >
      {timeLabel(message.created_at)}
    </time>
  );
  if (message.role === 'user')
    return (
      <article
        aria-label="Your message"
        className="group ml-auto flex max-w-[85%] flex-col items-end gap-1"
      >
        <div className="rounded-lg rounded-br-sm border border-primary/20 bg-primary/10 px-3 py-2">
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">{time}</p>
      </article>
    );
  return (
    <article aria-label="Assistant message" className="group min-w-0">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
        <span className="font-medium text-foreground">Assistant</span>
        <span aria-hidden="true">·</span>
        {time}
        <CopyButton
          value={message.content}
          label="Copy response"
          showLabel={false}
          className="ml-auto h-6 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        />
      </div>
      <Markdown content={message.content} />
    </article>
  );
}

function AssistantWorkspace({ owner }: { owner: string }): JSX.Element {
  const { refreshSession } = useAuth();
  const { showToast } = useToast();
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
  const [atBottom, setAtBottom] = useState(true);
  const [unread, setUnread] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  // Follow new output unless the user deliberately scrolled up to read.
  const stickToBottom = useRef(true);
  const lastScrollTop = useRef(0);
  const wasActive = useRef(false);
  const resize = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const data = assistant.bootstrap;
  const settings = data?.settings;
  const run = assistant.snapshot?.run ?? null;
  const running = activeRun(run);
  const waiting = run?.status === 'waiting_input';
  const connected = assistant.connectionState === 'connected';
  const { messages, streaming } = transcript(
    assistant.snapshot,
    assistant.snapshotSeq
  );
  const visibleMessages = messages.filter(
    (message) => message.role === 'user' || message.role === 'assistant'
  );
  const progress = runProgress(assistant.snapshot, streaming, data?.tools);
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
  const block: ComposerBlock =
    data?.runtime_available === false
      ? { kind: 'runtime' }
      : !settings?.enabled
        ? { kind: 'disabled' }
        : !selectedProfile
          ? { kind: 'profile' }
          : null;
  const lastUserMessage = [...visibleMessages]
    .reverse()
    .find((message) => message.role === 'user');
  const status = !connected
    ? assistant.connectionState === 'disconnected'
      ? { label: 'Disconnected', tone: 'danger' as const }
      : {
          label:
            assistant.connectionState === 'connecting'
              ? 'Connecting…'
              : 'Reconnecting…',
          tone: 'attention' as const,
        }
    : running && run
      ? runStatus(run.status)
      : { label: 'Ready · history saved on server', tone: 'success' as const };
  const close = (): void => {
    setPanel((previous) => ({ ...previous, open: false }));
    requestAnimationFrame(() => launcher.current?.focus());
  };
  const setStick = (value: boolean): void => {
    stickToBottom.current = value;
    setAtBottom(value);
  };
  const scrollToBottom = (smooth = false): void => {
    setStick(true);
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };
  const send = async (message: string): Promise<boolean> => {
    setStick(true);
    return assistant.send(message, selectedProfile || undefined);
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
  // A reply that finishes while the panel is closed is flagged on the launcher.
  useEffect(() => {
    if (wasActive.current && !running && !panel.open) setUnread(true);
    wasActive.current = running;
  }, [running, panel.open]);
  const eventCount = assistant.snapshot?.events.length ?? 0;
  useEffect(() => {
    if (stickToBottom.current)
      scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
  }, [messages.length, streaming, eventCount, run?.status, view, panel.open]);
  // Content can also grow without new events (markdown blocks, charts, a
  // resized window); keep the bottom pinned through those too.
  const chatMounted = panel.open && view === 'chat' && !!data;
  useEffect(() => {
    const element = scroll.current;
    const inner = content.current;
    if (!chatMounted || !element || !inner) return;
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (stickToBottom.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [chatMounted]);
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
  const launcherStatus = waiting
    ? { label: 'Needs input', className: 'bg-warning' }
    : running
      ? { label: 'Working', className: 'bg-primary-foreground animate-pulse' }
      : unread
        ? { label: 'New reply', className: 'bg-success' }
        : null;
  return (
    <>
      <Button
        ref={launcher}
        className={cn(
          'fixed bottom-5 right-5 z-40 rounded-full shadow-lg',
          settings?.mutations_enabled && 'ring-2 ring-warning',
          panel.open && 'invisible'
        )}
        size="lg"
        aria-label="Open AI assistant"
        aria-describedby={
          launcherStatus ? 'assistant-launcher-status' : undefined
        }
        onClick={() => {
          setUnread(false);
          setPanel((previous) => ({ ...previous, open: true }));
        }}
      >
        <Bot />
        AI assistant
        {launcherStatus && (
          <span
            id="assistant-launcher-status"
            className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-xs"
          >
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', launcherStatus.className)}
            />
            {launcherStatus.label}
          </span>
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
          className="assistant-panel fixed bottom-4 right-4 z-50 flex flex-col overflow-clip rounded-lg border border-border bg-card text-foreground shadow-2xl"
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
            {view === 'settings' ? (
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                aria-label="Back to chat"
                title="Back to chat"
                onClick={() => setView('chat')}
              >
                <ChevronLeft />
              </Button>
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bot aria-hidden="true" className="size-4" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 id="assistant-title" className="text-sm font-semibold">
                AI assistant
                {view === 'settings' && (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    · Settings
                  </span>
                )}
              </h2>
              <p
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                role="status"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    TONE_DOT[status.tone],
                    (status.tone === 'active' || !connected) &&
                      assistant.connectionState !== 'disconnected' &&
                      'animate-pulse'
                  )}
                />
                <span className="truncate">{status.label}</span>
              </p>
            </div>
            {view === 'chat' && (
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                title="Assistant settings"
                aria-label="Assistant settings"
                onClick={() => setView('settings')}
              >
                <Settings />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="assistant-maximize size-8"
              title={panel.maximized ? 'Restore size' : 'Maximize'}
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
              className="size-8"
              title="Close (runs keep going)"
              aria-label="Close assistant (keep running)"
              onClick={close}
            >
              <X />
            </Button>
          </header>
          {settings?.mutations_enabled && (
            <div
              role="status"
              className="flex shrink-0 items-center gap-2 border-b border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
            >
              <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
              <p className="min-w-0 flex-1">
                <strong>Write access is active</strong>
                <span className="text-warning/90">
                  {' '}
                  · {writes.length} {writes.length === 1 ? 'tool' : 'tools'} can
                  change data after your approval
                </span>
              </p>
              <Button
                size="xs"
                variant="secondary"
                disabled={assistant.busy || !connected}
                onClick={() => {
                  void assistant
                    .updateSettings({ mutations_enabled: false })
                    .then((ok) => {
                      if (ok) showToast('Write access disabled', 'success');
                    });
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
              <AlertCircle
                aria-hidden="true"
                className="mt-px size-4 shrink-0"
              />
              <p className="flex-1 break-words">{assistant.error}</p>
              <Button
                size="icon"
                variant="ghost"
                className="-my-1 size-6 text-destructive hover:text-destructive"
                aria-label="Dismiss assistant error"
                onClick={assistant.dismissError}
              >
                <X />
              </Button>
            </div>
          )}
          {data && !connected && (
            <div
              role="status"
              className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs"
            >
              <p className="flex-1 text-muted-foreground">
                Connection unavailable. Saved content is shown; sending and
                settings changes are paused.
              </p>
              <Button
                size="xs"
                variant="secondary"
                onClick={assistant.retryConnection}
              >
                <RotateCcw />
                Retry connection
              </Button>
            </div>
          )}
          {!data ? (
            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <AssistantConnectionSetup
                state={assistant.connectionState}
                failed={
                  !!assistant.error ||
                  assistant.connectionState === 'reconnecting' ||
                  assistant.connectionState === 'disconnected'
                }
                retry={assistant.retryConnection}
              />
            </div>
          ) : view === 'settings' ? (
            <div className="relative min-h-0 flex-1 overflow-y-auto">
              <AssistantSettings
                data={data}
                busy={assistant.busy || !connected}
                update={assistant.updateSettings}
                saveProfile={async (input) => {
                  const ok = await assistant.saveProfile(input);
                  if (ok)
                    showToast(
                      input.id ? 'Connection updated' : 'Connection added',
                      'success'
                    );
                  return ok;
                }}
                deleteProfile={async (id) => {
                  const ok = await assistant.deleteProfile(id);
                  if (ok) showToast('Connection deleted', 'success');
                  return ok;
                }}
              />
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
                <label htmlFor="assistant-session" className="sr-only">
                  Conversation
                </label>
                <select
                  id="assistant-session"
                  className="h-8 min-w-0 flex-1 truncate rounded-sm border border-transparent bg-transparent px-2 text-xs font-medium hover:border-input"
                  value={assistant.snapshot?.session.id ?? ''}
                  disabled={!connected || assistant.busy}
                  onChange={(event) => {
                    setConfirmDelete(false);
                    setStick(true);
                    void assistant.selectSession(event.target.value);
                  }}
                >
                  <option value="" disabled>
                    {data.sessions.length
                      ? 'Choose a conversation'
                      : 'New conversation'}
                  </option>
                  {data.sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title || 'Untitled conversation'}
                      {isActiveStatus(session.status)
                        ? ` · ${runStatus(session.status).label}`
                        : ''}
                    </option>
                  ))}
                </select>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  title="New conversation"
                  aria-label="New conversation"
                  disabled={!connected || assistant.busy}
                  onClick={() => {
                    setConfirmDelete(false);
                    setStick(true);
                    void assistant.createSession().then(() => {
                      composer.current?.focus();
                    });
                  }}
                >
                  <Plus />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  title={
                    running
                      ? 'Stop the run before deleting'
                      : 'Delete conversation'
                  }
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
                  className="flex shrink-0 flex-wrap items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-3 py-2 text-xs"
                >
                  <p className="min-w-0 flex-1">
                    Permanently delete this conversation and its activity?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Keep conversation
                    </Button>
                    <Button
                      variant="destructive"
                      size="xs"
                      disabled={assistant.busy}
                      loading={assistant.busy}
                      onClick={() => {
                        void assistant.deleteSession().then((ok) => {
                          setConfirmDelete(false);
                          if (ok) showToast('Conversation deleted', 'success');
                        });
                      }}
                    >
                      Delete conversation
                    </Button>
                  </div>
                </div>
              )}
              <div className="relative flex min-h-0 flex-1 flex-col">
                <div
                  ref={scroll}
                  onScroll={() => {
                    const element = scroll.current;
                    if (!element) return;
                    const distance =
                      element.scrollHeight -
                      element.scrollTop -
                      element.clientHeight;
                    // Programmatic and smooth scrolls only move down, so only
                    // an upward move away from the bottom releases the pin.
                    const movedUp =
                      element.scrollTop < lastScrollTop.current - 1;
                    lastScrollTop.current = element.scrollTop;
                    if (distance < 80) {
                      if (!stickToBottom.current) setStick(true);
                    } else if (movedUp && stickToBottom.current) {
                      setStick(false);
                    }
                  }}
                  className="relative min-h-0 flex-1 overflow-y-auto"
                >
                  <div ref={content} className="space-y-5 p-4">
                    {assistant.snapshot?.has_older_messages && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        disabled={assistant.busy || !connected}
                        onClick={() => {
                          const previousHeight =
                            scroll.current?.scrollHeight ?? 0;
                          const previousTop = scroll.current?.scrollTop ?? 0;
                          setStick(false);
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
                    {visibleMessages.length === 0 && !streaming && !running && (
                      <div className="flex flex-col items-center py-8 text-center">
                        <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Sparkles aria-hidden="true" className="size-5" />
                        </span>
                        <h3 className="text-base font-medium">
                          How can I help?
                        </h3>
                        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                          Ask a question, review app activity, or manage users,
                          groups, projects, and security.
                        </p>
                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
                          {settings?.mutations_enabled ? (
                            <>
                              <AlertTriangle
                                aria-hidden="true"
                                className="size-3.5 text-warning"
                              />
                              Change tools require your approval.
                            </>
                          ) : (
                            <>
                              <ShieldCheck
                                aria-hidden="true"
                                className="size-3.5 text-success"
                              />
                              Read-only · changes are disabled
                            </>
                          )}
                        </p>
                        <div className="mt-5 flex w-full max-w-xs flex-col gap-2">
                          {SUGGESTIONS.map((prompt) => (
                            <Button
                              key={prompt}
                              variant="secondary"
                              size="sm"
                              className="justify-start"
                              disabled={!!block}
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
                    {visibleMessages.map((message) => (
                      <MessageItem key={message.id} message={message} />
                    ))}
                    {streaming && (
                      <article
                        aria-label="Assistant generating"
                        aria-busy={run?.status === 'running'}
                        className="min-w-0"
                      >
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Sparkles
                            aria-hidden="true"
                            className="size-3.5 text-primary"
                          />
                          <span className="font-medium text-foreground">
                            Assistant
                          </span>
                        </div>
                        <Markdown
                          content={streaming}
                          streaming={run?.status === 'running'}
                        />
                      </article>
                    )}
                    {progress && <AssistantRunProgress progress={progress} />}
                    {run?.status === 'interrupted' && !run.error && (
                      <div
                        role="alert"
                        className="flex gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs"
                      >
                        <AlertTriangle
                          aria-hidden="true"
                          className="size-4 shrink-0 text-warning"
                        />
                        <p>
                          <strong className="block text-sm font-medium">
                            Run interrupted
                          </strong>
                          The server stopped during this run. Review the
                          activity log before retrying; changes are never
                          retried automatically.
                        </p>
                      </div>
                    )}
                    {run?.status === 'cancelled' && (
                      <p
                        role="status"
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <CircleSlash aria-hidden="true" className="size-3.5" />
                        Run stopped. Any partial output is kept above.
                      </p>
                    )}
                    {run?.error && (
                      <div
                        role="alert"
                        className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs"
                      >
                        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                          <AlertCircle aria-hidden="true" className="size-4" />
                          The run failed
                        </p>
                        <p className="break-words text-foreground/90">
                          {run.error}
                        </p>
                        {lastUserMessage && !running && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              size="xs"
                              variant="secondary"
                              disabled={!!block || assistant.busy || !connected}
                              onClick={() => {
                                void send(lastUserMessage.content);
                              }}
                            >
                              <RotateCcw />
                              Retry
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => {
                                setDraft(lastUserMessage.content);
                                composer.current?.focus();
                              }}
                            >
                              <Pencil />
                              Edit message
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => setView('settings')}
                            >
                              <Settings />
                              Check connection
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <AssistantInterruptions
                      key={run?.id ?? 'none'}
                      snapshot={assistant.snapshot}
                      tools={data.tools}
                      busy={assistant.busy || !connected}
                      resume={assistant.resume}
                    />
                    <AssistantActivity
                      snapshot={assistant.snapshot}
                      tools={data.tools}
                    />
                  </div>
                </div>
                {!atBottom && (
                  <Button
                    size="xs"
                    variant="secondary"
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full shadow-md"
                    onClick={() => scrollToBottom(true)}
                  >
                    <ArrowDown />
                    {running ? 'Follow progress' : 'Jump to latest'}
                  </Button>
                )}
              </div>
              <AssistantComposer
                composer={composer}
                draft={draft}
                setDraft={setDraft}
                profiles={enabledProfiles}
                profile={selectedProfile}
                setProfile={setProfile}
                running={running}
                waiting={waiting}
                busy={assistant.busy}
                connected={connected}
                block={block}
                onSend={send}
                onStop={assistant.cancel}
                onOpenSettings={() => setView('settings')}
              />
            </>
          )}
          {!panel.maximized && (
            <button
              aria-label="Resize assistant"
              title="Drag to resize"
              className="assistant-resize absolute left-0 top-0 size-3 cursor-nwse-resize touch-none rounded-tl-lg border-l-2 border-t-2 border-primary/50 focus-visible:outline-2 focus-visible:outline-primary"
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
