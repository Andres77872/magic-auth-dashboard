/**
 * Delegated Auth Token Create Modal
 *
 * Creates a normal api.auth API key for a target service project and keeps the
 * caller/source project only as reveal-time metadata for env snippet generation.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, KeyRound, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useApiKeys } from '@/hooks';
import type { User } from '@/types/auth.types';
import type { ProjectDetails } from '@/types/project.types';
import type {
  CreateApiKeyResponse,
  DelegatedAuthRevealConfig,
} from '@/types/api-key.types';

interface DelegatedAuthTokenCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    response: CreateApiKeyResponse,
    config: DelegatedAuthRevealConfig
  ) => void;
  availableProjects: ProjectDetails[];
  availableUsers: User[];
}

const DEFAULT_TOKEN_NAME = 'Magic LLM delegation token';

function findProjectName(projects: ProjectDetails[], projectHash: string): string | undefined {
  return projects.find((project) => project.project_hash === projectHash)?.project_name;
}

export function DelegatedAuthTokenCreateModal({
  isOpen,
  onClose,
  onSuccess,
  availableProjects,
  availableUsers,
}: DelegatedAuthTokenCreateModalProps): React.JSX.Element {
  const { createKey } = useApiKeys({ autoFetch: false });

  const [ownerUserHash, setOwnerUserHash] = useState('');
  const [targetProjectHash, setTargetProjectHash] = useState('');
  const [sourceProjectHash, setSourceProjectHash] = useState('');
  const [name, setName] = useState(DEFAULT_TOKEN_NAME);
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetProjectName = useMemo(
    () => findProjectName(availableProjects, targetProjectHash),
    [availableProjects, targetProjectHash]
  );
  const sourceProjectName = useMemo(
    () => findProjectName(availableProjects, sourceProjectHash),
    [availableProjects, sourceProjectHash]
  );

  const resetForm = useCallback(() => {
    setOwnerUserHash('');
    setTargetProjectHash('');
    setSourceProjectHash('');
    setName(DEFAULT_TOKEN_NAME);
    setDescription('');
    setExpiresAt('');
    setError(null);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetForm();
        onClose();
      }
    },
    [onClose, resetForm]
  );

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      void (async (): Promise<void> => {
        const trimmedOwner = ownerUserHash.trim();
        const trimmedTargetProject = targetProjectHash.trim();
        const trimmedSourceProject = sourceProjectHash.trim();

        if (!trimmedOwner) {
          setError('Owner user hash is required');
          return;
        }

        if (!trimmedTargetProject) {
          setError('Target service project hash is required');
          return;
        }

        if (!trimmedSourceProject) {
          setError('Source caller project hash is required');
          return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
          const response = await createKey({
            user_hash: trimmedOwner,
            project_hash: trimmedTargetProject,
            name: name.trim() || undefined,
            description: description.trim() || undefined,
            expires_at: expiresAt || undefined,
          });

          if (!response.success) {
            setError(response.message || 'Failed to create delegation token');
            return;
          }

          onSuccess(response, {
            ownerUserHash: trimmedOwner,
            targetProjectHash: trimmedTargetProject,
            targetProjectName,
            sourceProjectHash: trimmedSourceProject,
            sourceProjectName,
          });
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unable to create delegation token');
        } finally {
          setIsSubmitting(false);
        }
      })();
    },
    [
      createKey,
      description,
      expiresAt,
      name,
      onSuccess,
      ownerUserHash,
      sourceProjectHash,
      sourceProjectName,
      targetProjectHash,
      targetProjectName,
    ]
  );

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Create Delegation Token
          </DialogTitle>
          <DialogDescription>
            Create a target-project API key for backend-to-backend delegated auth.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          data-testid="delegated-auth-token-form"
        >
          <div className="rounded-sm border border-warning/30 bg-warning/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
              <p className="text-sm text-muted-foreground">
                The caller project is used only for the Magic LLM trusted-client config.
                The API key itself is scoped to the target service project.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegated-owner-user">Owner User Hash *</Label>
            <Input
              id="delegated-owner-user"
              list="delegated-owner-user-options"
              value={ownerUserHash}
              onChange={(event) => setOwnerUserHash(event.target.value)}
              placeholder="usr_..."
              disabled={isSubmitting}
              required
            />
            <datalist id="delegated-owner-user-options">
              {availableUsers.map((user) => (
                <option key={user.user_hash} value={user.user_hash}>
                  {user.username}
                </option>
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegated-target-project">Target Service Project *</Label>
            <Input
              id="delegated-target-project"
              list="delegated-project-options"
              value={targetProjectHash}
              onChange={(event) => setTargetProjectHash(event.target.value)}
              placeholder="api.magic_llm project hash"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegated-source-project">Source Caller Project *</Label>
            <Input
              id="delegated-source-project"
              list="delegated-project-options"
              value={sourceProjectHash}
              onChange={(event) => setSourceProjectHash(event.target.value)}
              placeholder="caller project hash"
              disabled={isSubmitting}
              required
            />
            <datalist id="delegated-project-options">
              {availableProjects.map((project) => (
                <option key={project.project_hash} value={project.project_hash}>
                  {project.project_name}
                </option>
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="delegated-token-name">Name</Label>
            <Input
              id="delegated-token-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={DEFAULT_TOKEN_NAME}
              disabled={isSubmitting}
              maxLength={100}
            />
          </div>

          <Textarea
            id="delegated-token-description"
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="e.g., Used by backend services for delegated Magic LLM calls"
            disabled={isSubmitting}
            maxLength={500}
          />

          <div className="space-y-2">
            <Label htmlFor="delegated-token-expires-at">Expiration</Label>
            <Input
              id="delegated-token-expires-at"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={isSubmitting}
              min={minDate}
            />
          </div>

          {error && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 p-3">
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Delegation Token
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DelegatedAuthTokenCreateModal;
