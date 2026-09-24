/**
 * Bind one OAuth connection to several projects, built on the shared
 * `ProjectBatchPickerDialog` (search, selection, sequential run, per-row outcome).
 *
 * Each selected project gets a binding under the same connection key. New bindings are
 * created with api.auth's safe defaults — disabled, provisioning off, existing users
 * denied — and no URLs, so the success message says what is still missing.
 *
 * A project that already uses the key (for any connection) or already uses this
 * connection is reported as a conflict instead of being re-pointed: api.auth's upsert
 * would otherwise silently move an existing binding to this connection.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ProjectBatchPickerDialog,
  type ProjectBatchSummary,
} from '@/components/features/shared-pickers';
import { useToast } from '@/hooks/useToast';
import { isBindingConflict, validateConnectionKey } from './oauth-status';

export interface OAuthAssignProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectionName: string;
  /** Default connection key. */
  providerType: string;
  /** Projects already bound to THIS connection — left out of the picker. */
  boundProjectHashes: string[];
  /** Creates one binding; rejects with a 409 `ApiError` on a key/connection conflict. */
  assignProject: (projectHash: string, connectionKey: string) => Promise<void>;
  /** Called once after a run that created at least one binding (refetch here). */
  onAssigned: () => void;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function errorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : 'Unknown error.';
}

export function OAuthAssignProjectsModal({
  isOpen,
  onClose,
  connectionName,
  providerType,
  boundProjectHashes,
  assignProject,
  onAssigned,
}: OAuthAssignProjectsModalProps): React.JSX.Element {
  const { showToast } = useToast();
  // `null` means "untouched", so the default follows `providerType` without an effect.
  const [keyInput, setKeyInput] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const failures = useRef<string[]>([]);
  const connectionKey = keyInput ?? providerType;
  const key = connectionKey.trim().toLowerCase();

  // Reset the key each time the dialog opens (adjust-state-during-render, no effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setKeyInput(null);
      setKeyError(null);
    }
  }

  // Stable, so the dialog's project fetch does not re-run on every keystroke here.
  const handleLoadError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  const validate = (): boolean => {
    const problem = validateConnectionKey(connectionKey);
    setKeyError(problem);
    failures.current = [];
    return problem === null;
  };

  const runForProject = async (projectHash: string): Promise<void> => {
    try {
      await assignProject(projectHash, key);
    } catch (err) {
      if (!isBindingConflict(err)) failures.current.push(errorMessage(err));
      throw err;
    }
  };

  const onComplete = ({
    done,
    conflict,
    failed,
  }: ProjectBatchSummary): void => {
    if (done > 0) {
      showToast(
        `${plural(done, 'project')} assigned. Each starts disabled: add a redirect URI and a return origin, then enable it on the project's sign-in tab.`,
        'success'
      );
      onAssigned();
    }
    if (conflict > 0) {
      showToast(
        `${plural(conflict, 'project')} already ${conflict === 1 ? 'uses' : 'use'} the key "${key}" or this connection. Choose another key for ${conflict === 1 ? 'it' : 'them'}.`,
        'warning'
      );
    }
    if (failed > 0) {
      showToast(
        `${plural(failed, 'project')} could not be assigned: ${failures.current[0] ?? 'Unknown error.'}`,
        'error'
      );
    }
  };

  return (
    <ProjectBatchPickerDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign projects to ${connectionName}`}
      description="Each selected project gets a binding under the key below. New bindings start disabled with provisioning off; finish them on each project's sign-in tab."
      excludeProjectHashes={boundProjectHashes}
      confirmLabel="Assign"
      resultLabels={{
        done: 'Assigned',
        conflict: 'Key in use',
        error: 'Failed',
      }}
      emptyDescription="Every project you manage already uses this connection."
      validate={validate}
      runForProject={runForProject}
      isConflict={isBindingConflict}
      onComplete={onComplete}
      onLoadError={handleLoadError}
    >
      <div className="space-y-1.5">
        <Label htmlFor="oauth-assign-connection-key">Connection key</Label>
        <Input
          id="oauth-assign-connection-key"
          value={connectionKey}
          onChange={(event) => {
            setKeyInput(event.target.value);
            if (keyError) setKeyError(null);
          }}
          error={keyError ?? undefined}
          helperText="The name sign-in clients use for this provider in every selected project, e.g. google."
          spellCheck={false}
          autoComplete="off"
          fullWidth
        />
      </div>
    </ProjectBatchPickerDialog>
  );
}

export default OAuthAssignProjectsModal;
