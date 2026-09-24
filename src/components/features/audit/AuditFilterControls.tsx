/** Small filter controls shared by the audit tabs. */

import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DAY_OPTIONS } from './audit-format';

export {
  OptionalSelect,
  ValueSelect,
  type SelectOption,
} from '@/components/features/shared-pickers/CompactSelect';

export function DaysSelect({
  value,
  onChange,
  id,
}: {
  value: number;
  onChange: (days: number) => void;
  id?: string;
}): React.JSX.Element {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger
        id={id}
        className="h-8 w-[150px] text-[13px]"
        aria-label="Time range"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DAY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Removable chip for a filter that has no visible control (e.g. "user: alice"). */
export function FilterChip({
  label,
  value,
  onRemove,
}: {
  label: string;
  value: string;
  onRemove: () => void;
}): React.JSX.Element {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-secondary/60 pl-2.5 pr-1 text-xs text-foreground">
      <span className="text-muted-foreground">{label}:</span>
      <span className="max-w-[160px] truncate font-medium">{value}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        aria-label={`Remove ${label.toLowerCase()} filter`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}

export function RefreshButton({
  onClick,
  refreshing,
  label,
}: {
  onClick: () => void;
  refreshing: boolean;
  label: string;
}): React.JSX.Element {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="h-8 w-8"
      onClick={onClick}
      disabled={refreshing}
      aria-label={label}
      title={label}
    >
      <RefreshCw
        className={cn(refreshing && 'animate-spin')}
        aria-hidden="true"
      />
    </Button>
  );
}
