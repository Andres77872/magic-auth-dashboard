/**
 * Write-only OAuth credentials.
 *
 * The server cannot return a stored secret, so there is no reveal control and no
 * input is ever seeded from a response — the status grid shows presence flags, a
 * 12-character fingerprint and "set at" only.
 *
 * The root gate is a RENDER-LEVEL BRANCH: a non-root user sees a warning panel, not
 * a disabled form. That is UX; api.auth enforces root on every secret-accepting route.
 */

import React from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/common';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import type { OAuthCredentialsRequest, OAuthCredentialsStatus } from '@/types/oauth.types';
import { credentialStatusVariant } from './oauth-status';

export interface OAuthCredentialsTabProps {
  connectionHash: string;
  providerType: string;
  credentials: OAuthCredentialsStatus | null;
  /** UX gate only — the server refuses non-root writes regardless. */
  isRoot: boolean;
  onChanged: () => void;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OAuthCredentialsTab({
  connectionHash,
  providerType,
  credentials,
  isRoot,
  onChanged,
}: OAuthCredentialsTabProps): React.JSX.Element {
  const { showToast } = useToast();
  const [clientSecret, setClientSecret] = React.useState('');
  const [signingKey, setSigningKey] = React.useState('');
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const status = credentials?.credential_status ?? 'absent';
  const active = status === 'active';

  const payload = (): OAuthCredentialsRequest => ({
    client_secret: clientSecret.trim() || undefined,
    signing_key: signingKey.trim() || undefined,
  });

  const testConnection = async (): Promise<void> => {
    setTesting(true);
    try {
      const response = await oauthService.testCredentials(connectionHash, payload());
      const result = response.result;
      if (result?.valid) {
        setTestResult(
          result.client_secret_fingerprint
            ? `valid · this secret would be stored as ${result.client_secret_fingerprint}`
            : 'valid',
        );
        showToast('OAuth connection validated', 'success');
      } else {
        const problems = result?.problems ?? [];
        setTestResult(problems.length > 0 ? problems.join('; ') : 'invalid');
        showToast('OAuth connection is not valid', 'error');
      }
    } catch (err) {
      setTestResult(null);
      showToast(errorMessage(err, 'Credential test failed'), 'error');
    } finally {
      setTesting(false);
    }
  };

  const save = async (): Promise<void> => {
    if (!clientSecret.trim() && !signingKey.trim()) {
      showToast('Enter a client secret or a signing key', 'error');
      return;
    }
    setSaving(true);
    try {
      await oauthService.setCredentials(connectionHash, payload());
      showToast(
        active
          ? 'Credentials rotated (encrypted; never echoed)'
          : 'Credentials saved (encrypted; never echoed)',
        'success',
      );
      // Clear the inputs so a typed secret does not linger in component state or the DOM.
      setClientSecret('');
      setSigningKey('');
      setTestResult(null);
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save credentials'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={credentialStatusVariant(status)}>{status}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Client secret: </span>
            {credentials?.has_client_secret ? (
              <>
                set (
                <span className="font-mono text-xs">{credentials.client_secret_fingerprint}</span>)
              </>
            ) : (
              'not set'
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Signing key: </span>
            {credentials?.has_signing_key ? (
              <>
                set (
                <span className="font-mono text-xs">{credentials.signing_key_fingerprint}</span>)
              </>
            ) : (
              'not set'
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Set at: </span>
            <span className="font-mono text-xs">{credentials?.credentials_set_at || '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Encryption key id: </span>
            <span className="font-mono text-xs">{credentials?.credential_key_id || '—'}</span>
          </div>
        </div>

        {!isRoot ? (
          <div
            role="note"
            className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Only root users can set or rotate OAuth credentials. Ask a root administrator to
              store the secret for this connection.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="oauth-client-secret">Client secret</Label>
              <Input
                id="oauth-client-secret"
                type="password"
                autoComplete="new-password"
                placeholder="Paste the secret from the provider console"
                value={clientSecret}
                onChange={(event) => setClientSecret(event.target.value)}
                fullWidth
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oauth-signing-key">
                Signing key (optional — Apple .p8 and other key-signed providers)
              </Label>
              <Input
                id="oauth-signing-key"
                type="password"
                autoComplete="new-password"
                placeholder="Paste the private signing key"
                value={signingKey}
                onChange={(event) => setSigningKey(event.target.value)}
                fullWidth
              />
            </div>

            {testResult && (
              <div className="rounded-md border border-border p-2 text-sm text-muted-foreground">
                {testResult}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => void testConnection()}
                loading={testing}
                disabled={saving}
              >
                Test connection
              </Button>
              <Button onClick={() => void save()} loading={saving} disabled={testing}>
                <KeyRound size={16} className="mr-1" />
                {active ? 'Rotate credentials' : 'Save credentials'}
              </Button>
            </div>

            {active && (
              <p className="text-xs text-warning">
                Rotating replaces the stored secret immediately — the previous secret stops
                working for every project bound to this {providerType} connection.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Secrets are encrypted server-side and never returned — only presence flags and
              fingerprints are shown. Test the connection before saving; a mistyped secret breaks
              sign-in for every bound project.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OAuthCredentialsTab;
