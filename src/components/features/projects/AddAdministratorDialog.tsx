import React, { useEffect, useState } from 'react';
import { Check, Search } from 'lucide-react';
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
import { UserAvatar } from '@/components/features/users/UserAvatar';
import { userService } from '@/services/user.service';
import { cn } from '@/lib/utils';
import type { User } from '@/types/auth.types';

interface AddAdministratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  /** Users already in the group, hidden from the results. */
  existingUserHashes: string[];
  onAdd: (user: User) => Promise<void>;
  isAdding: boolean;
}

const SEARCH_LIMIT = 20;

/**
 * Pick an admin-type user to add to the project's `admin_…` group. Only admin
 * users gain project-admin scope from that membership, so the search is
 * limited to them (`/users/search/query?user_type_filter=admin`).
 */
export function AddAdministratorDialog({
  open,
  onOpenChange,
  groupName,
  existingUserHashes,
  onAdd,
  isAdding,
}: AddAdministratorDialogProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<User | null>(null);

  // Debounced search; the result list is replaced only by the latest request.
  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) return undefined;
    let active = true;
    const id = window.setTimeout(() => {
      userService
        .searchUsers({
          q: term,
          user_type_filter: 'admin',
          limit: SEARCH_LIMIT,
        })
        .then((response) => {
          if (!active) return;
          setResults(response.users);
          setSearchError(null);
        })
        .catch((err: unknown) => {
          if (!active) return;
          setResults(null);
          setSearchError(
            err instanceof Error ? err.message : 'Users could not be searched.'
          );
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(id);
    };
  }, [open, query]);

  const reset = (): void => {
    setQuery('');
    setResults(null);
    setSearchError(null);
    setSelected(null);
  };

  const close = (next: boolean): void => {
    if (isAdding) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const visible =
    query.trim().length >= 2
      ? (results ?? []).filter(
          (user) => !existingUserHashes.includes(user.user_hash)
        )
      : [];

  const submit = async (): Promise<void> => {
    if (!selected) return;
    try {
      await onAdd(selected);
      reset();
    } catch {
      // The caller reports the error; keep the selection so the operator can retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add administrator</DialogTitle>
          <DialogDescription>
            Adds an admin user to <span className="font-mono">{groupName}</span>
            , which makes them an administrator of this project.
          </DialogDescription>
        </DialogHeader>

        <Input
          aria-label="Search admin users"
          placeholder="Search admin users by username or email"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(null);
          }}
          leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
          autoComplete="off"
          fullWidth
          autoFocus
        />

        <div className="min-h-[120px]">
          {query.trim().length < 2 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Type at least 2 characters.
            </p>
          ) : searchError ? (
            <p
              className="py-6 text-center text-xs text-destructive"
              role="alert"
            >
              {searchError}
            </p>
          ) : results === null ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Searching…
            </p>
          ) : visible.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No admin users match. Consumers and root users can&apos;t be
              project administrators.
            </p>
          ) : (
            <ul className="m-0 max-h-[280px] list-none divide-y divide-border overflow-y-auto rounded-md border border-border p-0">
              {visible.map((user) => {
                const isSelected = selected?.user_hash === user.user_hash;
                return (
                  <li key={user.user_hash}>
                    <button
                      type="button"
                      onClick={() => setSelected(user)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        isSelected && 'bg-primary-subtle'
                      )}
                    >
                      <UserAvatar username={user.username} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-foreground">
                          {user.username}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {user.email || 'No email'}
                        </span>
                      </span>
                      {isSelected && (
                        <Check
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                      )}
                    </button>
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
            disabled={!selected}
            loading={isAdding}
          >
            Add administrator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddAdministratorDialog;
