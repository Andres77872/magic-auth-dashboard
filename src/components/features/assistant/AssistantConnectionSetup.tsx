import type { JSX } from 'react';
import { Button } from '@/components/ui/button';
import {
  assistantWebSocketUrl,
  type AssistantConnectionState,
} from '@/services/assistant.service';

export function AssistantConnectionSetup({
  state,
  failed,
  retry,
}: {
  state: AssistantConnectionState;
  failed: boolean;
  retry: () => void;
}): JSX.Element {
  const connecting =
    !failed && (state === 'connecting' || state === 'connected');
  return (
    <div className="space-y-5 p-4">
      <section className="space-y-3 rounded border border-border bg-muted/20 p-3">
        <h3 className="text-sm font-semibold">
          {connecting
            ? 'Connecting to the assistant'
            : 'Assistant connection unavailable'}
        </h3>
        <p className="text-sm text-muted-foreground">
          Provider settings and saved conversations load from the API server.
          They cannot be shown until the assistant connection is available.
        </p>
        {!connecting && (
          <p className="text-xs text-muted-foreground">
            {state === 'disconnected'
              ? 'Check your root sign-in and server configuration, then retry.'
              : 'The client retries automatically. You can retry now after the server is ready.'}
          </p>
        )}
        <Button type="button" variant="secondary" size="sm" onClick={retry}>
          Retry connection
        </Button>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium">
            Connection details
          </summary>
          <p className="mt-2 break-all">
            Endpoint: <code>{assistantWebSocketUrl()}</code>
          </p>
          <p className="mt-2">
            The API must run with WebSocket support and accept this dashboard’s
            origin. A reverse proxy must forward WebSocket upgrades. Check the
            API server logs if the connection keeps failing.
          </p>
        </details>
      </section>
      <section className="space-y-2 text-sm">
        <h3 className="font-semibold">Where to configure your AI provider</h3>
        <p className="text-muted-foreground">
          Once connected, open the assistant’s settings button, then{' '}
          <strong>Connections</strong>.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-xs text-muted-foreground">
          <li>
            Edit <strong>Local Ollama</strong>, or choose{' '}
            <strong>Add connection</strong> for Ollama, OpenAI compatible, or
            Anthropic compatible.
          </li>
          <li>
            Set the base URL reachable from the API server, model, and API key
            when needed, then choose <strong>Save connection</strong>.
          </li>
          <li>
            Select the <strong>Default connection</strong> and turn on{' '}
            <strong>Enable AI assistant</strong>.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">
          Write access is configured separately and remains disabled by default.
        </p>
      </section>
    </div>
  );
}
