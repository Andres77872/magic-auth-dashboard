/**
 * Readiness — the single answer to "why is the sign-in button not working?".
 *
 * The effective state is an AND across the deployment switch, the provider catalog,
 * the running backend's adapters, the connection, its credentials, the binding and
 * its URL allow-lists. api.auth computes that roll-up; this renders the server's own
 * checks and failure messages, so the UI never invents a second definition of "ready".
 * Failing checks are shown first; passing ones are one click away.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OAuthReadinessCheck } from '@/types/oauth.types';
import { readinessCheckLabel } from './oauth-status';

export interface OAuthReadinessPanelProps {
  checks: OAuthReadinessCheck[];
  /** Server-computed roll-up. Falls back to "every check passed" when omitted. */
  ready?: boolean;
  title?: string;
  /** Show passing checks too without the toggle. */
  defaultExpanded?: boolean;
  className?: string;
}

export function OAuthReadinessPanel({
  checks,
  ready,
  title = 'Readiness',
  defaultExpanded = false,
  className,
}: OAuthReadinessPanelProps): React.JSX.Element {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const listId = React.useId();
  const failures = checks.filter((check) => !check.ok);
  const isReady = ready ?? failures.length === 0;
  const visible = expanded ? checks : failures;
  const canToggle = checks.length > failures.length;

  return (
    <div className={cn('rounded-md border border-border', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-foreground">
            {title}
          </span>
          <Badge variant={isReady ? 'success' : 'warning'} size="sm">
            {isReady ? 'Ready' : 'Not ready'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {checks.length === 0
              ? 'No checks reported'
              : failures.length === 0
                ? `All ${checks.length} checks pass`
                : `${failures.length} of ${checks.length} checks failing`}
          </span>
        </div>
        {canToggle && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-controls={visible.length > 0 ? listId : undefined}
          >
            {expanded ? 'Show failing checks only' : 'Show all checks'}
          </Button>
        )}
      </div>

      {visible.length > 0 && (
        <ul
          id={listId}
          className="m-0 list-none divide-y divide-border border-t border-border p-0"
          aria-label={`${title} checks`}
        >
          {visible.map((check) => (
            <li
              key={check.check}
              className="flex items-start gap-2.5 px-3 py-2"
            >
              {check.ok ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-success"
                  aria-hidden="true"
                />
              ) : (
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <div
                  className={cn(
                    'text-[13px] font-medium',
                    check.ok ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {readinessCheckLabel(check.check)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {check.ok
                    ? 'Passes'
                    : check.message || 'This layer is blocking sign-in.'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default OAuthReadinessPanel;
