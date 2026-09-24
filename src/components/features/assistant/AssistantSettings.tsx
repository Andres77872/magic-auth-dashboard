import { useState, type JSX } from 'react';
import { AlertTriangle, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type {
  AssistantBootstrap,
  AssistantProfile,
  AssistantProfileInput,
  AssistantProvider,
  AssistantSettings as Settings,
} from '@/types/assistant.types';

const selectClass =
  'h-9 w-full rounded-sm border border-input bg-card px-2 text-sm';
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
    profile?.base_url ?? 'http://localhost:11434'
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
  return (
    <form
      className="space-y-3 rounded border border-border bg-muted/30 p-3"
      onSubmit={(event) => {
        event.preventDefault();
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
          if (ok) {
            setApiKey('');
            onClose();
          }
        });
      }}
    >
      <h4 className="font-medium">
        {profile ? 'Edit connection' : 'New connection'}
      </h4>
      <Input
        label="Connection name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={100}
      />
      <label className="block text-sm">
        API format
        <select
          className={`${selectClass} mt-1`}
          value={provider}
          onChange={(event) => {
            const value = event.target.value as AssistantProvider;
            setProvider(value);
            setBaseUrl(
              value === 'ollama'
                ? 'http://localhost:11434'
                : value === 'openai'
                  ? 'https://api.openai.com/v1'
                  : 'https://api.anthropic.com'
            );
          }}
        >
          <option value="ollama">Ollama</option>
          <option value="openai">OpenAI compatible</option>
          <option value="anthropic">Anthropic compatible</option>
        </select>
      </label>
      <Input
        label="Base URL (reachable from the API server)"
        value={baseUrl}
        type="url"
        required
        onChange={(event) => setBaseUrl(event.target.value)}
      />
      <Input
        label="Model"
        placeholder={provider === 'ollama' ? 'qwen3:8b' : 'Provider model ID'}
        value={model}
        onChange={(event) => setModel(event.target.value)}
        required
        maxLength={200}
      />
      <Input
        label={
          profile?.has_api_key
            ? 'Replace API key (leave blank to keep current)'
            : 'API key (optional for Ollama)'
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
        storage. Multiple connections can stay enabled.
      </p>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          <Save />
          Save connection
        </Button>
        <Button variant="ghost" type="button" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
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
  deleteProfile: (id: string) => Promise<void>;
}): JSX.Element {
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmWrites, setConfirmWrites] = useState(false);
  const [query, setQuery] = useState('');
  const settings = data.settings;
  const toggle = (values: string[], id: string, enabled: boolean): string[] =>
    enabled
      ? Array.from(new Set([...values, id]))
      : values.filter((value) => value !== id);
  const enabledWrites = data.tools.filter(
    (tool) => tool.mutating && settings.enabled_tools.includes(tool.name)
  );
  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Assistant controls</h3>
        <Switch
          label="Enable AI assistant"
          checked={settings.enabled}
          disabled={busy}
          onCheckedChange={(enabled) => {
            void update({ enabled });
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Execution and conversation history live on the backend. General
          questions can be answered without app tools.
        </p>
      </div>
      {data.usage && (
        <p className="rounded border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          Saved usage: {(data.usage.runs ?? 0).toLocaleString()} runs ·{' '}
          {(data.usage.input_tokens ?? 0).toLocaleString()} input tokens ·{' '}
          {(data.usage.output_tokens ?? 0).toLocaleString()} output tokens
        </p>
      )}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Connections</h3>
        {data.profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center justify-between gap-2 rounded border border-border p-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {profile.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {profile.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile.provider} · {profile.model}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setEditing(profile.id)}
              >
                Edit
              </Button>
              <Button
                aria-label={`Delete ${profile.name}`}
                size="xs"
                variant="ghost"
                disabled={busy}
                onClick={() => setDeleteId(profile.id)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        {deleteId && (
          <div
            role="alert"
            className="rounded border border-destructive/40 p-3 text-sm"
          >
            Delete this provider connection? Saved sessions remain.
            <div className="mt-2 flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => {
                  void deleteProfile(deleteId).then(() => setDeleteId(null));
                }}
              >
                Delete connection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(null)}
              >
                Keep connection
              </Button>
            </div>
          </div>
        )}
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
            onClick={() => setEditing('new')}
          >
            <Plus />
            Add connection
          </Button>
        )}
        <label className="block text-sm">
          Default connection
          <select
            className={`${selectClass} mt-1`}
            value={settings.default_profile_id ?? ''}
            disabled={busy}
            onChange={(event) => {
              void update({ default_profile_id: event.target.value || null });
            }}
          >
            <option value="">Choose a connection</option>
            {data.profiles
              .filter((profile) => profile.enabled)
              .map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
          </select>
        </label>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Agent features</h3>
        {(
          [
            { key: 'planning', label: 'Task planning' },
            { key: 'memory', label: 'Persistent assistant memory' },
            { key: 'ask_user', label: 'Ask for clarification' },
          ] as const
        ).map((feature) => (
          <Switch
            key={feature.key}
            checked={settings.features[feature.key]}
            disabled={busy}
            label={feature.label}
            onCheckedChange={(enabled) => {
              void update({
                features: {
                  ...settings.features,
                  [feature.key]: enabled,
                  subagents: true,
                },
              });
            }}
          />
        ))}
        <p className="text-xs text-muted-foreground">
          Subagents are always available. Skills load as needed; several can be
          used in the same task.
        </p>
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Write access</h3>
        <Switch
          label="Allow tools that change app data"
          checked={settings.mutations_enabled}
          disabled={busy}
          onCheckedChange={(enabled) => {
            if (enabled) setConfirmWrites(true);
            else {
              void update({ mutations_enabled: false });
              setConfirmWrites(false);
            }
          }}
        />
        {confirmWrites && (
          <div
            className="rounded border border-warning/50 bg-warning/10 p-3 text-sm"
            role="alert"
          >
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4" />
              Enable write access?
            </p>
            <p className="my-2">
              Selected tools can create, edit, or delete application data. Every
              write still requires your review before execution. Enable each
              write tool below.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  void update({ mutations_enabled: true }).then((ok) => {
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
            className="rounded border border-warning/50 bg-warning/10 p-2 text-xs text-warning"
          >
            Write access is active. {enabledWrites.length} change tools
            selected. Approval is required before changes.
          </p>
        )}
      </section>
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Skills and tools</h3>
        <p className="text-xs text-muted-foreground">
          All read tools are available by default. Disabling a skill removes its
          toolset from new agent runs. Changes to settings affect new runs;
          disable write access to revoke changes immediately.
        </p>
        <Input
          aria-label="Filter skills and tools"
          placeholder="Filter skills or tools…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {data.skills.map((skill) => {
          const tools = data.tools.filter((tool) => tool.skill_id === skill.id);
          const filter = query.toLowerCase();
          if (
            filter &&
            !`${skill.name} ${skill.description}`
              .toLowerCase()
              .includes(filter) &&
            !tools.some((tool) =>
              `${tool.name} ${tool.description}`.toLowerCase().includes(filter)
            )
          )
            return null;
          const skillEnabled = settings.enabled_skills.includes(skill.id);
          return (
            <details
              key={skill.id}
              className="rounded border border-border"
              open={query ? true : undefined}
            >
              <summary className="cursor-pointer p-3 text-sm font-medium">
                {skill.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {skillEnabled ? 'Enabled' : 'Disabled'} · {tools.length} tools
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
                    void update({
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
                          void update({
                            enabled_tools: toggle(
                              settings.enabled_tools,
                              tool.name,
                              enabled
                            ),
                          });
                        }}
                      />
                      <p
                        className={`break-all text-xs ${tool.mutating ? 'text-warning' : 'text-muted-foreground'}`}
                      >
                        {tool.mutating ? 'Changes data' : 'Read only'} ·{' '}
                        {tool.method} {tool.path}
                      </p>
                    </div>
                  ))}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
