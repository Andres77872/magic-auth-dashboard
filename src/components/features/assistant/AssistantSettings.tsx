import { useEffect, useState, type JSX, type ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type {
  AssistantBootstrap,
  AssistantProfile,
  AssistantProfileInput,
  AssistantProvider,
  AssistantSettings as Settings,
} from '@/types/assistant.types';

const selectClass =
  'h-9 w-full rounded-sm border border-input bg-card px-2 text-sm';
const PROVIDERS: Record<
  AssistantProvider,
  { label: string; baseUrl: string; model: string }
> = {
  ollama: {
    label: 'Ollama',
    baseUrl: 'http://localhost:11434',
    model: 'qwen3:8b',
  },
  openai: {
    label: 'OpenAI compatible',
    baseUrl: 'https://api.openai.com/v1',
    model: 'Provider model ID',
  },
  anthropic: {
    label: 'Anthropic compatible',
    baseUrl: 'https://api.anthropic.com',
    model: 'Provider model ID',
  },
};
/**
 * Hosts api.auth accepts without configuration. Any other provider host must
 * be listed in the backend's ASSISTANT_PROVIDER_HOSTS (see ProfileInput).
 */
const BUILTIN_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '[::1]',
  'api.openai.com',
  'api.anthropic.com',
]);
/** Hostname of a custom provider URL, or null for built-in/invalid URLs. */
function customProviderHost(value: string): string | null {
  try {
    const host = new URL(value.trim()).hostname.toLowerCase();
    return host && !BUILTIN_HOSTS.has(host) ? host : null;
  } catch {
    return null;
  }
}
const DEFAULT_URLS = new Set(
  Object.values(PROVIDERS).map((provider) => provider.baseUrl)
);

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ProfileEditor({
  profile,
  busy,
  onSave,
  onClose,
}: {
  profile: AssistantProfile | null;
  busy: boolean;
  onSave: (input: AssistantProfileInput) => Promise<boolean>;
  onClose: () => void;
}): JSX.Element {
  const [provider, setProvider] = useState<AssistantProvider>(
    profile?.provider ?? 'ollama'
  );
  const [name, setName] = useState(profile?.name ?? '');
  const [baseUrl, setBaseUrl] = useState(
    profile?.base_url ?? PROVIDERS.ollama.baseUrl
  );
  const [model, setModel] = useState(profile?.model ?? '');
  const [apiKey, setApiKey] = useState('');
  const [clearKey, setClearKey] = useState(false);
  const [enabled, setEnabled] = useState(profile?.enabled ?? true);
  const [temperature, setTemperature] = useState(profile?.temperature ?? 0);
  const [maxTokens, setMaxTokens] = useState(profile?.max_tokens ?? 4096);
  const [contextWindow, setContextWindow] = useState(
    profile?.context_window ?? 32768
  );
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const customHost = customProviderHost(baseUrl);
  return (
    <form
      aria-label={profile ? `Edit ${profile.name}` : 'New connection'}
      className="space-y-3 rounded-md border border-primary/30 bg-muted/30 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setSaving(true);
        void onSave({
          id: profile?.id,
          name: name.trim(),
          provider,
          base_url: baseUrl.trim(),
          model: model.trim(),
          enabled,
          temperature,
          max_tokens: maxTokens,
          context_window: contextWindow,
          ...(clearKey ? { api_key: '' } : apiKey ? { api_key: apiKey } : {}),
        }).then((ok) => {
          setSaving(false);
          setFailed(!ok);
          if (ok) {
            setApiKey('');
            onClose();
          }
        });
      }}
    >
      <h4 className="font-medium">
        {profile ? `Edit ${profile.name}` : 'New connection'}
      </h4>
      <Input
        label="Connection name"
        placeholder="e.g. Team Ollama"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={100}
      />
      <label className="block text-sm font-medium">
        API format
        <select
          className={`${selectClass} mt-1.5 font-normal`}
          value={provider}
          onChange={(event) => {
            const value = event.target.value as AssistantProvider;
            setProvider(value);
            // Keep a custom URL; only swap the provider's stock default.
            if (!baseUrl.trim() || DEFAULT_URLS.has(baseUrl.trim()))
              setBaseUrl(PROVIDERS[value].baseUrl);
          }}
        >
          {Object.entries(PROVIDERS).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <Input
        label="Base URL"
        helperText={
          customHost
            ? `Custom host: the API server only accepts ${customHost} if it is listed in its ASSISTANT_PROVIDER_HOSTS setting.`
            : 'Must be reachable from the API server, not from this browser.'
        }
        value={baseUrl}
        type="url"
        required
        onChange={(event) => setBaseUrl(event.target.value)}
      />
      <Input
        label="Model"
        placeholder={PROVIDERS[provider].model}
        value={model}
        onChange={(event) => setModel(event.target.value)}
        required
        maxLength={200}
      />
      <Input
        label={
          profile?.has_api_key
            ? 'Replace API key (leave blank to keep current)'
            : provider === 'ollama'
              ? 'API key (optional for Ollama)'
              : 'API key'
        }
        type="password"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        autoComplete="new-password"
        disabled={clearKey}
      />
      {profile?.has_api_key && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={clearKey}
            onChange={(event) => setClearKey(event.target.checked)}
          />
          Remove the saved API key
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          label="Temperature"
          min={0}
          max={2}
          step={0.1}
          value={temperature}
          onChange={(event) => setTemperature(Number(event.target.value))}
        />
        <Input
          type="number"
          label="Max output tokens"
          min={128}
          max={32768}
          step={128}
          value={maxTokens}
          onChange={(event) => setMaxTokens(Number(event.target.value))}
        />
      </div>
      {provider === 'ollama' && (
        <Input
          type="number"
          label="Context window (tokens)"
          helperText="Set this within the model's supported context and available server memory."
          min={4096}
          max={262144}
          step={1024}
          value={contextWindow}
          onChange={(event) => setContextWindow(Number(event.target.value))}
        />
      )}
      <Switch
        label="Connection enabled"
        checked={enabled}
        onCheckedChange={setEnabled}
      />
      <p className="text-xs text-muted-foreground">
        Keys are sent directly to the backend and are never stored in browser
        storage.
      </p>
      {failed && (
        <div
          role="alert"
          className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs"
        >
          <AlertTriangle
            aria-hidden="true"
            className="mt-px size-3.5 shrink-0 text-destructive"
          />
          <div className="space-y-1">
            <p className="font-medium text-destructive">
              The API server did not save this connection.
            </p>
            {customHost ? (
              <p>
                Custom provider hosts must be allowed by the API server. Add{' '}
                <code className="rounded bg-muted px-1 font-mono">
                  {customHost}
                </code>{' '}
                to <code className="font-mono">ASSISTANT_PROVIDER_HOSTS</code>{' '}
                in the API configuration, restart the API, then save again.
              </p>
            ) : (
              <p>
                Check the base URL (HTTPS for cloud providers, no credentials,
                query, or fragment) and that the numeric values are within
                range, then save again.
              </p>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={busy} loading={saving}>
          {!saving && <Save />}
          Save connection
        </Button>
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'failed';

export function AssistantSettings({
  data,
  busy,
  update,
  saveProfile,
  deleteProfile,
}: {
  data: AssistantBootstrap;
  busy: boolean;
  update: (settings: Partial<Settings>) => Promise<boolean>;
  saveProfile: (profile: AssistantProfileInput) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
}): JSX.Element {
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmWrites, setConfirmWrites] = useState(false);
  const [query, setQuery] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = setTimeout(() => setSaveState('idle'), 2500);
    return () => clearTimeout(timer);
  }, [saveState]);
  const settings = data.settings;
  const save = async (changes: Partial<Settings>): Promise<boolean> => {
    setSaveState('saving');
    const ok = await update(changes);
    setSaveState(ok ? 'saved' : 'failed');
    return ok;
  };
  const toggle = (values: string[], id: string, enabled: boolean): string[] =>
    enabled
      ? Array.from(new Set([...values, id]))
      : values.filter((value) => value !== id);
  const enabledWrites = data.tools.filter(
    (tool) => tool.mutating && settings.enabled_tools.includes(tool.name)
  );
  const defaultProfile = data.profiles.find(
    (profile) => profile.id === settings.default_profile_id && profile.enabled
  );
  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card/95 px-4 py-2 text-xs text-muted-foreground backdrop-blur"
        aria-live="polite"
      >
        <span className="flex-1">Changes apply to new runs.</span>
        {saveState === 'saving' && (
          <span className="flex items-center gap-1.5">
            <Loader2 aria-hidden="true" className="assistant-spin size-3.5" />
            Saving…
          </span>
        )}
        {saveState === 'saved' && (
          <span className="flex items-center gap-1.5 text-success">
            <Check aria-hidden="true" className="size-3.5" />
            Saved
          </span>
        )}
        {saveState === 'failed' && (
          <span className="flex items-center gap-1.5 text-destructive">
            <AlertTriangle aria-hidden="true" className="size-3.5" />
            Not saved
          </span>
        )}
      </div>
      <div className="space-y-7 p-4">
        <Section
          title="Assistant"
          description="Execution and conversation history live on the backend. General questions can be answered without app tools."
        >
          <Switch
            label="Enable AI assistant"
            checked={settings.enabled}
            disabled={busy}
            onCheckedChange={(enabled) => {
              void save({ enabled });
            }}
          />
          {data.usage && (
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Runs', data.usage.runs],
                ['Input tokens', data.usage.input_tokens],
                ['Output tokens', data.usage.output_tokens],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-border bg-muted/20 px-2 py-2"
                >
                  <dd className="text-sm font-semibold tabular-nums">
                    {(Number(value) || 0).toLocaleString()}
                  </dd>
                  <dt className="text-[11px] text-muted-foreground">{label}</dt>
                </div>
              ))}
            </dl>
          )}
        </Section>
        <Section
          title="Connections"
          description="The default connection is used for new conversations. You can switch connections per message from the composer."
        >
          {!defaultProfile &&
            data.profiles.some((profile) => profile.enabled) && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/5 p-2 text-xs"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-warning"
                />
                No default connection. Choose <strong>Make default</strong> on
                one below.
              </p>
            )}
          {data.profiles.length === 0 && editing === null && (
            <p className="rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
              No connections yet. Add Ollama, an OpenAI-compatible, or an
              Anthropic-compatible provider to start.
            </p>
          )}
          <ul className="space-y-2">
            {data.profiles.map((profile) => {
              const isDefault = profile.id === settings.default_profile_id;
              return (
                <li
                  key={profile.id}
                  className={cn(
                    'rounded-md border p-2.5',
                    isDefault ? 'border-primary/40' : 'border-border'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{profile.name}</span>
                        {isDefault && (
                          <Badge size="sm" variant="primary">
                            Default
                          </Badge>
                        )}
                        {!profile.enabled && (
                          <Badge size="sm" variant="secondary">
                            Disabled
                          </Badge>
                        )}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>
                          {PROVIDERS[profile.provider]?.label ??
                            profile.provider}
                        </span>
                        <code className="max-w-full truncate rounded bg-muted px-1 font-mono text-[11px]">
                          {profile.model}
                        </code>
                        {profile.has_api_key && (
                          <span
                            className="inline-flex items-center gap-1"
                            title="An API key is saved on the server"
                          >
                            <KeyRound aria-hidden="true" className="size-3" />
                            Key saved
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!isDefault && profile.enabled && (
                        <Button
                          size="xs"
                          variant="ghost"
                          disabled={busy}
                          aria-label={`Make ${profile.name} the default`}
                          onClick={() => {
                            void save({ default_profile_id: profile.id });
                          }}
                        >
                          <Star />
                          Make default
                        </Button>
                      )}
                      <Button
                        size="xs"
                        variant="ghost"
                        aria-label={`Edit ${profile.name}`}
                        title="Edit"
                        onClick={() => {
                          setDeleteId(null);
                          setEditing(profile.id);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label={`Delete ${profile.name}`}
                        title="Delete"
                        size="xs"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setDeleteId(profile.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  {deleteId === profile.id && (
                    <div
                      role="alert"
                      className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs"
                    >
                      <p className="min-w-0 flex-1">
                        Delete this connection? Saved conversations remain.
                      </p>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setDeleteId(null)}
                      >
                        Keep connection
                      </Button>
                      <Button
                        variant="destructive"
                        size="xs"
                        disabled={busy}
                        loading={busy}
                        onClick={() => {
                          void deleteProfile(profile.id).then((ok) => {
                            if (ok) setDeleteId(null);
                          });
                        }}
                      >
                        Delete connection
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {editing !== null ? (
            <ProfileEditor
              key={editing}
              profile={
                data.profiles.find((profile) => profile.id === editing) ?? null
              }
              busy={busy}
              onSave={saveProfile}
              onClose={() => setEditing(null)}
            />
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setDeleteId(null);
                setEditing('new');
              }}
            >
              <Plus />
              Add connection
            </Button>
          )}
        </Section>
        <Section title="Agent features">
          {(
            [
              {
                key: 'planning',
                label: 'Task planning',
                hint: 'Shows a step-by-step plan while it works.',
              },
              {
                key: 'memory',
                label: 'Persistent assistant memory',
                hint: 'Earlier turns in a conversation are remembered.',
              },
              {
                key: 'ask_user',
                label: 'Ask for clarification',
                hint: 'Pauses to ask you when a target or choice is unclear.',
              },
            ] as const
          ).map((feature) => (
            <div key={feature.key} className="space-y-0.5">
              <Switch
                checked={settings.features[feature.key]}
                disabled={busy}
                label={feature.label}
                onCheckedChange={(enabled) => {
                  void save({
                    features: {
                      ...settings.features,
                      [feature.key]: enabled,
                      subagents: true,
                    },
                  });
                }}
              />
              <p className="pl-[46px] text-xs text-muted-foreground">
                {feature.hint}
              </p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Subagents are always available. Skills load as needed; several can
            be used in the same task.
          </p>
        </Section>
        <Section
          title="Write access"
          description="Read tools are always safe to run. Write tools can change application data and always ask for your approval first."
        >
          <Switch
            label="Allow tools that change app data"
            checked={settings.mutations_enabled}
            disabled={busy}
            onCheckedChange={(enabled) => {
              if (enabled) setConfirmWrites(true);
              else {
                void save({ mutations_enabled: false });
                setConfirmWrites(false);
              }
            }}
          />
          {confirmWrites && (
            <div
              className="rounded-md border border-warning/50 bg-warning/10 p-3 text-sm"
              role="alert"
            >
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle aria-hidden="true" className="size-4" />
                Enable write access?
              </p>
              <p className="my-2 text-xs">
                Selected tools can create, edit, or delete application data.
                Every write still requires your review before execution. Enable
                each write tool under Skills and tools.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    void save({ mutations_enabled: true }).then((ok) => {
                      if (ok) setConfirmWrites(false);
                    });
                  }}
                >
                  Enable write access
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmWrites(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {settings.mutations_enabled && (
            <p
              role="status"
              className="rounded-md border border-warning/50 bg-warning/10 p-2 text-xs text-warning"
            >
              Write access is active. {enabledWrites.length} change{' '}
              {enabledWrites.length === 1 ? 'tool' : 'tools'} selected. Approval
              is required before changes.
            </p>
          )}
        </Section>
        <Section
          title="Skills and tools"
          description="All read tools are available by default. Disabling a skill removes its toolset from new runs; disable write access to revoke changes immediately."
        >
          <Input
            aria-label="Filter skills and tools"
            placeholder="Filter skills or tools…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {data.skills.map((skill) => {
            const tools = data.tools.filter(
              (tool) => tool.skill_id === skill.id
            );
            const filter = query.toLowerCase();
            if (
              filter &&
              !`${skill.name} ${skill.description}`
                .toLowerCase()
                .includes(filter) &&
              !tools.some((tool) =>
                `${tool.name} ${tool.description}`
                  .toLowerCase()
                  .includes(filter)
              )
            )
              return null;
            const skillEnabled = settings.enabled_skills.includes(skill.id);
            const active = tools.filter((tool) =>
              settings.enabled_tools.includes(tool.name)
            ).length;
            return (
              <details
                key={skill.id}
                className="group rounded-md border border-border"
                open={query ? true : undefined}
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{skill.name}</span>
                  <Badge
                    size="sm"
                    variant={skillEnabled ? 'success' : 'secondary'}
                  >
                    {skillEnabled ? `${active}/${tools.length} on` : 'Off'}
                  </Badge>
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform group-open:rotate-90"
                  >
                    ›
                  </span>
                </summary>
                <div className="space-y-3 border-t border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {skill.description}
                  </p>
                  <Switch
                    label={`Enable ${skill.name}`}
                    checked={skillEnabled}
                    disabled={busy}
                    onCheckedChange={(enabled) => {
                      void save({
                        enabled_skills: toggle(
                          settings.enabled_skills,
                          skill.id,
                          enabled
                        ),
                      });
                    }}
                  />
                  {tools
                    .filter(
                      (tool) =>
                        !filter ||
                        `${skill.name} ${tool.name} ${tool.description}`
                          .toLowerCase()
                          .includes(filter)
                    )
                    .map((tool) => (
                      <div
                        key={tool.name}
                        className="space-y-1 border-t border-border pt-3"
                      >
                        <Switch
                          label={tool.description || tool.name}
                          checked={settings.enabled_tools.includes(tool.name)}
                          disabled={
                            busy ||
                            !skillEnabled ||
                            (tool.mutating && !settings.mutations_enabled)
                          }
                          onCheckedChange={(enabled) => {
                            void save({
                              enabled_tools: toggle(
                                settings.enabled_tools,
                                tool.name,
                                enabled
                              ),
                            });
                          }}
                        />
                        <p className="flex flex-wrap items-center gap-1.5 pl-[46px] text-xs">
                          <Badge
                            size="sm"
                            variant={tool.mutating ? 'warning' : 'secondary'}
                          >
                            {tool.mutating ? 'Changes data' : 'Read only'}
                          </Badge>
                          <span className="break-all font-mono text-[11px] text-muted-foreground">
                            {tool.method} {tool.path}
                          </span>
                        </p>
                        {tool.mutating && !settings.mutations_enabled && (
                          <p className="pl-[46px] text-[11px] text-muted-foreground">
                            Turn on write access to enable this tool.
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </details>
            );
          })}
        </Section>
      </div>
    </div>
  );
}
