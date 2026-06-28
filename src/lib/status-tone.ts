/**
 * Shared status tone helpers.
 *
 * Pure mapping from a status string to a color tone + Tailwind classes, used for
 * consistent, color-coded status badges across the dashboard (Patreon views,
 * system health monitor, etc.). New backend statuses degrade gracefully to
 * `muted` instead of throwing or rendering misleading colors.
 */

export type StatusTone = 'success' | 'warning' | 'destructive' | 'muted' | 'info';

export function statusTone(status?: string): StatusTone {
  switch (String(status || '').toLowerCase()) {
    case 'healthy':
    case 'ready':
    case 'configured':
    case 'completed':
    case 'active':
    case 'linked':
    case 'processed':
      return 'success';
    case 'disabled':
    case 'free':
    case 'none':
    case 'ignored':
      return 'muted';
    case 'degraded':
    case 'stale':
    case 'retrying':
    case 'retry':
    case 'not_ready':
    case 'unknown':
    case 'pending':
    case 'running':
    case 'former':
    case 'replay':
    case 'warning':
      return 'warning';
    case 'unhealthy':
    case 'critical':
    case 'failed':
    case 'revoked':
    case 'rejected':
    case 'cancelled':
      return 'destructive';
    default:
      return 'muted';
  }
}

export function toneClasses(tone: StatusTone): string {
  if (tone === 'success') return 'border-success/30 bg-success/10 text-success';
  if (tone === 'warning') return 'border-warning/30 bg-warning/10 text-warning';
  if (tone === 'destructive') return 'border-destructive/30 bg-destructive/10 text-destructive';
  if (tone === 'info') return 'border-info/30 bg-info/10 text-info';
  return 'border-border bg-muted text-muted-foreground';
}

/** Severity ordering used to roll several component statuses up to the worst. */
const TONE_SEVERITY: Record<StatusTone, number> = {
  destructive: 4,
  warning: 3,
  info: 2,
  muted: 1,
  success: 0,
};

/**
 * Roll a set of statuses up to the most severe one (by tone), returning the
 * original status string so a real label is shown. Ignores empty values.
 */
export function rollupStatus(statuses: Array<string | undefined>): string | undefined {
  let worst: string | undefined;
  let worstRank = -1;
  for (const status of statuses) {
    if (!status) continue;
    const rank = TONE_SEVERITY[statusTone(status)];
    if (rank > worstRank) {
      worstRank = rank;
      worst = status;
    }
  }
  return worst;
}
