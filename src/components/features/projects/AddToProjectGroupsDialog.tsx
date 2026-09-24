import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectGroupOptions } from '@/hooks/useProjectDetails';
import { formatCount } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';

interface AddToProjectGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  /** Project groups that already contain the project. */
  assignedGroupHashes: string[];
  onAdd: (groupHashes: string[]) => Promise<void>;
  isAdding: boolean;
}

/** Multi-select of project groups that don't contain the project yet. */
export function AddToProjectGroupsDialog({
  open,
  onOpenChange,
  projectName,
  assignedGroupHashes,
  onAdd,
  isAdding,
}: AddToProjectGroupsDialogProps): React.JSX.Element {
  const { projectGroups, isLoading, error, refetch, isRefreshing } =
    useProjectGroupOptions(open);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState('');

  const term = filter.trim().toLowerCase();
  const available = projectGroups.filter(
    (group) =>
      !assignedGroupHashes.includes(group.group_hash) &&
      (!term ||
        group.group_name.toLowerCase().includes(term) ||
        (group.description ?? '').toLowerCase().includes(term))
  );

  const close = (next: boolean): void => {
    if (isAdding) return;
    if (!next) {
      setSelected([]);
      setFilter('');
    }
    onOpenChange(next);
  };

  const toggle = (groupHash: string): void =>
    setSelected((prev) =>
      prev.includes(groupHash)
        ? prev.filter((hash) => hash !== groupHash)
        : [...prev, groupHash]
    );

  const submit = async (): Promise<void> => {
    try {
      await onAdd(selected);
      setSelected([]);
      setFilter('');
    } catch {
      // The caller reports failures and keeps the dialog open.
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add to project groups</DialogTitle>
          <DialogDescription>
            User groups granted a selected project group will be able to sign in
            to {projectName}.
          </DialogDescription>
        </DialogHeader>

        <Input
          aria-label="Filter project groups"
          placeholder="Filter by name or description"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          fullWidth
        />

        <div className="max-h-[360px] min-h-[160px] overflow-y-auto rounded-md border border-border">
          {isLoading ? (
            <div className="space-y-3 p-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-full" />
              ))}
            </div>
          ) : error ? (
            <div
              className="flex flex-col items-center gap-3 p-6 text-center"
              role="alert"
            >
              <p className="m-0 text-[13px] text-muted-foreground">
                Project groups could not be loaded. {error}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void refetch()}
                disabled={isRefreshing}
              >
                Try again
              </Button>
            </div>
          ) : available.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <p className="m-0 text-[13px] text-muted-foreground">
                {term
                  ? 'No project groups match this filter.'
                  : 'The project is already in every project group.'}
              </p>
              <Link
                to={ROUTES.PROJECT_GROUPS_CREATE}
                className="text-xs font-medium text-primary"
              >
                Create a project group
              </Link>
            </div>
          ) : (
            <ul className="m-0 list-none divide-y divide-border p-0">
              {available.map((group) => {
                const checkboxId = `add-project-group-${group.group_hash}`;
                return (
                  <li
                    key={group.group_hash}
                    className="flex items-start gap-3 px-3 py-2.5"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selected.includes(group.group_hash)}
                      onCheckedChange={() => toggle(group.group_hash)}
                      disabled={isAdding}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={checkboxId}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <span className="block truncate text-[13px] font-medium text-foreground">
                        {group.group_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {formatCount(group.project_count, 'project')}
                        {group.description ? ` · ${group.description}` : ''}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={() => close(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void submit()}
            disabled={selected.length === 0}
            loading={isAdding}
          >
            {selected.length > 1
              ? `Add to ${selected.length} groups`
              : 'Add to group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddToProjectGroupsDialog;
