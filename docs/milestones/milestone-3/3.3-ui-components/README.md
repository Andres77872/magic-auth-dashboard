# Milestone 3.3: Common UI Components

## Overview
**Duration**: Day 5-6  
**Status**: 🟡 **READY TO START**  
**Goal**: Build comprehensive UI component library with reusable buttons, forms, modals, tables, and other essential interface elements

**Dependencies**: ✅ Milestones 3.1 & 3.2 completed (Layout & Navigation)

## 📋 Tasks Checklist

### Step 1: Core Interactive Components
- [ ] Create button component with multiple variants and states
- [ ] Implement enhanced input and form field components
- [ ] Build custom select dropdown with search functionality
- [ ] Add textarea component with auto-resize capability

### Step 2: Modal and Dialog Systems
- [ ] Create modal component with backdrop and focus management
- [ ] Implement confirmation dialog for destructive actions
- [ ] Add toast notification system for user feedback
- [ ] Build alert banner component for various message types

### Step 3: Data Display Components
- [ ] Create responsive data table with sorting and pagination
- [ ] Implement card component for content organization
- [ ] Build badge component for status indicators
- [ ] Add progress bar and loading states

### Step 4: Advanced UI Elements
- [ ] Create tooltip component for additional information
- [ ] Implement tab system for content organization
- [ ] Build accordion component for expandable content
- [ ] Add search input with autocomplete functionality

---

## 🔧 Detailed Implementation Steps

### Step 1: Create Core Interactive Components

Create `src/components/common/Button.tsx`:

```typescript
import React, { forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';
    const variantClasses = `btn-${variant}`;
    const sizeClasses = `btn-${size}`;
    const fullWidthClasses = fullWidth ? 'btn-full-width' : '';
    const loadingClasses = isLoading ? 'btn-loading' : '';

    const buttonClasses = [
      baseClasses,
      variantClasses,
      sizeClasses,
      fullWidthClasses,
      loadingClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner size="small" />}
        {!isLoading && leftIcon && <span className="btn-icon btn-icon-left">{leftIcon}</span>}
        <span className="btn-content">{children}</span>
        {!isLoading && rightIcon && <span className="btn-icon btn-icon-right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

Create `src/components/common/Input.tsx`:

```typescript
import React, { forwardRef, useState } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isLoading = false,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = [
      'input-wrapper',
      fullWidth ? 'input-full-width' : '',
      error ? 'input-error' : '',
      focused ? 'input-focused' : '',
      isLoading ? 'input-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {props.required && <span className="input-required">*</span>}
          </label>
        )}
        
        <div className="input-field">
          {leftIcon && <span className="input-icon input-icon-left">{leftIcon}</span>}
          
          <input
            ref={ref}
            id={inputId}
            className="input-control"
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          
          {isLoading && (
            <span className="input-icon input-icon-right">
              <LoadingSpinner size="small" />
            </span>
          )}
          {!isLoading && rightIcon && (
            <span className="input-icon input-icon-right">{rightIcon}</span>
          )}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="input-error-text" role="alert">
            {error}
          </div>
        )}
        
        {!error && helperText && (
          <div id={`${inputId}-helper`} className="input-helper-text">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
```

Create `src/components/common/Select.tsx`:

```typescript
import React, { useState, useRef, useEffect } from 'react';

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
  disabled?: boolean;
  searchable?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  searchable = false,
  fullWidth = false,
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

  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={selectClasses} ref={selectRef}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}

      <div
        className="select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-labelledby={label ? `${selectId}-label` : undefined}
        id={selectId}
      >
        <span className="select-value">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`select-arrow ${isOpen ? 'select-arrow-up' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
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
        <div className="select-error-text" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default Select;
```

Create `src/components/common/Modal.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'xl';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}: ModalProps): React.JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElement = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          
          if (focusableElement) {
            focusableElement.focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 0);
    } else {
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalClasses = [
    'modal-content',
    `modal-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
```

Create `src/components/common/Table.tsx`:

```typescript
import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface TableColumn<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
}

type SortState<T> = {
  key: keyof T | null;
  direction: 'asc' | 'desc';
};

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onSort,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  maxHeight,
}: TableProps<T>): React.JSX.Element {
  const [sortState, setSortState] = useState<SortState<T>>({
    key: null,
    direction: 'asc',
  });

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || isLoading) return;

    const newDirection = 
      sortState.key === column.key && sortState.direction === 'asc' 
        ? 'desc' 
        : 'asc';

    setSortState({
      key: column.key,
      direction: newDirection,
    });

    onSort?.(column.key, newDirection);
  };

  const getSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;

    const isActive = sortState.key === column.key;
    
    return (
      <span className={`table-sort-icon ${isActive ? 'table-sort-active' : ''}`}>
        {isActive && sortState.direction === 'asc' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18,15 12,9 6,15"/>
          </svg>
        ) : isActive && sortState.direction === 'desc' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
            <polyline points="18,15 12,9 6,15"/>
          </svg>
        )}
      </span>
    );
  };

  const tableClasses = [
    'table-wrapper',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tableClasses}>
      <div 
        className="table-container"
        style={{ maxHeight }}
      >
        <table className="table">
          <thead className="table-header">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`table-header-cell ${column.sortable ? 'table-sortable' : ''} table-align-${column.align || 'left'}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="table-header-content">
                    <span>{column.header}</span>
                    {getSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="table-loading">
                  <LoadingSpinner size="medium" message="Loading data..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="table-row">
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className={`table-cell table-align-${column.align || 'left'}`}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] || '')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
```

Create `src/components/common/Card.tsx`:

```typescript
import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  border?: boolean;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  title,
  subtitle,
  actions,
  padding = 'medium',
  shadow = true,
  border = true,
  hover = false,
  className = '',
  onClick,
}: CardProps): React.JSX.Element {
  const cardClasses = [
    'card',
    `card-padding-${padding}`,
    shadow ? 'card-shadow' : '',
    border ? 'card-border' : '',
    hover ? 'card-hover' : '',
    onClick ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      className={cardClasses}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {(title || subtitle || actions) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      
      <div className="card-content">
        {children}
      </div>
    </CardWrapper>
  );
}

export default Card;
```

Create `src/components/common/Badge.tsx`:

```typescript
import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'primary',
  size = 'medium',
  dot = false,
  className = '',
}: BadgeProps): React.JSX.Element {
  const badgeClasses = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    dot ? 'badge-dot' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={badgeClasses}>
      {dot && <span className="badge-dot-indicator" />}
      {children}
    </span>
  );
}

export default Badge;
```

### Step 4: Create Component Index

Create `src/components/common/index.ts`:

```typescript
// Update existing index file
export { ErrorBoundary } from './ErrorBoundary';
export { LoadingSpinner } from './LoadingSpinner';
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Select } from './Select';
export { default as Modal } from './Modal';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as Table } from './Table';
export { default as Card } from './Card';
export { default as Badge } from './Badge';

export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { SelectProps, SelectOption } from './Select';
export type { ModalProps } from './Modal';
export type { ConfirmDialogProps } from './ConfirmDialog';
export type { TableProps, TableColumn } from './Table';
export type { CardProps } from './Card';
export type { BadgeProps } from './Badge';
```

---

## 🧪 Testing & Verification

### Step 1: Component Functionality Testing
- [ ] All button variants render and respond correctly
- [ ] Modal focus management and keyboard navigation work
- [ ] Table sorting and data display function properly
- [ ] Components integrate with existing layout

### Step 2: Accessibility Testing
- [ ] All components are keyboard accessible
- [ ] Screen readers announce component states
- [ ] ARIA labels and roles are properly implemented
- [ ] Color contrast meets WCAG standards

### Step 3: Integration Testing
- [ ] Components integrate well with existing layout
- [ ] Styling is consistent with design system
- [ ] No conflicts with existing CSS
- [ ] TypeScript types are properly exported

---

## ✅ Completion Criteria

- [ ] All UI components render without errors
- [ ] Components are fully accessible (WCAG 2.1 AA)
- [ ] TypeScript compilation passes without errors
- [ ] Components integrate with design system
- [ ] Performance targets met (< 200ms interactions)

---

## 🎉 MILESTONE 3.3 - COMPLETION CHECKLIST

**Next Step**: **PHASE 3 COMPLETE** - Ready for [Phase 4: Dashboard Overview](../../milestone-4/README.md)

### Key Deliverables
- ✅ **Complete UI Component Library** - Reusable components
- ✅ **Accessibility Compliance** - WCAG 2.1 AA standards
- ✅ **Design System Integration** - Consistent styling

### Integration Points
- Uses design system from Phase 1 ✅
- Integrates with layout from 3.1 & 3.2 ✅
- Ready for data visualization in Phase 4 ✅

## 🎊 **PHASE 3 COMPLETION**

With Milestone 3.3 complete, **Phase 3: Layout & Navigation** will be fully implemented!

**🚀 Ready to proceed to Phase 4: Dashboard Overview!** 