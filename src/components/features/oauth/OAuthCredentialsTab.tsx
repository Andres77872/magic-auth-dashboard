/**
 * Write-only OAuth credentials.
 *
 * The server cannot return a stored secret, so there is no reveal control and no
 * input is ever seeded from a response — the status shows presence flags, a
 * 12-character fingerprint and "set at" only.
 *
 * The root gate is a RENDER-LEVEL BRANCH: an admin sees the status and a short note,
 * not a disabled form. That is UX; api.auth enforces root on every secret-accepting route.
 */

import React from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { FactList } from '@/components/common/FactList';
import { Panel } from '@/components/common/Panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, formatRelativeTime } from '@/utils/formatters';
import type {
  OAuthCredentialProbeRequest,
  OAuthCredentialProbeResult,
  OAuthCredentialsRequest,
  OAuthCredentialsStatus,
} from '@/types/oauth.types';
import { credentialStatusPresentation } from './oauth-status';

export interface OAuthCredentialsTabProps {
  credentials: OAuthCredentialsStatus;
  /** Shown in the rotation warning. */
  connectionName: string;
  /** UX gate only — the server refuses non-root writes regardless. */
  isRoot: boolean;
  /** Resolves after the API stored the credentials and the connection was refetched. */
  onSave: (request: OAuthCredentialsRequest) => Promise<void>;
  /** Non-persisting probe of the stored configuration (+ fingerprint of a candidate secret). */
  onTest: (
    request: OAuthCredentialProbeRequest
  ) => Promise<OAuthCredentialProbeResult>;
}

type ProbeOutcome =
  | { kind: 'valid'; fingerprint?: string | null }
  | { kind: 'invalid'; problems: string[] };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

function presence(has: boolean, fingerprint?: string | null): React.ReactNode {
  if (!has) return <span className="text-muted-foreground">Not stored</span>;
  return (
    <span>
      Stored
      {fingerprint && (
        <span className="ml-1.5 font-mono text-xs text-muted-foreground">
          {fingerprint}
        </span>
      )}
    </span>
  );
}

export function OAuthCredentialsTab({
  credentials,
  connectionName,
  isRoot,
  onSave,
  onTest,
}: OAuthCredentialsTabProps): React.JSX.Element {
  const { showToast } = useToast();
  const [clientSecret, setClientSecret] = React.useState('');
  const [signingKey, setSigningKey] = React.useState('');
  const [probe, setProbe] = React.useState<ProbeOutcome | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const status = credentialStatusPresentation(credentials.credential_status);
  const stored =
    credentials.credential_status === 'active' ||
    credentials.credential_status === 'rotating';

  const testConnection = async (): Promise<void> => {
    setTesting(true);
    try {
      const result = await onTest({
        client_secret: clientSecret.trim() || undefined,
      });
      if (result.valid) {
        setProbe({
          kind: 'valid',
          fingerprint: result.client_secret_fingerprint,
        });
      } else {
        setProbe({ kind: 'invalid', problems: result.problems });
      }
    } catch (err) {
      setProbe(null);
      showToast(
        errorMessage(err, 'The connection could not be tested.'),
        'error'
      );
    } finally {
      setTesting(false);
    }
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const request: OAuthCredentialsRequest = {
      client_secret: clientSecret.trim() || undefined,
      signing_key: signingKey.trim() || undefined,
    };
    if (!request.client_secret && !request.signing_key) {
      showToast('Enter a client secret or a signing key.', 'error');
      return;
    }
    setSaving(true);
    try {
      await onSave(request);
      showToast(
        stored ? 'Credentials rotated' : 'Credentials saved',
        'success'
      );
      // Clear the inputs so a typed secret does not linger in component state or the DOM.
      setClientSecret('');
      setSigningKey('');
      setProbe(null);
    } catch (err) {
      showToast(
        errorMessage(err, 'The credentials could not be saved.'),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="Stored credentials"
        description="Secrets are encrypted server-side and never returned — only presence and fingerprints are shown."
        actions={
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        }
      >
        <FactList
          layout="grid"
          facts={[
            {
              label: 'Client secret',
              value: presence(
                credentials.has_client_secret,
                credentials.client_secret_fingerprint
              ),
            },
            {
              label: 'Signing key',
              value: presence(
                credentials.has_signing_key,
                credentials.signing_key_fingerprint
              ),
            },
            {
              label: 'Last set',
              value: credentials.credentials_set_at ? (
                <span title={formatDateTime(credentials.credentials_set_at)}>
                  {formatRelativeTime(credentials.credentials_set_at)}
                </span>
              ) : (
                <span className="text-muted-foreground">Never</span>
              ),
            },
            {
              label: 'Encryption key ID',
              value: credentials.credential_key_id || '—',
              mono: true,
            },
          ]}
        />
      </Panel>

      {!isRoot ? (
        <p
          role="note"
          className="m-0 flex items-start gap-2 text-xs text-muted-foreground"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Only root users can store or rotate OAuth credentials. Ask a root
          administrator to update this connection&apos;s secret.
        </p>
      ) : (
        <Panel
          title={stored ? 'Rotate credentials' : 'Store credentials'}
          description="Paste the values from the provider console. Leave a field empty to keep what is stored."
        >
          <form
            className="space-y-4"
            onSubmit={(event) => void save(event)}
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="oauth-client-secret">Client secret</Label>
              <Input
                id="oauth-client-secret"
                type="password"
                autoComplete="new-password"
                spellCheck={false}
                placeholder="Paste the client secret"
                value={clientSecret}
                onChange={(event) => {
                  setClientSecret(event.target.value);
                  setProbe(null);
                }}
                disabled={saving}
                fullWidth
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oauth-signing-key">Signing key (optional)</Label>
              <Textarea
                id="oauth-signing-key"
                rows={3}
                autoComplete="off"
                spellCheck={false}
                placeholder="-----BEGIN PRIVATE KEY-----"
                className="font-mono text-xs"
                value={signingKey}
                onChange={(event) => setSigningKey(event.target.value)}
                disabled={saving}
                helperText="Only for key-signed providers. Line breaks are kept."
              />
            </div>

            {probe && (
              <div
                role="status"
                className="rounded-md border border-border px-3 py-2.5 text-xs text-muted-foreground"
              >
                {probe.kind === 'valid' ? (
                  <span className="flex items-start gap-2">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span>
                      The stored configuration is valid.
                      {probe.fingerprint && (
                        <>
                          {' '}
                          This secret would be stored as{' '}
                          <span className="font-mono text-foreground">
                            {probe.fingerprint}
                          </span>
                          {credentials.client_secret_fingerprint &&
                            (probe.fingerprint ===
                            credentials.client_secret_fingerprint
                              ? ' — the same secret that is stored now.'
                              : ' — a different secret from the one stored now.')}
                        </>
                      )}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-destructive">
                      The configuration has problems:
                    </span>
                    <ul className="mb-0 mt-1 list-disc pl-5">
                      {probe.problems.length > 0 ? (
                        probe.problems.map((problem) => (
                          <li key={problem}>{problem}</li>
                        ))
                      ) : (
                        <li>
                          The backend reported it as invalid without details.
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            )}

            {stored && (
              <p className="m-0 text-xs text-warning">
                Saving replaces the stored secret immediately: the previous one
                stops working for every project that signs in through{' '}
                {connectionName}.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={saving} disabled={testing}>
                <KeyRound aria-hidden="true" />
                {stored ? 'Rotate credentials' : 'Save credentials'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void testConnection()}
                loading={testing}
                disabled={saving}
              >
                Test connection
              </Button>
            </div>
            <p className="m-0 text-xs text-muted-foreground">
              Testing checks the stored configuration and shows the fingerprint
              a typed secret would get. It does not contact the provider or save
              anything.
            </p>
          </form>
        </Panel>
      )}
    </div>
  );
}

export default OAuthCredentialsTab;
