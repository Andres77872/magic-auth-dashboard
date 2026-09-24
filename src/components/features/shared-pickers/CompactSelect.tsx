/** Compact (32px) selects used in toolbars and dense forms. */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/** Compact select with an "all" option mapped to `undefined`. */
export function OptionalSelect<T extends string>({
  value,
  onChange,
  options,
  allLabel,
  ariaLabel,
  className,
}: {
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options: SelectOption<T>[];
  allLabel: string;
  ariaLabel: string;
  className?: string;
}): React.JSX.Element {
  return (
    <Select
      value={value ?? '__all'}
      onValueChange={(next) =>
        onChange(next === '__all' ? undefined : (next as T))
      }
    >
      <SelectTrigger
        className={cn('h-8 w-[150px] text-[13px]', className)}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Compact select with a required value. */
export function ValueSelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  ariaLabel: string;
  className?: string;
}): React.JSX.Element {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger
        className={cn('h-8 w-[150px] text-[13px]', className)}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
