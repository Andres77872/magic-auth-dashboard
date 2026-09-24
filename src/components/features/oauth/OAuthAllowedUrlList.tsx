/**
 * Exact-match URL allow-list editor: one row per URL with add and remove.
 *
 * Never a free-text comma-separated field — api.auth stores one row per URL and
 * matches by exact string equality, so each value must be pasted byte-identically
 * into the provider's console. Every value is copyable for exactly that reason; a
 * mismatch there is the most common setup failure.
 *
 * `validateAllowedUrl` mirrors the server's `url_safety.py` rules so a bad value is
 * refused before the round trip. It is usability only — the server re-validates.
 */

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CopyableId } from '@/components/common/CopyableId';
import { useToast } from '@/hooks/useToast';
import type {
  OAuthAllowedUrl,
  OAuthBindingUrlCreateRequest,
  OAuthUrlKind,
} from '@/types/oauth.types';
import { URL_KIND_LABELS, validateAllowedUrl } from './oauth-status';

export interface OAuthAllowedUrlListProps {
  /** Unique per binding; used for element ids. */
  connectionKey: string;
  urls: OAuthAllowedUrl[];
  /** Resolves after the API stored the URL and the binding was refetched. */
  onAdd: (request: OAuthBindingUrlCreateRequest) => Promise<void>;
  onRemove: (urlId: string) => Promise<void>;
  /**
   * Allow plain http for localhost. Defaults to Vite's dev flag so production
   * builds refuse it, matching the server's `APP_ENV` behaviour.
   */
  allowHttpLocalhost?: boolean;
  disabled?: boolean;
}

const PLACEHOLDER: Record<OAuthUrlKind, string> = {
  redirect_uri: 'https://app.example.com/auth/callback',
  return_origin: 'https://app.example.com',
};

function isUrlKind(value: string): value is OAuthUrlKind {
  return value === 'redirect_uri' || value === 'return_origin';
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function OAuthAllowedUrlList({
  connectionKey,
  urls,
  onAdd,
  onRemove,
  allowHttpLocalhost = import.meta.env.DEV,
  disabled = false,
}: OAuthAllowedUrlListProps): React.JSX.Element {
  const { showToast } = useToast();
  const [kind, setKind] = React.useState<OAuthUrlKind>('redirect_uri');
  const [value, setValue] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pendingRemove, setPendingRemove] =
    React.useState<OAuthAllowedUrl | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const inputId = `oauth-url-${connectionKey}`;
  const hasRedirect = urls.some((entry) => entry.kind === 'redirect_uri');
  const hasOrigin = urls.some((entry) => entry.kind === 'return_origin');

  const handleAdd = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault();
    const problem = validateAllowedUrl(kind, value, { allowHttpLocalhost });
    if (problem) {
      setFieldError(problem);
      return;
    }
    setFieldError(null);
    setAdding(true);
    try {
      await onAdd({ kind, url: value.trim() });
      showToast(`${URL_KIND_LABELS[kind]} added`, 'success');
      setValue('');
    } catch (err) {
      showToast(errorMessage(err, 'The URL could not be added.'), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await onRemove(pendingRemove.id);
      showToast(
        `${URL_KIND_LABELS[pendingRemove.kind] ?? 'URL'} removed`,
        'success'
      );
      setPendingRemove(null);
    } catch (err) {
      showToast(errorMessage(err, 'The URL could not be removed.'), 'error');
    } finally {
      setRemoving(false);
    }
  };

  const missing = [
    !hasRedirect && 'a redirect URI',
    !hasOrigin && 'a return origin',
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {urls.length > 0 && (
        <ul
          className="m-0 list-none divide-y divide-border rounded-md border border-border p-0"
          aria-label="Allowed URLs"
        >
          {urls.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-3 py-2">
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {URL_KIND_LABELS[entry.kind] ?? entry.kind}
              </span>
              <div className="min-w-0 flex-1">
                <CopyableId
                  id={entry.url}
                  label={URL_KIND_LABELS[entry.kind] ?? entry.kind}
                  showFull
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={disabled}
                onClick={() => setPendingRemove(entry)}
                aria-label={`Remove ${entry.url}`}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <p className="m-0 text-xs text-warning">
          Sign-in can&apos;t complete until this binding has{' '}
          {missing.join(' and ')}.
        </p>
      )}

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => void handleAdd(event)}
        noValidate
      >
        <div className="space-y-1.5">
          <Label htmlFor={`${inputId}-kind`}>Kind</Label>
          <Select
            value={kind}
            onValueChange={(next) => {
              if (isUrlKind(next)) setKind(next);
              if (fieldError) setFieldError(null);
            }}
            disabled={disabled || adding}
          >
            <SelectTrigger id={`${inputId}-kind`} className="h-[34px] w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="redirect_uri">Redirect URI</SelectItem>
              <SelectItem value="return_origin">Return origin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor={inputId}>{URL_KIND_LABELS[kind]}</Label>
          <Input
            id={inputId}
            value={value}
            placeholder={PLACEHOLDER[kind]}
            error={fieldError || undefined}
            onChange={(event) => {
              setValue(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            disabled={disabled || adding}
            spellCheck={false}
            autoComplete="off"
            fullWidth
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          loading={adding}
          disabled={disabled}
        >
          <Plus aria-hidden="true" />
          Add URL
        </Button>
      </form>

      <p className="m-0 text-xs text-muted-foreground">
        Matching is exact: copy each value into the provider console as is. No
        wildcards or fragments; origins are scheme, host and optional port only.
      </p>

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => void handleRemove()}
        title={
          pendingRemove?.kind === 'return_origin'
            ? 'Remove this return origin?'
            : 'Remove this redirect URI?'
        }
        message={
          <>
            Sign-in requests that use{' '}
            <span className="break-all font-mono text-foreground">
              {pendingRemove?.url}
            </span>{' '}
            are refused immediately.
          </>
        }
        confirmText="Remove URL"
        variant="warning"
        isLoading={removing}
      />
    </div>
  );
}

export default OAuthAllowedUrlList;
