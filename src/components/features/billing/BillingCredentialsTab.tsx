/**
 * Stripe credentials of a billing group (root only).
 *
 * Secrets are write-only: the status shows presence flags and fingerprints,
 * never values, and the form clears its secret fields after every attempt.
 * Optional fields left empty keep their stored value.
 */

import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { Panel } from '@/components/common/Panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/formatters';
import type {
  BillingGroupDetails,
  CredentialValidationResponse,
  StripeCredentialsRequest,
} from '@/types/billing.types';
import { credentialStatus } from './billing-status';
import { useCredentialsMutations } from './useBilling';

export interface BillingCredentialsTabProps {
  details: BillingGroupDetails;
  onChanged: () => void;
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-[170px_minmax(0,1fr)] gap-3 py-2 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 min-w-0 text-foreground">{children}</dd>
    </div>
  );
}

function Presence({
  present,
  fingerprint,
}: {
  present: boolean;
  fingerprint?: string | null;
}): React.JSX.Element {
  if (!present) return <span className="text-muted-foreground">Not set</span>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge variant="success" size="sm">
        Stored
      </Badge>
      {fingerprint && (
        <span className="font-mono text-xs text-muted-foreground">
          {fingerprint}
        </span>
      )}
    </span>
  );
}

function SecretInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  helper,
  disabled,
  secret = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
  disabled: boolean;
  secret?: boolean;
}): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-foreground"
      >
        {label}
      </label>
      <Input
        id={id}
        type={secret ? 'password' : 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        className="h-8 font-mono text-[13px]"
      />
      {helper && <p className="m-0 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function BillingCredentialsTab({
  details,
  onChanged,
}: BillingCredentialsTabProps): React.JSX.Element {
  const { credentials, group } = details;
  const { showToast } = useToast();
  const { testCredentials, saveCredentials, pending } = useCredentialsMutations(
    group.group_hash
  );
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [portalConfiguration, setPortalConfiguration] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [testResult, setTestResult] =
    useState<CredentialValidationResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const status = credentialStatus(credentials.credential_status);
  const connected = credentials.credential_status !== 'absent';
  const busy = pending !== null;

  const payload = (): StripeCredentialsRequest | null => {
    const key = secretKey.trim();
    if (!key) {
      setFormError('Enter the Stripe secret key (sk_… or rk_…).');
      return null;
    }
    setFormError(null);
    return {
      secret_key: key,
      webhook_secret: webhookSecret.trim() || undefined,
      portal_configuration_id: portalConfiguration.trim() || undefined,
      stripe_account_label: accountLabel.trim() || undefined,
    };
  };

  const clearSecrets = (): void => {
    setSecretKey('');
    setWebhookSecret('');
    setPortalConfiguration('');
  };

  const test = async (): Promise<void> => {
    const body = payload();
    if (!body) return;
    setTestResult(null);
    try {
      setTestResult(await testCredentials(body));
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'Stripe could not verify these credentials.'
      );
    }
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const body = payload();
    if (!body) return;
    try {
      await saveCredentials(body, connected);
      showToast(
        connected ? 'Stripe credentials replaced' : 'Stripe credentials saved',
        'success'
      );
      clearSecrets();
      setAccountLabel('');
      setTestResult(null);
      onChanged();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : 'The credentials could not be saved.'
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Panel
        title="Current credentials"
        description="Fingerprints only; secret values are never returned"
        actions={
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        }
      >
        <dl className="m-0 divide-y divide-border">
          <Fact label="Secret key">
            <Presence
              present={credentials.has_secret_key}
              fingerprint={credentials.secret_key_fingerprint}
            />
          </Fact>
          <Fact label="Webhook signing secret">
            <Presence
              present={credentials.has_webhook_secret}
              fingerprint={credentials.webhook_secret_fingerprint}
            />
          </Fact>
          <Fact label="Account">
            {credentials.stripe_account_label ||
            credentials.stripe_account_fingerprint ? (
              <span>
                {credentials.stripe_account_label}
                {credentials.stripe_account_fingerprint && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {credentials.stripe_account_fingerprint}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Fact>
          <Fact label="Encryption key">
            {credentials.credential_key_id ? (
              <span className="font-mono text-xs">
                {credentials.credential_key_id}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Fact>
          <Fact label="Saved">
            {formatDateTime(credentials.credentials_set_at)}
          </Fact>
        </dl>
      </Panel>

      <Panel
        title={connected ? 'Replace credentials' : 'Connect Stripe'}
        description="Verified with Stripe before they are stored encrypted"
      >
        <form
          onSubmit={(event) => void save(event)}
          noValidate
          className="space-y-4"
        >
          <SecretInput
            id="stripe-secret-key"
            label="Secret key"
            value={secretKey}
            onChange={setSecretKey}
            placeholder="sk_live_… or rk_live_…"
            helper={
              connected
                ? 'Always required; it replaces the stored key.'
                : undefined
            }
            disabled={busy}
          />
          <SecretInput
            id="stripe-webhook-secret"
            label="Webhook signing secret (optional)"
            value={webhookSecret}
            onChange={setWebhookSecret}
            placeholder="whsec_…"
            helper={
              credentials.has_webhook_secret
                ? 'Leave empty to keep the stored secret.'
                : undefined
            }
            disabled={busy}
          />
          <SecretInput
            id="stripe-portal-config"
            label="Portal configuration ID (optional)"
            value={portalConfiguration}
            onChange={setPortalConfiguration}
            placeholder="bpc_…"
            helper="Leave empty to keep the stored configuration."
            disabled={busy}
            secret={false}
          />
          <SecretInput
            id="stripe-account-label"
            label="Account label (optional)"
            value={accountLabel}
            onChange={setAccountLabel}
            placeholder={
              credentials.stripe_account_label || 'e.g. Acme production'
            }
            disabled={busy}
            secret={false}
          />

          {testResult && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-[13px]"
            >
              {testResult.valid ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
              ) : (
                <ShieldAlert
                  className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
              )}
              <span>
                {testResult.valid
                  ? 'Stripe accepted these credentials'
                  : 'Stripe rejected these credentials'}
                {testResult.livemode !== null &&
                  testResult.livemode !== undefined && (
                    <> · {testResult.livemode ? 'live mode' : 'test mode'}</>
                  )}
                {testResult.portal_configuration_valid === false &&
                  ' · portal configuration invalid'}
                {testResult.account_fingerprint && (
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    {testResult.account_fingerprint}
                  </span>
                )}
              </span>
            </div>
          )}
          {formError && (
            <p
              role="alert"
              className="m-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void test()}
              loading={pending === 'test'}
              disabled={busy}
            >
              Test connection
            </Button>
            <Button type="submit" loading={pending === 'save'} disabled={busy}>
              {connected ? 'Replace credentials' : 'Save credentials'}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

export default BillingCredentialsTab;
