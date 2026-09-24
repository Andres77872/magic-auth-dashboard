/**
 * One-time reveal of a newly created API key.
 *
 * The secret only lives in the parent's state while this dialog is open; it
 * is never logged, persisted or rendered anywhere else. The dialog can't be
 * dismissed until the operator copied the key or confirmed they saved it.
 */

import React, { useRef, useState } from 'react';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type {
  CreatedApiKey,
  DelegatedAuthRevealConfig,
} from '@/types/api-key.types';

export interface ApiKeyRevealModalProps {
  created: CreatedApiKey | null;
  delegatedAuthConfig?: DelegatedAuthRevealConfig | null;
  onClose: () => void;
}

function SecretField({
  id,
  label,
  value,
  multiline = false,
  copied,
  onCopy,
}: {
  id: string;
  label: string;
  value: string;
  multiline?: boolean;
  copied: boolean;
  onCopy: () => void;
}): React.JSX.Element {
  const fieldClass =
    'w-full resize-none rounded-md border border-input bg-muted/60 py-2 pl-3 pr-11 font-mono text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-foreground"
      >
        {label}
      </label>
      <div className="relative">
        {multiline ? (
          <textarea
            id={id}
            value={value}
            readOnly
            rows={2}
            spellCheck={false}
            className={fieldClass}
            onFocus={(event) => event.currentTarget.select()}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            readOnly
            spellCheck={false}
            autoComplete="off"
            className={fieldClass}
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7"
          onClick={onCopy}
          aria-label={
            copied ? `${label} copied` : `Copy ${label.toLowerCase()}`
          }
        >
          {copied ? (
            <Check className="text-success" aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}

export function ApiKeyRevealModal({
  created,
  delegatedAuthConfig,
  onClose,
}: ApiKeyRevealModalProps): React.JSX.Element {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [blockedClose, setBlockedClose] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const resetTimer = useRef<number | undefined>(undefined);

  // Reset per revealed key.
  const [shownFor, setShownFor] = useState<string | null>(null);
  if ((created?.public_id ?? null) !== shownFor) {
    setShownFor(created?.public_id ?? null);
    setCopiedField(null);
    setSecretCopied(false);
    setConfirmed(false);
    setBlockedClose(false);
    setCopyFailed(false);
  }

  const canClose = secretCopied || confirmed;

  const copy = async (
    field: string,
    value: string,
    containsSecret: boolean
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFailed(false);
      setCopiedField(field);
      if (containsSecret) setSecretCopied(true);
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopyFailed(true);
    }
  };

  const requestClose = (): void => {
    if (!canClose) {
      setBlockedClose(true);
      return;
    }
    window.clearTimeout(resetTimer.current);
    onClose();
  };

  const token = created?.api_key ?? '';
  const callerEnv = delegatedAuthConfig
    ? `MAGIC_LLM_DELEGATION_API_KEY=${token}`
    : '';
  const targetEnv =
    delegatedAuthConfig && created
      ? `DELEGATED_AUTH_TRUSTED_CLIENTS=${delegatedAuthConfig.sourceProjectHash}:${created.public_id}`
      : '';

  return (
    <Dialog
      open={created !== null}
      onOpenChange={(open) => !open && requestClose()}
    >
      <DialogContent
        size="lg"
        onEscapeKeyDown={(event) => {
          if (!canClose) {
            event.preventDefault();
            setBlockedClose(true);
          }
        }}
        onPointerDownOutside={(event) => {
          if (!canClose) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {delegatedAuthConfig ? 'Delegation key created' : 'API key created'}
          </DialogTitle>
          <DialogDescription>
            {created ? (
              <>
                <span className="font-medium text-foreground">
                  {created.name}
                </span>{' '}
                · fingerprint{' '}
                <span className="font-mono">{created.fingerprint}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-[13px] text-foreground">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p className="m-0">
            Copy the key now. It won&apos;t be shown again; if it&apos;s lost,
            revoke it and create a new one.
          </p>
        </div>

        {created && (
          <div className="space-y-4">
            <SecretField
              id="api-key-token"
              label="API key"
              value={token}
              copied={copiedField === 'token'}
              onCopy={() => void copy('token', token, true)}
            />

            {delegatedAuthConfig && (
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">
                  <p className="m-0">
                    Target project:{' '}
                    {delegatedAuthConfig.targetProjectName ||
                      delegatedAuthConfig.targetProjectHash}
                  </p>
                  <p className="m-0">
                    Source project:{' '}
                    {delegatedAuthConfig.sourceProjectName ||
                      delegatedAuthConfig.sourceProjectHash}
                  </p>
                </div>
                <SecretField
                  id="delegated-caller-env"
                  label="Caller service environment"
                  value={callerEnv}
                  multiline
                  copied={copiedField === 'caller-env'}
                  onCopy={() => void copy('caller-env', callerEnv, true)}
                />
                <SecretField
                  id="delegated-target-env"
                  label="Target service environment"
                  value={targetEnv}
                  multiline
                  copied={copiedField === 'target-env'}
                  onCopy={() => void copy('target-env', targetEnv, false)}
                />
              </div>
            )}

            {copyFailed && (
              <p role="alert" className="m-0 text-xs text-destructive">
                The clipboard isn&apos;t available here. Select the key and copy
                it manually.
              </p>
            )}

            <Checkbox
              id="api-key-saved"
              checked={confirmed}
              onCheckedChange={(checked) => {
                setConfirmed(checked === true);
                if (checked === true) setBlockedClose(false);
              }}
              label="I have stored this key somewhere safe"
            />

            {blockedClose && !canClose && (
              <p role="alert" className="m-0 text-xs text-warning">
                Copy the key or confirm you&apos;ve stored it before closing.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={requestClose} disabled={!canClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyRevealModal;
