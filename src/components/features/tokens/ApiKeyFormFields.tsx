/**
 * Form building blocks shared by the API key create, delegation and edit
 * dialogs: labelled field wrapper, owner and project pickers, expiry date.
 */

import React, { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  EntityCombobox,
  useProjectOptions,
  useUserOptions,
  type ComboboxOption,
} from '@/components/features/shared-pickers';
import { tomorrowUtcDate } from './api-key-format';

export function Field({
  id,
  label,
  optional = false,
  helper,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  helper?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-foreground"
      >
        {label}
        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </label>
      {children}
      {helper && <p className="m-0 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function OwnerPicker({
  id,
  value,
  onChange,
  disabled,
  ariaLabel,
  placeholder = 'Choose a user',
  clearable = false,
}: {
  id: string;
  value: ComboboxOption | null;
  onChange: (option: ComboboxOption | null) => void;
  disabled?: boolean;
  /** Needed when no `<label htmlFor={id}>` names the picker. */
  ariaLabel?: string;
  placeholder?: string;
  clearable?: boolean;
}): React.JSX.Element {
  // Load users the first time the picker opens, not on every page view.
  const [opened, setOpened] = useState(false);
  const users = useUserOptions(opened && !disabled);
  const { search } = users;
  const handleSearch = useCallback(
    (query: string) => {
      setOpened(true);
      search(query);
    },
    [search]
  );
  return (
    <EntityCombobox
      id={id}
      value={value?.value ?? ''}
      selectedLabel={value?.label}
      options={users.options}
      onChange={onChange}
      onSearchChange={handleSearch}
      isLoading={users.isLoading}
      error={users.error}
      placeholder={placeholder}
      searchPlaceholder="Search by username or email"
      emptyText="No users match"
      disabled={disabled}
      aria-label={ariaLabel}
      clearable={clearable}
    />
  );
}

export function ProjectPicker({
  id,
  value,
  onChange,
  disabled,
  placeholder = 'Choose a project',
}: {
  id: string;
  value: string;
  onChange: (option: ComboboxOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
}): React.JSX.Element {
  const projects = useProjectOptions();
  return (
    <EntityCombobox
      id={id}
      value={value}
      options={projects.options}
      onChange={onChange}
      isLoading={projects.isLoading}
      error={projects.error}
      placeholder={placeholder}
      searchPlaceholder="Search projects"
      emptyText={projects.isLoading ? 'Loading projects…' : 'No projects match'}
      disabled={disabled}
    />
  );
}

export function ExpiryDateInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}): React.JSX.Element {
  return (
    <Input
      id={id}
      type="date"
      value={value}
      min={tomorrowUtcDate()}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="h-8 w-48 text-[13px]"
    />
  );
}

export function FormError({
  message,
}: {
  message: string | null;
}): React.JSX.Element | null {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="m-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
    >
      {message}
    </p>
  );
}
