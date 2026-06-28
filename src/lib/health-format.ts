/**
 * Pure formatting helpers for the system health monitor.
 *
 * Heuristics are keyed on field-name suffixes so they also apply to unknown /
 * future fields returned by `GET /system/health` — nothing needs to be
 * hardcoded per field, and nothing is ever silently dropped.
 */

import { formatRelativeTime, formatNumber } from '@/utils/formatters';

/** Tokens that should render fully uppercased rather than Title Cased. */
const ACRONYMS = new Set([
  'id',
  'dlq',
  's2s',
  'sdk',
  'api',
  'url',
  'ms',
  'ttl',
  'jwt',
]);

/** `snake_case` / `camelCase` → "Title Case", preserving known acronyms. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // split camelCase
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

/** Format a duration in seconds into a compact human string. `null`/NaN → "None". */
export function formatDuration(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'None';
  if (value < 60) return `${value}s`;
  if (value < 3600) return `${Math.round(value / 60)}m`;
  if (value < 86400) return `${Math.round(value / 3600)}h`;
  return `${Math.round(value / 86400)}d`;
}

function looksLikeTimestamp(key: string): boolean {
  return /(_at|_check|_heartbeat|timestamp)$/.test(key);
}

/**
 * Format a single scalar health value for display. Falls back to a readable
 * string for any type so callers never crash on unexpected payloads.
 */
export function formatHealthValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—';

  if (typeof value === 'boolean') return value ? '✓' : '✗';

  if (typeof value === 'number') {
    if (/(_seconds|_age_seconds)$/.test(key)) return formatDuration(value);
    if (/ratio$/.test(key)) return `${(value * 100).toFixed(1)}%`;
    if (/_ms$/.test(key)) {
      return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(2)}s`;
    }
    return formatNumber(value);
  }

  if (typeof value === 'string') {
    if (looksLikeTimestamp(key) && !Number.isNaN(Date.parse(value))) {
      return formatRelativeTime(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (!value.length) return 'None';
    return value.map((item) => safeString(item)).join(', ');
  }

  return safeString(value);
}

/** Stringify any value without tripping on the default `[object Object]`. */
function safeString(value: unknown): string {
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/** Safe accessors for walking the loosely-typed health payload. */
export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
