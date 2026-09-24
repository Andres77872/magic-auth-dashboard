import React, { useId, useState } from 'react';
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
import type { CatalogMetadata } from '@/types/global-roles.types';

export interface CatalogOption {
  hash: string;
  label: string;
  hint?: string;
}

interface CatalogAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'role' | 'permission-group';
  projectName: string;
  /** Entries not in the catalog yet. */
  options: CatalogOption[];
  isLoadingOptions: boolean;
  optionsError: string | null;
  onRetryOptions: () => void;
  onAdd: (hash: string, metadata: CatalogMetadata) => Promise<void>;
  isAdding: boolean;
}

const COPY = {
  role: { title: 'Suggest a role', field: 'Role', noun: 'role' },
  'permission-group': {
    title: 'Suggest a permission group',
    field: 'Permission group',
    noun: 'permission group',
  },
} as const;

/** Add a global role or permission group to a project's catalog, with an optional purpose and notes. */
export function CatalogAddDialog({
  open,
  onOpenChange,
  kind,
  projectName,
  options,
  isLoadingOptions,
  optionsError,
  onRetryOptions,
  onAdd,
  isAdding,
}: CatalogAddDialogProps): React.JSX.Element {
  const selectId = useId();
  const [hash, setHash] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const copy = COPY[kind];

  const reset = (): void => {
    setHash('');
    setPurpose('');
    setNotes('');
  };

  const close = (next: boolean): void => {
    if (isAdding) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!hash) return;
    try {
      // Omitted fields keep any value stored from an earlier catalog entry.
      await onAdd(hash, {
        catalog_purpose: purpose.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
    } catch {
      // The caller reports the error; keep the values for a retry.
    }
  };

  const selected = options.find((option) => option.hash === hash);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>
            Suggests the {copy.noun} to operators working on {projectName}. It
            does not assign anything.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={selectId}
              className="block text-sm font-medium text-foreground"
            >
              {copy.field}
            </label>
            {optionsError ? (
              <div
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                role="alert"
              >
                <p className="m-0 text-xs text-muted-foreground">
                  Options could not be loaded. {optionsError}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onRetryOptions}
                >
                  Try again
                </Button>
              </div>
            ) : (
              <select
                id={selectId}
                value={hash}
                onChange={(event) => setHash(event.target.value)}
                disabled={isLoadingOptions || isAdding || options.length === 0}
                className="h-[34px] w-full rounded-sm border border-input bg-card px-2.5 text-[13px] text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="">
                  {isLoadingOptions
                    ? 'Loading…'
                    : options.length === 0
                      ? `Every ${copy.noun} is already suggested`
                      : `Choose a ${copy.noun}`}
                </option>
                {options.map((option) => (
                  <option key={option.hash} value={option.hash}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {selected?.hint && (
              <p className="m-0 text-xs text-muted-foreground">
                {selected.hint}
              </p>
            )}
          </div>
          <Input
            label="Purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="e.g. Content editors"
            helperText="Optional. Why operators should use it here."
            disabled={isAdding}
            fullWidth
          />
          <Textarea
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            disabled={isAdding}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => close(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!hash} loading={isAdding}>
              Add to catalog
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CatalogAddDialog;
