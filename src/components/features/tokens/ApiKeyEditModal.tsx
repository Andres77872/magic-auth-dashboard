/**
 * API Key Edit Modal
 *
 * Modal for editing API key metadata (name, description, expiration).
 * PUT /api-keys/{key_id} (admin endpoint)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Key, Loader2 } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useApiKeys } from '@/hooks';
import { useToast } from '@/hooks/useToast';
import type { ApiKey, UpdateApiKeyRequest } from '@/types/api-key.types';

interface ApiKeyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyData: ApiKey | null;
  onSuccess?: () => void;
}

export function ApiKeyEditModal({
  isOpen,
  onClose,
  keyData,
  onSuccess,
}: ApiKeyEditModalProps): React.JSX.Element {
  const { updateKey } = useApiKeys({ autoFetch: false });
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && keyData) {
      setName(keyData.name || '');
      setDescription(keyData.description || '');
      setExpiresAt(keyData.expires_at ? keyData.expires_at.split('T')[0] : '');
      setError(null);
    }
  }, [isOpen, keyData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!keyData) return;

    const request: UpdateApiKeyRequest = {};

    if (name.trim()) request.name = name.trim();
    if (description.trim()) request.description = description.trim();
    if (expiresAt) request.expires_at = expiresAt;

    void (async (): Promise<void> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const success = await updateKey(keyData.public_id, request);

        if (success) {
          showToast(`Key "${keyData.fingerprint}" has been updated successfully.`, 'success');
          onSuccess?.();
          onClose();
        } else {
          setError('Failed to update API key');
        }
      } catch {
        setError('Unable to update API key');
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [keyData, name, description, expiresAt, updateKey, showToast, onSuccess, onClose]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setError(null);
      onClose();
    }
  }, [onClose]);

  if (!keyData) return <></>;

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Edit API Key
          </DialogTitle>
          <DialogDescription>
            Update the metadata for this API key.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 py-2 mb-4">
          <Badge variant="subtlePrimary" size="md">
            Fingerprint: {keyData.fingerprint}
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            Key ending in ...{keyData.secret_last4}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Deploy Key"
              disabled={isSubmitting}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this key
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., CI/CD pipeline authentication"
              disabled={isSubmitting}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expires_at">Expiration</Label>
            <Input
              id="edit-expires_at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isSubmitting}
              min={minDate}
            />
            <p className="text-xs text-muted-foreground">
              Extend expiration to reactivate an expired key
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyEditModal;