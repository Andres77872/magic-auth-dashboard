import React, { forwardRef, useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormSize, ValidationState, SelectOption } from '../types';

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  size?: FormSize;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  required?: boolean;
  validationState?: ValidationState;
  className?: string;
  id?: string;
}

const sizeStyles: Record<FormSize, { trigger: string; text: string }> = {
  sm: { trigger: 'h-8 px-2 text-xs', text: 'text-xs' },
  md: { trigger: 'h-10 px-3 text-sm', text: 'text-sm' },
  lg: { trigger: 'h-12 px-4 text-base', text: 'text-base' },
};

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      size = 'md',
      label,
      error,
      helperText,
      placeholder = 'Select...',
      searchable = false,
      clearable = false,
      fullWidth = false,
      disabled = false,
      required = false,
      validationState = null,
      className = '',
      id,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const selectRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const selectedOption = options.find((opt) => opt.value === value);
    const finalValidationState = error ? 'error' : validationState;

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    useEffect(() => {
      if (isOpen) {
        setHighlightedIndex(
          filteredOptions.findIndex((opt) => opt.value === value)
        );
      }
    }, [isOpen, filteredOptions, value]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = filteredOptions[highlightedIndex];
            if (!option.disabled) {
              onChange(option.value);
              setIsOpen(false);
              setSearchTerm('');
            }
          } else {
            setIsOpen(!isOpen);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          break;
        case ' ':
          if (!searchable) {
            event.preventDefault();
            setIsOpen(!isOpen);
          }
          break;
      }
    };

    const handleOptionClick = (option: SelectOption) => {
      if (!option.disabled) {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleClear = (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange('');
    };

    return (
      <div 
        className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', className)} 
        ref={ref || selectRef}
      >
        {label && (
          <label htmlFor={selectId} className={cn('font-medium text-foreground', sizeStyles[size].text)}>
            {label}
            {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
          </label>
        )}

        <div ref={selectRef} className="relative">
          <div
            id={selectId}
            className={cn(
              'flex items-center justify-between rounded-md border bg-background cursor-pointer transition-colors',
              sizeStyles[size].trigger,
              disabled && 'opacity-50 cursor-not-allowed bg-muted',
              finalValidationState === 'error' && 'border-destructive focus:ring-destructive',
              finalValidationState === 'success' && 'border-success',
              !finalValidationState && 'border-input hover:border-ring focus:ring-2 focus:ring-ring'
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            tabIndex={disabled ? -1 : 0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${selectId}-listbox`}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-invalid={error ? true : undefined}
            aria-required={required}
            aria-disabled={disabled}
          >
            <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-1 shrink-0">
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
              <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')} aria-hidden="true" />
            </div>
          </div>

          {isOpen && (
            <div 
              className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95"
              role="listbox" 
              id={`${selectId}-listbox`}
            >
              {searchable && (
                <div className="p-2 border-b border-border">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full px-2 py-1.5 text-sm rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Search options"
                  />
                </div>
              )}

              <div className="max-h-60 overflow-auto p-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">No options found</div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer text-sm transition-colors',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        index === highlightedIndex && 'bg-accent',
                        option.value === value && 'bg-accent font-medium'
                      )}
                      onClick={() => handleOptionClick(option)}
                      role="option"
                      aria-selected={option.value === value}
                      aria-disabled={option.disabled}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.value === value && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div id={errorId} className="text-xs text-destructive" role="alert">
            {error}
          </div>
        )}

        {!error && helperText && (
          <div id={helperId} className="text-xs text-muted-foreground">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
