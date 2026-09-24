/**
 * VariableInsertMenu
 *
 * Insert-at-caret chips for the server-defined placeholder allowlist, so
 * admins pick known variables instead of free-typing them. Required variables
 * are labelled in text, not only by colour.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface VariableInsertMenuProps {
  variables: string[];
  required: string[];
  onInsert: (token: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VariableInsertMenu({
  variables,
  required,
  onInsert,
  disabled,
  className,
}: VariableInsertMenuProps): React.JSX.Element {
  const requiredSet = new Set(required);

  if (variables.length === 0) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        This template has no variables.
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-label="Insert variable"
      className={cn('flex flex-wrap items-center gap-1.5', className)}
    >
      <span className="mr-0.5 text-xs text-muted-foreground" aria-hidden="true">
        Insert
      </span>
      {variables.map((name) => {
        const isRequired = requiredSet.has(name);
        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => onInsert(`$${name}`)}
            aria-label={`Insert $${name}${isRequired ? ' (required)' : ''}`}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-sm border px-1.5 font-mono text-[11px] text-foreground transition-colors',
              'hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isRequired
                ? 'border-primary/40 bg-primary-subtle'
                : 'border-border bg-secondary/60'
            )}
          >
            ${name}
            {isRequired && (
              <span
                className="font-sans text-[10px] text-primary-subtle-foreground"
                aria-hidden="true"
              >
                required
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default VariableInsertMenu;
