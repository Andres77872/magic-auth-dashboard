/**
 * API Key Create Modal
 *
 * Modal for admins to create API keys FOR a consumer user.
 * Requires selecting both a target consumer (user_hash) and a project.
 * Uses FormData per backend spec.
 */

import React, { useState, useCallback } from 'react';
import { Key, AlertTriangle, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiKeys } from '@/hooks';
import type { Project } from '@/types/auth.types';
import type { CreateApiKeyResponse } from '@/types/api-key.types';

interface ApiKeyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (response: CreateApiKeyResponse) => void;
  accessibleProjects: Project[];
  /** Pre-filled user hash from parent (user-centric flow) */
  prefilledUserHash?: string;
}

export function ApiKeyCreateModal({
  isOpen,
  onClose,
  onSuccess,
  accessibleProjects,
  prefilledUserHash,
}: ApiKeyCreateModalProps): React.JSX.Element {
  const { createKey } = useApiKeys({ autoFetch: false });

  // Form state
  const [userHash, setUserHash] = useState(prefilledUserHash || '');
  const [selectedProjectHash, setSelectedProjectHash] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setUserHash(prefilledUserHash || '');
      setSelectedProjectHash(accessibleProjects[0]?.project_hash || '');
      setName('');
      setDescription('');
      setExpiresAt('');
      setError(null);
      onClose();
    }
  }, [accessibleProjects, prefilledUserHash, onClose]);

  // Submit handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    void (async (): Promise<void> => {
      if (!userHash.trim()) {
        setError('Consumer user hash is required');
        return;
      }

      if (!selectedProjectHash) {
        setError('Project is required');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await createKey({
          user_hash: userHash.trim(),
          project_hash: selectedProjectHash,
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          expires_at: expiresAt || undefined,
        });

        if (response.success) {
          onSuccess(response);
        } else {
          setError(response.message || 'Failed to create API key');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unable to create API key';
        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [userHash, selectedProjectHash, name, description, expiresAt, createKey, onSuccess]);

  // Pre-select first project if available
  React.useEffect(() => {
    if (isOpen && accessibleProjects.length > 0 && !selectedProjectHash) {
      setSelectedProjectHash(accessibleProjects[0].project_hash);
    }
    if (isOpen && prefilledUserHash) {
      setUserHash(prefilledUserHash);
    }
  }, [isOpen, accessibleProjects, selectedProjectHash, prefilledUserHash]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create Consumer API Token
          </DialogTitle>
          <DialogDescription>
            Create a project-scoped API token for a consumer user.
            The token grants programmatic access on their behalf.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin context warning */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm text-muted-foreground">
                You are creating this token on behalf of a consumer user.
                The token's permissions are scoped to the selected project.
              </p>
            </div>
          </div>

          {/* Consumer user hash (required) */}
          <div className="space-y-2">
            <Label htmlFor="user_hash">Consumer User Hash *</Label>
            <Input
              id="user_hash"
              value={userHash}
              onChange={(e) => setUserHash(e.target.value)}
              placeholder="e.g., usr_abc123def456"
              disabled={isSubmitting || Boolean(prefilledUserHash)}
              readOnly={Boolean(prefilledUserHash)}
              required
            />
            <p className="text-xs text-muted-foreground">
              {prefilledUserHash
                ? 'Pre-filled from selected user'
                : 'The hash of the consumer user this token will belong to'}
            </p>
          </div>

          {/* Project selector */}
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            {accessibleProjects.length === 0 ? (
              <div className="text-sm text-muted-foreground p-2 border rounded-md bg-muted/50">
                No projects available. You need at least one project to create a token.
              </div>
            ) : (
              <Select
                value={selectedProjectHash}
                onValueChange={setSelectedProjectHash}
                disabled={isSubmitting}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {accessibleProjects.map((project) => (
                    <SelectItem key={project.project_hash} value={project.project_hash}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Name (optional) */}
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production Deploy Key"
              disabled={isSubmitting}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              A friendly name to identify this token
            </p>
          </div>

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., CI/CD pipeline authentication"
              disabled={isSubmitting}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={500}
            />
          </div>

          {/* Expiration (optional) */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expiration (optional)</Label>
            <Input
              id="expires_at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isSubmitting}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiration
            </p>
          </div>

          {/* Error display */}
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
              disabled={isSubmitting || accessibleProjects.length === 0}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Token
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeyCreateModal;
