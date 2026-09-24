import React, { useCallback, useState } from 'react';
import { Layers, Lock, Search, Users } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAsyncData, useUserType } from '@/hooks';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { groupService } from '@/services/group.service';
import { isProjectAdminGroupName } from '@/utils/default-groups';
import { cn } from '@/lib/utils';

interface AssignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupHash: string) => void;
  isLoading?: boolean;
  userName?: string;
  /** Groups the user already belongs to; they are shown as unavailable. */
  excludeHashes?: string[];
}

const PAGE_SIZE = 50;

/** What a group would give the user: the project groups it is granted. */
function GroupReach({ groupHash }: { groupHash: string }): React.JSX.Element {
  const fetchGrants = useCallback(
    () => groupService.listProjectGroupGrants(groupHash),
    [groupHash]
  );
  const grants = useAsyncData(fetchGrants);

  if (grants.isLoading) return <Skeleton className="mt-2 h-4 w-2/3" />;
  if (grants.error) {
    return (
      <p className="m-0 mt-2 text-xs text-muted-foreground">
        Couldn&apos;t check this group&apos;s project access.
      </p>
    );
  }
  const names = (grants.data ?? []).map((grant) => grant.group_name);
  return names.length === 0 ? (
    <p className="m-0 mt-2 text-xs text-warning-subtle-foreground">
      This group grants no project access yet, so the user won&apos;t reach any
      project through it.
    </p>
  ) : (
    <p className="m-0 mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <Layers className="h-3.5 w-3.5" aria-hidden="true" />
      Grants {names.join(', ')}
    </p>
  );
}

/** Pick a user group to add a user to. */
export function AssignGroupModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  userName = 'this user',
  excludeHashes = [],
}: AssignGroupModalProps): React.JSX.Element {
  const { isRoot } = useUserType();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setSearch('');
      setSelected(null);
    }
  }

  const fetchGroups = useCallback(
    () =>
      groupService.listGroups({
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        sort_by: 'group_name',
      }),
    [debouncedSearch]
  );
  const groups = useAsyncData(fetchGroups, { enabled: isOpen });
  const list = groups.data?.groups ?? [];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && onClose()}
    >
      <DialogContent size="md" className="gap-0 p-0">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle>Add {userName} to a group</DialogTitle>
          <DialogDescription>
            A user group decides which projects its members can reach, through
            the project groups it is granted.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user groups"
              className="pl-9"
              aria-label="Search user groups"
              autoFocus
            />
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="User groups"
          className="max-h-[360px] overflow-y-auto border-y border-border"
        >
          {groups.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12" />
              ))}
            </div>
          ) : groups.error ? (
            <div className="flex items-center justify-between gap-3 p-4 text-[13px] text-muted-foreground">
              User groups could not be loaded.
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void groups.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : list.length === 0 ? (
            <p className="m-0 p-6 text-center text-[13px] text-muted-foreground">
              {debouncedSearch
                ? `No user groups match “${debouncedSearch}”.`
                : 'No user groups exist yet.'}
            </p>
          ) : (
            list.map((group) => {
              const alreadyMember = excludeHashes.includes(group.group_hash);
              const rootOnly =
                isProjectAdminGroupName(group.group_name) && !isRoot;
              const disabled = alreadyMember || rootOnly;
              const isSelected = selected === group.group_hash;
              return (
                <button
                  key={group.group_hash}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => setSelected(group.group_hash)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border px-6 py-3 text-left last:border-b-0 transition-colors',
                    isSelected ? 'bg-primary-subtle' : 'hover:bg-accent/50',
                    disabled &&
                      'cursor-not-allowed opacity-60 hover:bg-transparent'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary' : 'border-input'
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <Users
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate">{group.group_name}</span>
                      {typeof group.member_count === 'number' && (
                        <span className="font-mono text-[11px] font-normal text-muted-foreground">
                          {group.member_count}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {alreadyMember
                        ? 'Already a member'
                        : rootOnly
                          ? 'Project administrator group — only root can change it'
                          : group.description || 'No description'}
                    </span>
                    {isSelected && <GroupReach groupHash={group.group_hash} />}
                  </span>
                  {rootOnly && (
                    <Lock
                      className="mt-0.5 h-3.5 w-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        {list.length === PAGE_SIZE && (
          <p className="m-0 px-6 pt-2 text-xs text-muted-foreground">
            Showing the first {PAGE_SIZE}. Search to narrow it down.
          </p>
        )}

        <DialogFooter className="gap-2 px-6 py-4 sm:gap-0">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            loading={isLoading}
          >
            Add to group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignGroupModal;
