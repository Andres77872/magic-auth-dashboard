/**
 * Create a delegation key: an ordinary API key scoped to the TARGET service
 * project. The caller (source) project is not sent to api.auth; it is only
 * used to render the trusted-client snippet in the reveal dialog.
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
import type { ComboboxOption } from '@/components/features/shared-pickers';
import type {
  CreatedApiKey,
  DelegatedAuthRevealConfig,
} from '@/types/api-key.types';
import { expiryDateToIso } from './api-key-format';
import { describeApiKeyError } from './api-key-errors';
import {
  ExpiryDateInput,
  Field,
  FormError,
  OwnerPicker,
  ProjectPicker,
} from './ApiKeyFormFields';

export const DEFAULT_DELEGATION_KEY_NAME = 'Magic LLM delegation key';

export interface DelegatedAuthTokenCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (
    created: CreatedApiKey,
    config: DelegatedAuthRevealConfig
  ) => void;
}

export function DelegatedAuthTokenCreateModal({
  isOpen,
  onClose,
  onCreated,
}: DelegatedAuthTokenCreateModalProps): React.JSX.Element {
  const { createKey, pending } = useApiKeyMutations();
  const [owner, setOwner] = useState<ComboboxOption | null>(null);
  const [target, setTarget] = useState<ComboboxOption | null>(null);
  const [source, setSource] = useState<ComboboxOption | null>(null);
  const [name, setName] = useState(DEFAULT_DELEGATION_KEY_NAME);
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = pending === 'create';

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setOwner(null);
      setTarget(null);
      setSource(null);
      setName(DEFAULT_DELEGATION_KEY_NAME);
      setDescription('');
      setExpiryDate('');
      setError(null);
    }
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!owner) {
      setError('Choose the service user who will own the key.');
      return;
    }
    if (!target) {
      setError('Choose the target service project.');
      return;
    }
    if (!source) {
      setError('Choose the caller project.');
      return;
    }
    setError(null);
    try {
      const created = await createKey({
        user_hash: owner.value,
        project_hash: target.value,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        expires_at: expiryDate ? expiryDateToIso(expiryDate) : undefined,
      });
      onCreated(created, {
        ownerUserHash: owner.value,
        targetProjectHash: target.value,
        targetProjectName: target.label,
        sourceProjectHash: source.value,
        sourceProjectName: source.label,
      });
    } catch (err) {
      setError(
        describeApiKeyError(err, 'The delegation key could not be created.')
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Create delegation key</DialogTitle>
          <DialogDescription>
            A key for backend-to-backend delegated auth. It is scoped to the
            target service project; the caller project only appears in the
            trusted-client setting shown afterwards.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
          noValidate
          data-testid="delegated-auth-token-form"
        >
          <Field id="delegated-owner" label="Owner">
            <OwnerPicker
              id="delegated-owner"
              value={owner}
              onChange={setOwner}
              disabled={isSubmitting}
            />
          </Field>
          <Field
            id="delegated-target-project"
            label="Target service project"
            helper="The service that accepts the key, e.g. Magic LLM."
          >
            <ProjectPicker
              id="delegated-target-project"
              value={target?.value ?? ''}
              onChange={setTarget}
              disabled={isSubmitting}
            />
          </Field>
          <Field
            id="delegated-source-project"
            label="Caller project"
            helper="The project whose backend sends the key."
          >
            <ProjectPicker
              id="delegated-source-project"
              value={source?.value ?? ''}
              onChange={setSource}
              disabled={isSubmitting}
            />
          </Field>
          <Field id="delegated-name" label="Name">
            <Input
              id="delegated-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              disabled={isSubmitting}
              className="h-8 text-[13px]"
            />
          </Field>
          <Field id="delegated-description" label="Description" optional>
            <Textarea
              id="delegated-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={2}
              disabled={isSubmitting}
              className="text-[13px]"
            />
          </Field>
          <Field
            id="delegated-expiry"
            label="Expiry date"
            optional
            helper="The key stops working at 00:00 UTC on this date."
          >
            <ExpiryDateInput
              id="delegated-expiry"
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
              Create delegation key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DelegatedAuthTokenCreateModal;
