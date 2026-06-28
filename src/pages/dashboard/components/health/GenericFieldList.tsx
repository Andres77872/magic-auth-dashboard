/**
 * GenericFieldList — recursive fallback renderer for an arbitrary health object.
 *
 * Walks every entry and renders it: scalars as key/value rows, arrays as chip
 * lists (or nested cards for arrays of objects), and nested objects as
 * collapsible sub-groups. This guarantees that no field returned by
 * `GET /system/health` is ever silently dropped, regardless of nesting depth or
 * unknown future shapes.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { humanizeKey, formatHealthValue } from '@/lib/health-format';
import type { StatusTone } from '@/lib/status-tone';
import { ChipList } from './ChipList';
import { HealthStatusBadge } from './HealthStatusBadge';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Pick a chip tone for a scalar array based on its field name. */
function arrayTone(fieldKey: string): StatusTone {
  if (/(critical|mismatch)/i.test(fieldKey)) return 'destructive';
  if (/(missing|degraded|error|fail)/i.test(fieldKey)) return 'warning';
  return 'muted';
}

function FieldRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className="max-w-[60%] truncate text-right font-medium text-foreground"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function NestedGroup({
  title,
  status,
  defaultOpen,
  children,
}: {
  title: string;
  status?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-md border border-border/60 bg-muted/20"
    >
      <CollapsibleTrigger className="px-3 py-2">
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
        <span className="text-xs font-semibold text-foreground">{title}</span>
        {status && <HealthStatusBadge status={status} className="ml-auto" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border/60 px-3 py-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ArrayField({
  fieldKey,
  items,
  depth,
}: {
  fieldKey: string;
  items: unknown[];
  depth: number;
}): React.JSX.Element {
  // Array of objects → nested cards (e.g. email_worker.workers).
  if (items.some((item) => isPlainObject(item))) {
    return (
      <NestedGroup title={`${humanizeKey(fieldKey)} (${items.length})`} defaultOpen={depth < 1}>
        <div className="space-y-2">
          {items.map((item, index) => {
            const obj = isPlainObject(item) ? item : { value: item };
            const itemLabel =
              (typeof obj.worker_id === 'string' && obj.worker_id) ||
              (typeof obj.id === 'string' && obj.id) ||
              `#${index + 1}`;
            return (
              <div
                key={itemLabel}
                className="rounded-md border border-border/60 bg-card p-2"
              >
                <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
                  {itemLabel}
                </p>
                <GenericFieldList data={obj} depth={depth + 1} />
              </div>
            );
          })}
        </div>
      </NestedGroup>
    );
  }

  // Array of scalars → chips.
  return (
    <div className="space-y-1">
      <span className="text-muted-foreground">{humanizeKey(fieldKey)}</span>
      <ChipList items={items} tone={arrayTone(fieldKey)} />
    </div>
  );
}

export function GenericFieldList({
  data,
  depth = 0,
}: {
  data: Record<string, unknown>;
  depth?: number;
}): React.JSX.Element {
  const entries = Object.entries(data);
  const scalars = entries.filter(
    ([, value]) => value === null || typeof value !== 'object'
  );
  const arrays = entries.filter(([, value]) => Array.isArray(value));
  const objects = entries.filter(([, value]) => isPlainObject(value));

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No data reported.</p>;
  }

  return (
    <div className="space-y-1.5 text-sm">
      {scalars.map(([key, value]) => (
        <FieldRow key={key} label={humanizeKey(key)} value={formatHealthValue(key, value)} />
      ))}

      {arrays.map(([key, value]) => (
        <ArrayField key={key} fieldKey={key} items={value as unknown[]} depth={depth} />
      ))}

      {objects.map(([key, value]) => {
        const obj = value as Record<string, unknown>;
        const status = typeof obj.status === 'string' ? obj.status : undefined;
        return (
          <NestedGroup
            key={key}
            title={humanizeKey(key)}
            status={status}
            defaultOpen={depth < 1}
          >
            <GenericFieldList data={obj} depth={depth + 1} />
          </NestedGroup>
        );
      })}
    </div>
  );
}

export default GenericFieldList;
