import React, { useId, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { formatNumber, pluralize } from '@/utils/formatters';

export interface PickerItem {
  id: string;
  label: string;
  description?: string | null;
  /** Extra context on the right (badge, count). */
  meta?: React.ReactNode;
  /** Why the item can't be selected ("Already a member"). */
  disabledReason?: string;
}

export interface PickerFailure {
  id: string;
  label: string;
  message: string;
}

export interface GroupPickerDialogProps {
  onClose: () => void;
  title: string;
  description: React.ReactNode;
  items: PickerItem[];
  isLoading: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  /** Shown when there are no items and no search. */
  emptyMessage: string;
  /** Singular and plural nouns for counts ("user", "users"). */
  noun: [string, string];
  maxSelection?: number;
  confirmLabel: (count: number) => string;
  /**
   * Apply the selection. Resolve with the items that failed (empty when
   * everything succeeded, which closes the dialog); reject when nothing could
   * be applied.
   */
  onConfirm: (ids: string[]) => Promise<PickerFailure[]>;
  /** Short note under the list (e.g. how search works). */
  footnote?: React.ReactNode;
}

/**
 * Multi-select dialog used to add members, projects and grants. Mount it only
 * while open so each opening starts with an empty selection.
 */
export function GroupPickerDialog({
  onClose,
  title,
  description,
  items,
  isLoading,
  isRefreshing = false,
  error,
  onRetry,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  emptyMessage,
  noun,
  maxSelection,
  confirmLabel,
  onConfirm,
  footnote,
}: GroupPickerDialogProps): React.JSX.Element {
  const baseId = useId();
  const [selected, setSelected] = useState<string[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failures, setFailures] = useState<PickerFailure[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectable = items.filter((item) => !item.disabledReason);
  const limitReached =
    maxSelection !== undefined && selected.length >= maxSelection;
  const allVisibleSelected =
    selectable.length > 0 &&
    selectable.every((item) => selected.includes(item.id));

  const toggle = (item: PickerItem): void => {
    if (item.disabledReason) return;
    setSelected((prev) => {
      if (prev.includes(item.id)) return prev.filter((id) => id !== item.id);
      if (maxSelection !== undefined && prev.length >= maxSelection)
        return prev;
      return [...prev, item.id];
    });
    setLabels((prev) => ({ ...prev, [item.id]: item.label }));
  };

  const toggleAllVisible = (): void => {
    if (allVisibleSelected) {
      const visible = new Set(selectable.map((item) => item.id));
      setSelected((prev) => prev.filter((id) => !visible.has(id)));
      return;
    }
    setSelected((prev) => {
      const next = [...prev];
      for (const item of selectable) {
        if (maxSelection !== undefined && next.length >= maxSelection) break;
        if (!next.includes(item.id)) next.push(item.id);
      }
      return next;
    });
    setLabels((prev) => ({
      ...prev,
      ...Object.fromEntries(selectable.map((item) => [item.id, item.label])),
    }));
  };

  const handleConfirm = async (): Promise<void> => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setFailures([]);
    try {
      const failed = await onConfirm(selected);
      if (failed.length === 0) {
        onClose();
        return;
      }
      setFailures(failed);
      // Keep only what failed selected, so it can be retried.
      setSelected(
        failed
          .map((failure) => failure.id)
          .filter((id) => selected.includes(id))
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'The change could not be applied.'
      );
    }
    setIsSubmitting(false);
  };

  const [singular, plural] = noun;
  const listId = `${baseId}-list`;

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent size="lg" className="gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            aria-controls={listId}
            className="h-8 pl-9 text-[13px]"
            fullWidth
          />
          {isRefreshing && (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-label="Searching"
            />
          )}
        </div>

        <div className="flex min-h-5 items-center justify-between text-xs text-muted-foreground">
          <span aria-live="polite">
            {selected.length > 0
              ? `${formatNumber(selected.length)} ${pluralize(selected.length, singular, plural)} selected`
              : `Select ${plural}`}
            {limitReached &&
              ` · limit of ${formatNumber(maxSelection)} reached`}
          </span>
          {selected.length > 0 && (
            <button
              type="button"
              className="rounded-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setSelected([])}
            >
              Clear selection
            </button>
          )}
        </div>

        <div
          id={listId}
          className="max-h-[360px] overflow-y-auto rounded-md border border-border"
        >
          {isLoading ? (
            <div
              className="space-y-2 p-3"
              aria-busy="true"
              aria-label={`Loading ${plural}`}
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full" />
              ))}
            </div>
          ) : error ? (
            <div
              className="flex flex-col items-center gap-2 px-4 py-8 text-center"
              role="alert"
            >
              <p className="text-sm text-foreground">{error}</p>
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {searchValue.trim()
                ? `No ${plural} match “${searchValue.trim()}”.`
                : emptyMessage}
            </p>
          ) : (
            <>
              {selectable.length > 1 && (
                <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-3 py-2">
                  <Checkbox
                    id={`${baseId}-all`}
                    checked={allVisibleSelected}
                    onCheckedChange={toggleAllVisible}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor={`${baseId}-all`}
                    className="cursor-pointer text-xs font-medium text-foreground"
                  >
                    Select all shown
                  </label>
                </div>
              )}
              <ul className="m-0 list-none divide-y divide-border p-0">
                {items.map((item) => {
                  const checked = selected.includes(item.id);
                  const disabled =
                    Boolean(item.disabledReason) ||
                    isSubmitting ||
                    (!checked && limitReached);
                  const checkboxId = `${baseId}-${item.id}`;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 transition-colors',
                        checked
                          ? 'bg-primary/5'
                          : !disabled && 'hover:bg-accent/40'
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={() => toggle(item)}
                        disabled={disabled}
                        aria-label={item.label}
                        aria-describedby={
                          item.description || item.disabledReason
                            ? `${checkboxId}-hint`
                            : undefined
                        }
                      />
                      <label
                        htmlFor={checkboxId}
                        className={cn(
                          'min-w-0 flex-1',
                          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
                        )}
                      >
                        <span className="block truncate text-[13px] font-medium text-foreground">
                          {item.label}
                        </span>
                        {(item.description || item.disabledReason) && (
                          <span
                            id={`${checkboxId}-hint`}
                            className="block truncate text-xs text-muted-foreground"
                          >
                            {item.disabledReason ?? item.description}
                          </span>
                        )}
                      </label>
                      {item.meta && (
                        <span className="shrink-0">{item.meta}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {footnote && (
          <p className="text-xs text-muted-foreground">{footnote}</p>
        )}

        {submitError && (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {submitError}
          </p>
        )}

        {failures.length > 0 && (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
            role="alert"
          >
            <p className="text-sm font-medium text-destructive">
              {formatNumber(failures.length)}{' '}
              {pluralize(failures.length, singular, plural)} could not be
              changed
            </p>
            <ul className="mt-1 list-none space-y-0.5 p-0 text-xs text-muted-foreground">
              {failures.map((failure) => (
                <li key={`${failure.id}-${failure.message}`}>
                  <span className="font-medium text-foreground">
                    {labels[failure.id] ?? failure.label}
                  </span>
                  : {failure.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {failures.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleConfirm()}
            loading={isSubmitting}
            disabled={selected.length === 0}
          >
            {failures.length > 0 && selected.length > 0
              ? 'Try again'
              : confirmLabel(selected.length)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default GroupPickerDialog;
