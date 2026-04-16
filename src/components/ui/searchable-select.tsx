import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  popoverClassName?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  label,
  helperText,
  disabled = false,
  clearable = false,
  className,
  popoverClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchTerm
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  React.useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setHighlightedIndex(
        filteredOptions.findIndex((opt) => opt.value === value)
      );
    }
  }, [open, filteredOptions, value]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          setOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (
          open &&
          highlightedIndex >= 0 &&
          filteredOptions[highlightedIndex]
        ) {
          const option = filteredOptions[highlightedIndex];
          if (!option.disabled) {
            onValueChange(option.value);
            setOpen(false);
            setSearchTerm('');
          }
        } else if (!open) {
          setOpen(true);
        }
        break;
      case 'Escape':
        setOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const handleSelect = (option: SearchableSelectOption) => {
    if (!option.disabled) {
      onValueChange(option.value);
      setOpen(false);
      setSearchTerm('');
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange('');
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <Popover
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setSearchTerm('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-disabled={disabled}
            disabled={disabled}
            className={cn(
              'justify-between font-normal',
              !selectedOption && 'text-muted-foreground'
            )}
            onKeyDown={handleKeyDown}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {clearable && value && !disabled && (
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-muted transition-colors"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  tabIndex={-1}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              <ChevronsUpDown className="h-4 w-4 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            'w-[--radix-popover-trigger-width] p-0',
            popoverClassName
          )}
          align="start"
          sideOffset={4}
          onKeyDown={handleKeyDown}
        >
          <div className="p-2 border-b border-border">
            <Input
              ref={inputRef}
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div
            ref={listRef}
            className="max-h-60 overflow-auto p-1"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  className={cn(
                    'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
                    option.disabled && 'opacity-50 pointer-events-none',
                    index === highlightedIndex && 'bg-accent',
                    option.value === value && 'bg-accent/50'
                  )}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      option.value === value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {helperText && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}

export default SearchableSelect;
