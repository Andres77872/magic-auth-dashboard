/**
 * Edit an API key's name, description or expiry (`PUT /api-keys/{key_id}`).
 * The backend treats empty values as "unchanged", so fields can be changed but
 * not cleared, and revoked keys can't be edited at all.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApiKeyMutations } from '@/hooks/useApiKeys';
import {
  computeApiKeyStatus,
  type ApiKey,
  type UpdateApiKeyRequest,
} from '@/types/api-key.types';
import { apiKeyHint, expiryDateToIso, isoToUtcDate } from './api-key-format';
import { describeApiKeyError } from './api-key-errors';
import { ExpiryDateInput, Field, FormError } from './ApiKeyFormFields';

export interface ApiKeyEditModalProps {
  apiKey: ApiKey | null;
  onClose: () => void;
  onSaved: (updated: ApiKey) => void;
}

export function ApiKeyEditModal({
  apiKey,
  onClose,
  onSaved,
}: ApiKeyEditModalProps): React.JSX.Element {
  const { updateKey, pending } = useApiKeyMutations();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = pending === 'update';

  // Load the key's values whenever a different key is opened.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  if ((apiKey?.public_id ?? null) !== loadedFor) {
    setLoadedFor(apiKey?.public_id ?? null);
    setName(apiKey?.name ?? '');
    setDescription(apiKey?.description ?? '');
    setExpiryDate(isoToUtcDate(apiKey?.expires_at));
    setError(null);
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!apiKey) return;
    const request: UpdateApiKeyRequest = {};
    if (name.trim() && name.trim() !== apiKey.name) request.name = name.trim();
    if (
      description.trim() &&
      description.trim() !== (apiKey.description ?? '')
    ) {
      request.description = description.trim();
    }
    if (expiryDate && expiryDate !== isoToUtcDate(apiKey.expires_at)) {
      request.expires_at = expiryDateToIso(expiryDate);
    }
    if (Object.keys(request).length === 0) {
      setError('Change the name, description or expiry date to save.');
      return;
    }
    setError(null);
    try {
      const updated = await updateKey(apiKey.public_id, request);
      onSaved(updated);
    } catch (err) {
      setError(describeApiKeyError(err, 'The API key could not be updated.'));
    }
  };

  const expired = apiKey ? computeApiKeyStatus(apiKey) === 'expired' : false;

  return (
    <Dialog
      open={apiKey !== null}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit API key</DialogTitle>
          <DialogDescription>
            {apiKey ? (
              <>
                <span className="font-mono text-xs">{apiKeyHint(apiKey)}</span>{' '}
                · The secret itself can&apos;t be changed.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
          noValidate
        >
          <Field id="edit-api-key-name" label="Name">
            <Input
              id="edit-api-key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              disabled={isSubmitting}
              className="h-8 text-[13px]"
            />
          </Field>
          <Field
            id="edit-api-key-description"
            label="Description"
            helper="Descriptions can be replaced but not cleared."
          >
            <Textarea
              id="edit-api-key-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={2}
              disabled={isSubmitting}
              className="text-[13px]"
            />
          </Field>
          <Field
            id="edit-api-key-expiry"
            label="Expiry date"
            helper={
              expired
                ? 'This key has expired. A future date reactivates it.'
                : 'The key stops working at 00:00 UTC on this date.'
            }
          >
            <ExpiryDateInput
              id="edit-api-key-expiry"
              value={expiryDate}
              onChange={setExpiryDate}
              disabled={isSubmitting}
            />
          </Field>

          <FormError message={error} />

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyEditModal;
