/**
 * Readiness panel — the single answer to "why is the sign-in button not working?".
 *
 * The effective state is an AND across the deployment switch, the provider catalog,
 * the running backend's adapters, the connection, its credentials, the binding and
 * its URL allow-lists. api.auth computes that roll-up; this renders one row per
 * check with the server's own failure message, so the UI never invents a second
 * (and divergent) definition of "ready".
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OAuthReadinessCheck } from '@/types/oauth.types';
import { readinessCheckLabel } from './oauth-status';

export interface OAuthReadinessPanelProps {
  checks: OAuthReadinessCheck[];
  /** Server-computed roll-up. Falls back to "every check passed" when omitted. */
  ready?: boolean;
  title?: string;
  /** Hide passing rows so only the blocking layers remain. */
  failuresOnly?: boolean;
  className?: string;
}

export function OAuthReadinessPanel({
  checks,
  ready,
  title = 'Readiness',
  failuresOnly = false,
  className,
}: OAuthReadinessPanelProps): React.JSX.Element {
  const failures = checks.filter((check) => !check.ok);
  const isReady = ready ?? failures.length === 0;
  const visible = failuresOnly ? failures : checks;

  return (
    <div className={cn('rounded-md border border-border p-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {isReady ? (
          <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
        )}
        <span className="font-medium">{title}</span>
        <Badge variant={isReady ? 'success' : 'warning'}>{isReady ? 'ready' : 'not ready'}</Badge>
        {!isReady && (
          <span className="text-xs text-muted-foreground">
            {failures.length} check{failures.length === 1 ? '' : 's'} failing
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {failuresOnly ? 'Every readiness check passes.' : 'No readiness checks were returned.'}
        </p>
      ) : (
        <ul className="mt-3 space-y-2" aria-label={`${title} checks`}>
          {visible.map((check) => (
            <li key={check.check} className="flex items-start gap-2 text-sm">
              {check.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <div className={cn('font-medium', check.ok && 'text-muted-foreground')}>
                  {readinessCheckLabel(check.check)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {check.ok ? 'OK' : check.message || 'This layer is blocking sign-in.'}
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
