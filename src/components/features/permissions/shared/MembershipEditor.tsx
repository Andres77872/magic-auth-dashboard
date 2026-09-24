import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks';

interface MembershipEditorProps<T> {
  title: string;
  description?: string;
  assigned: T[];
  /** Every item that could be assigned; already-assigned ones are filtered out. */
  catalog: T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getSecondary?: (item: T) => string | null | undefined;
  onAdd: (key: string) => Promise<void>;
  onRemove: (item: T) => Promise<void>;
  canEdit: boolean;
  isLoading?: boolean;
  error?: string | null;
  emptyText: string;
  addPlaceholder: string;
  /** Singular noun for toasts, e.g. "permission group". */
  noun: string;
}

/** An editable set: the assigned items with remove buttons and a searchable picker to add more. */
export function MembershipEditor<T>({
  title,
  description,
  assigned,
  catalog,
  getKey,
  getLabel,
  getSecondary,
  onAdd,
  onRemove,
  canEdit,
  isLoading = false,
  error,
  emptyText,
  addPlaceholder,
  noun,
}: MembershipEditorProps<T>): React.JSX.Element {
  const { showToast } = useToast();
  const [selected, setSelected] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const assignedKeys = useMemo(
    () => new Set(assigned.map(getKey)),
    [assigned, getKey]
  );
  const options = useMemo(
    () =>
      catalog
        .filter((item) => !assignedKeys.has(getKey(item)))
        .map((item) => ({ value: getKey(item), label: getLabel(item) })),
    [catalog, assignedKeys, getKey, getLabel]
  );

  const add = async (): Promise<void> => {
    if (!selected) return;
    setBusyKey(selected);
    try {
      await onAdd(selected);
      showToast(`Added the ${noun}.`, 'success');
      setSelected('');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : `The ${noun} could not be added.`,
        'error'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const remove = async (item: T): Promise<void> => {
    const key = getKey(item);
    setBusyKey(key);
    try {
      await onRemove(item);
      showToast(`Removed ${getLabel(item)}.`, 'success');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : `The ${noun} could not be removed.`,
        'error'
      );
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-[13px] font-semibold text-foreground">
          {title}
          {!isLoading && (
            <span className="ml-1.5 font-mono text-[11px] font-normal text-muted-foreground">
              {assigned.length}
            </span>
          )}
        </h3>
      </div>
      {description && (
        <p className="m-0 mb-3 text-xs text-muted-foreground">{description}</p>
      )}

      {canEdit && (
        <div className="mb-3 flex gap-2">
          <SearchableSelect
            className="min-w-0 flex-1"
            options={options}
            value={selected}
            onValueChange={setSelected}
            placeholder={
              options.length === 0 && !isLoading
                ? `No more ${noun}s to add`
                : addPlaceholder
            }
            disabled={isLoading || options.length === 0 || busyKey !== null}
          />
          <Button
            variant="secondary"
            onClick={() => void add()}
            disabled={!selected}
            loading={busyKey === selected && !!selected}
          >
            <Plus aria-hidden="true" />
            Add
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-9" />
          <Skeleton className="h-9" />
        </div>
      ) : error ? (
        <p className="m-0 rounded-md border border-border px-3 py-2.5 text-xs text-muted-foreground">
          Couldn&apos;t load this list. {error}
        </p>
      ) : assigned.length === 0 ? (
        <p className="m-0 rounded-md border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="m-0 list-none divide-y divide-border rounded-md border border-border p-0">
          {assigned.map((item) => {
            const key = getKey(item);
            const secondary = getSecondary?.(item);
            return (
              <li key={key} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-foreground">
                    {getLabel(item)}
                  </div>
                  {secondary && (
                    <div className="truncate font-mono text-[11px] text-muted-foreground">
                      {secondary}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => void remove(item)}
                    disabled={busyKey !== null}
                    aria-label={`Remove ${getLabel(item)}`}
                  >
                    <X aria-hidden="true" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default MembershipEditor;
