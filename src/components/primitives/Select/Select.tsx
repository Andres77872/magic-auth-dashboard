import React, { forwardRef, useState, useRef, useEffect, useId } from 'react';
import type { FormSize, ValidationState, SelectOption } from '../types';
import './Select.css';

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

    const wrapperClasses = [
      'select-wrapper',
      `select-wrapper-${size}`,
      fullWidth && 'select-wrapper-full-width',
      disabled && 'select-wrapper-disabled',
      isOpen && 'select-wrapper-open',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const triggerClasses = [
      'select-trigger',
      `select-trigger-${size}`,
      finalValidationState && `select-trigger-${finalValidationState}`,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses} ref={ref || selectRef}>
        {label && (
          <label htmlFor={selectId} className="select-label">
            {label}
            {required && <span className="select-required" aria-hidden="true">*</span>}
          </label>
        )}

        <div ref={selectRef} className="select-container">
          <div
            id={selectId}
            className={triggerClasses}
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
            <span className={`select-value ${!selectedOption ? 'select-placeholder' : ''}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="select-icons">
              {clearable && value && !disabled && (
                <button
                  type="button"
                  className="select-clear"
                  onClick={handleClear}
                  aria-label="Clear selection"
                  tabIndex={-1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              <span className="select-arrow" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>

          {isOpen && (
            <div className="select-dropdown" role="listbox" id={`${selectId}-listbox`}>
              {searchable && (
                <div className="select-search">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="select-search-input"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Search options"
                  />
                </div>
              )}

              <div className="select-options">
                {filteredOptions.length === 0 ? (
                  <div className="select-no-options">No options found</div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <div
                      key={option.value}
                      className={[
                        'select-option',
                        option.disabled && 'select-option-disabled',
                        index === highlightedIndex && 'select-option-highlighted',
                        option.value === value && 'select-option-selected',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleOptionClick(option)}
                      role="option"
                      aria-selected={option.value === value}
                      aria-disabled={option.disabled}
                    >
                      {option.label}
                      {option.value === value && (
                        <svg className="select-option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="select-footer">
          {error && (
            <div id={errorId} className="select-message select-message-error" role="alert">
              {error}
            </div>
          )}

          {!error && helperText && (
            <div id={helperId} className="select-message select-message-helper">
              {helperText}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
