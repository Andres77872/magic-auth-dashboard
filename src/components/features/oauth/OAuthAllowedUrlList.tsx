/**
 * Exact-match URL allow-list editor: one row per URL with add and remove.
 *
 * Never a free-text comma-separated field — api.auth stores one row per URL and
 * matches by exact string equality, so each value must be pasted byte-identically
 * into the provider's console. Every value is rendered through `CopyableId` for
 * exactly that reason; a mismatch there is the most common setup failure.
 *
 * `validateAllowedUrl` (in `oauth-status.ts`) mirrors the server's `url_safety.py`
 * rules so a bad value is refused before the round trip. It is usability only — the
 * server re-validates.
 */

import React from 'react';
import { Link2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CopyableId, ConfirmDialog, EmptyState } from '@/components/common';
import { useToast } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import type { OAuthAllowedUrl, OAuthUrlKind } from '@/types/oauth.types';
import { URL_KIND_LABELS, validateAllowedUrl } from './oauth-status';

export interface OAuthAllowedUrlListProps {
  projectHash: string;
  connectionKey: string;
  urls: OAuthAllowedUrl[];
  onChanged: () => void;
  /**
   * Allow plain http for localhost. Defaults to Vite's dev flag so production
   * builds refuse it, matching the server's `APP_ENV` behaviour.
   */
  allowHttpLocalhost?: boolean;
  disabled?: boolean;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OAuthAllowedUrlList({
  projectHash,
  connectionKey,
  urls,
  onChanged,
  allowHttpLocalhost = import.meta.env.DEV,
  disabled = false,
}: OAuthAllowedUrlListProps): React.JSX.Element {
  const { showToast } = useToast();
  const [kind, setKind] = React.useState<OAuthUrlKind>('redirect_uri');
  const [value, setValue] = React.useState('');
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [pendingRemove, setPendingRemove] = React.useState<OAuthAllowedUrl | null>(null);
  const [removing, setRemoving] = React.useState(false);

  const inputId = `oauth-url-${connectionKey}`;

  const handleAdd = async (): Promise<void> => {
    const problem = validateAllowedUrl(kind, value, { allowHttpLocalhost });
    if (problem) {
      setFieldError(problem);
      return;
    }
    setFieldError(null);
    setAdding(true);
    try {
      await oauthService.addBindingUrl(projectHash, connectionKey, {
        kind,
        url: value.trim(),
      });
      showToast(`${URL_KIND_LABELS[kind]} added`, 'success');
      setValue('');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to add URL'), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await oauthService.removeBindingUrl(projectHash, connectionKey, pendingRemove.id);
      showToast('URL removed', 'success');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to remove URL'), 'error');
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
  };

  return (
    <div className="space-y-3">
      {urls.length === 0 ? (
        <EmptyState
          icon={<Link2 />}
          title="No allow-listed URLs"
          description="Sign-in cannot complete until this binding has both a redirect URI and a return origin."
          size="sm"
        />
      ) : (
        <ul className="divide-y rounded-md border border-border" aria-label="Allow-listed URLs">
          {urls.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 p-3">
              <Badge variant="secondary">{URL_KIND_LABELS[entry.kind] ?? entry.kind}</Badge>
              <div className="min-w-0 flex-1">
                <CopyableId id={entry.url} label={URL_KIND_LABELS[entry.kind] ?? entry.kind} showFull />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setPendingRemove(entry)}
                aria-label={`Remove ${entry.url}`}
              >
                <Trash2 size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`${inputId}-kind`}>Kind</Label>
          <Select value={kind} onValueChange={(next) => setKind(next as OAuthUrlKind)}>
            <SelectTrigger id={`${inputId}-kind`} className="w-44" aria-label="URL kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="redirect_uri">Redirect URI</SelectItem>
              <SelectItem value="return_origin">Return origin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label htmlFor={inputId}>
            {kind === 'redirect_uri' ? 'Redirect URI' : 'Return origin'}
          </Label>
          <Input
            id={inputId}
            value={value}
            placeholder={
              kind === 'redirect_uri'
                ? 'https://app.example.com/auth/callback'
                : 'https://app.example.com'
            }
            error={fieldError || undefined}
            onChange={(event) => {
              setValue(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            fullWidth
          />
        </div>
        <Button onClick={() => void handleAdd()} loading={adding} disabled={disabled}>
          <Plus size={16} className="mr-1" /> Add URL
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Matching is exact. Paste each value into the provider console byte for byte — no
        wildcards, no fragments, and origins are scheme, host and optional port only.
      </p>

      <ConfirmDialog
        isOpen={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => void handleRemove()}
        title="Remove allow-listed URL"
        message="Remove this URL? Sign-in requests that use it will be refused immediately."
        confirmText="Remove"
        variant="warning"
        isLoading={removing}
      />
    </div>
  );
}

export default OAuthAllowedUrlList;
