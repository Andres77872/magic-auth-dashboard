import React, { useState, useRef, useEffect } from 'react';
import { ChevronIcon } from '@/components/icons';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  fullWidth?: boolean;
  validationState?: 'success' | 'error' | 'warning' | null;
  helperText?: string;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  success = false,
  disabled = false,
  searchable = false,
  fullWidth = false,
  validationState = null,
  helperText,
  className = '',
}: SelectProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);
  
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setHighlightedIndex(prev => 
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
    }
  };

  const handleOptionClick = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const finalValidationState = error ? 'error' : validationState;

  const selectClasses = [
    'select-wrapper',
    fullWidth ? 'select-full-width' : '',
    error ? 'select-error' : '',
    disabled ? 'select-disabled' : '',
    isOpen ? 'select-open' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const triggerClasses = [
    'select-trigger',
    finalValidationState ? `validation-${finalValidationState}` : '',
    success ? 'validation-success' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={selectClasses} ref={selectRef}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}

      <div
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${selectId}-label` : undefined}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        id={selectId}
      >
        <span className="select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`select-arrow ${isOpen ? 'select-arrow-up' : ''}`}>
          <ChevronIcon size="small" direction={isOpen ? "up" : "down"} />
        </span>
      </div>

      {isOpen && (
        <div className="select-dropdown" role="listbox">
          {searchable && (
            <div className="select-search">
              <input
                ref={searchInputRef}
                type="text"
                className="select-search-input"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
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
                  className={`select-option ${
                    option.disabled ? 'select-option-disabled' : ''
                  } ${
                    index === highlightedIndex ? 'select-option-highlighted' : ''
                  } ${
                    option.value === value ? 'select-option-selected' : ''
                  }`}
                  onClick={() => handleOptionClick(option)}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <div id={`${selectId}-error`} className="validation-message validation-message-error" role="alert">
          {error}
        </div>
      )}

      {!error && success && (
        <div className="validation-message validation-message-success">
          Looks good!
        </div>
      )}

      {!error && helperText && (
        <div id={`${selectId}-helper`} className="select-helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
}

export default Select;