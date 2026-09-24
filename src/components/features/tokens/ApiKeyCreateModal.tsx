/**
 * Create a project-scoped API key for a user (`POST /api-keys`).
 * On success the parent opens the one-time reveal dialog.
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
import type { CreatedApiKey } from '@/types/api-key.types';
import { expiryDateToIso } from './api-key-format';
import { describeApiKeyError } from './api-key-errors';
import {
  ExpiryDateInput,
  Field,
  FormError,
  OwnerPicker,
  ProjectPicker,
} from './ApiKeyFormFields';

export interface ApiKeyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (created: CreatedApiKey) => void;
  /** Prefill from the page filters. */
  initialOwner?: ComboboxOption | null;
  initialProjectHash?: string;
}

export function ApiKeyCreateModal({
  isOpen,
  onClose,
  onCreated,
  initialOwner = null,
  initialProjectHash = '',
}: ApiKeyCreateModalProps): React.JSX.Element {
  const { createKey, pending } = useApiKeyMutations();
  const [owner, setOwner] = useState<ComboboxOption | null>(initialOwner);
  const [projectHash, setProjectHash] = useState(initialProjectHash);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isSubmitting = pending === 'create';

  // Reset the form each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setOwner(initialOwner);
      setProjectHash(initialProjectHash);
      setName('');
      setDescription('');
      setExpiryDate('');
      setError(null);
    }
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!owner) {
      setError('Choose the user who will own the key.');
      return;
    }
    if (!projectHash) {
      setError('Choose the project the key is scoped to.');
      return;
    }
    setError(null);
    try {
      const created = await createKey({
        user_hash: owner.value,
        project_hash: projectHash,
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        expires_at: expiryDate ? expiryDateToIso(expiryDate) : undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(describeApiKeyError(err, 'The API key could not be created.'));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>
            The key acts as its owner within one project. The full key is shown
            once, right after it is created.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
          noValidate
        >
          <Field id="api-key-owner" label="Owner">
            <OwnerPicker
              id="api-key-owner"
              value={owner}
              onChange={setOwner}
              disabled={isSubmitting}
            />
          </Field>
          <Field id="api-key-project" label="Project">
            <ProjectPicker
              id="api-key-project"
              value={projectHash}
              onChange={(option) => setProjectHash(option?.value ?? '')}
              disabled={isSubmitting}
            />
          </Field>
          <Field
            id="api-key-name"
            label="Name"
            optional
            helper="Defaults to “API Key - owner name”."
          >
            <Input
              id="api-key-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Billing worker"
              maxLength={100}
              disabled={isSubmitting}
              className="h-8 text-[13px]"
            />
          </Field>
          <Field id="api-key-description" label="Description" optional>
            <Textarea
              id="api-key-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What uses this key?"
              maxLength={500}
              rows={2}
              disabled={isSubmitting}
              className="text-[13px]"
            />
          </Field>
          <Field
            id="api-key-expiry"
            label="Expiry date"
            optional
            helper="The key stops working at 00:00 UTC on this date. Leave empty for a key that never expires."
          >
            <ExpiryDateInput
              id="api-key-expiry"
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
              Create key
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyCreateModal;
