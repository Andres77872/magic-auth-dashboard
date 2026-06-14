/**
 * VariableInsertMenu
 *
 * Insert-at-caret menu for the server-defined placeholder allowlist. Admins pick
 * from known variables instead of free-typing, so typos / unknown placeholders
 * can't be introduced. Required variables are marked.
 */

import React from 'react';

interface VariableInsertMenuProps {
  variables: string[];
  required: string[];
  onInsert: (token: string) => void;
  disabled?: boolean;
}

export function VariableInsertMenu({
  variables,
  required,
  onInsert,
  disabled,
}: VariableInsertMenuProps): React.JSX.Element {
  const requiredSet = new Set(required);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Insert:</span>
      {variables.map((name) => {
        const isRequired = requiredSet.has(name);
        return (
          <button
            key={name}
            type="button"
            disabled={disabled}
            onClick={() => onInsert('$' + name)}
            title={isRequired ? `$${name} (required)` : `$${name}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            ${name}
            {isRequired && <span className="text-[10px] font-semibold text-primary">•</span>}
          </button>
        );
      })}
    </div>
  );
}

export default VariableInsertMenu;
