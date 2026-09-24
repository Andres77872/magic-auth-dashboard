import type { SecuritySeverity } from '@/types/audit.types';

export type AuditBadgeVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'secondary';

/** Look-back windows offered by every audit view (the API accepts 1–365 days). */
export const DAY_OPTIONS = [
  { value: 1, label: 'Last 24 hours' },
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
] as const;

export const SEVERITY_BADGE: Record<
  SecuritySeverity,
  { label: string; variant: AuditBadgeVariant }
> = {
  critical: { label: 'Critical', variant: 'destructive' },
  warning: { label: 'Warning', variant: 'warning' },
  info: { label: 'Info', variant: 'info' },
};

/** Badge tone for an HTTP status code. */
export function statusCodeVariant(
  status: number | null | undefined
): AuditBadgeVariant {
  if (status === null || status === undefined) return 'secondary';
  if (status >= 500) return 'destructive';
  if (status >= 400) return 'warning';
  if (status >= 200 && status < 300) return 'success';
  return 'secondary';
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)} s`;
  return `${Math.round(ms)} ms`;
}

/** Pretty-print a free-form `details`/`metadata` value, parsing JSON text when possible. */
export function formatStructured(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    const text = value.trim();
    if (text.startsWith('{') || text.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(text) as unknown, null, 2);
      } catch {
        return text;
      }
    }
    return text;
  }
  if (typeof value === 'object') {
    const isEmpty = Array.isArray(value)
      ? value.length === 0
      : Object.keys(value).length === 0;
    return isEmpty ? null : JSON.stringify(value, null, 2);
  }
  return typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : null;
}

/** Humanise a code such as `permission_denied` or `AUTH_1008`. */
export function humanizeCode(code: string): string {
  if (/^[A-Z]+_\d+$/.test(code)) return code;
  const text = code.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
