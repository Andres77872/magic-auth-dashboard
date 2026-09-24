/**
 * Single-select combobox for picking an entity (user, project, …) from a list
 * that may be long or searched on the server.
 *
 * - The trigger is a button, so a `<label htmlFor={id}>` names it.
 * - Without `onSearchChange` the options are filtered locally; with it the
 *   caller fetches matches (debounced here) and passes them back as `options`.
 * - Arrow keys move the highlight, Enter picks, Escape closes.
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

export interface EntityComboboxProps {
  id?: string;
  /** Selected value; empty string means nothing is selected. */
  value: string;
  /** Label for the selected value when it is not in the current `options` (server search). */
  selectedLabel?: string;
  options: ComboboxOption[];
  onChange: (option: ComboboxOption | null) => void;
  placeholder: string;
  searchPlaceholder?: string;
  /** Server-side search. Called (debounced) with the trimmed query. */
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  error?: string | null;
  emptyText?: string;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const SEARCH_DEBOUNCE_MS = 250;

export function EntityCombobox({
  id,
  value,
  selectedLabel,
  options,
  onChange,
  placeholder,
  searchPlaceholder = 'Search',
  onSearchChange,
  isLoading = false,
  error,
  emptyText = 'No matches',
  clearable = false,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: EntityComboboxProps): React.JSX.Element {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Server search: debounce the query; local mode filters below.
  useEffect(() => {
    if (!onSearchChange || !open) return undefined;
    const handle = window.setTimeout(
      () => onSearchChange(query.trim()),
      query ? SEARCH_DEBOUNCE_MS : 0
    );
    return () => window.clearTimeout(handle);
  }, [query, open, onSearchChange]);

  const visible = useMemo(() => {
    if (onSearchChange) return options;
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        (option.description?.toLowerCase().includes(term) ?? false)
    );
  }, [options, query, onSearchChange]);

  const selected = options.find((option) => option.value === value);
  const triggerText = value
    ? (selected?.label ?? selectedLabel ?? value)
    : placeholder;

  const pick = (option: ComboboxOption): void => {
    onChange(option);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((index) =>
        Math.min(index + 1, Math.max(visible.length - 1, 0))
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = visible[highlighted];
      if (option) pick(option);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setHighlighted(0);
          if (!next) setQuery('');
        }}
      >
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-haspopup="listbox"
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn(
              'flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-2.5 text-left text-[13px] transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-muted-foreground',
              clearable && value && 'pr-8'
            )}
          >
            <span className="truncate">{triggerText}</span>
            <ChevronsUpDown
              className="h-3.5 w-3.5 shrink-0 opacity-50"
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] min-w-[240px] p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="border-b border-border p-2">
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              className="h-8 text-[13px]"
              rightIcon={
                isLoading ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : undefined
              }
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="m-0 max-h-64 list-none overflow-y-auto p-1"
          >
            {error ? (
              <li className="px-2 py-3 text-center text-xs text-destructive">
                {error}
              </li>
            ) : visible.length === 0 ? (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                {isLoading ? 'Loading…' : emptyText}
              </li>
            ) : (
              visible.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlighted(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(option)}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-[13px]',
                      index === highlighted && 'bg-accent'
                    )}
                  >
                    <Check
                      className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-6 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Clear selection"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default EntityCombobox;
