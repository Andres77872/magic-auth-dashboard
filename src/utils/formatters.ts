/**
 * Shared formatting helpers. Every date helper accepts the nullable ISO strings
 * the API returns and renders a placeholder instead of "Invalid Date".
 */

type DateInput = string | number | Date | null | undefined;

/**
 * api.auth serialises MySQL DATETIME values (stored in UTC) without a zone
 * designator on several routes (audit logs, API keys, billing). Mark them as
 * UTC so browsers don't read them as local time. Zoned values pass through.
 */
export function asUtcTimestamp(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const hasTime = /\d[T ]\d/.test(value);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return hasTime && !hasZone ? `${value.replace(' ', 'T')}Z` : value;
}

const EMPTY = '—';

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Mar 4, 2026" */
export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  fallback = EMPTY
): string {
  const date = toDate(value);
  return date ? date.toLocaleDateString('en-US', options) : fallback;
}

/** "Mar 4, 2026, 09:41 AM" */
export function formatDateTime(value: DateInput, fallback = EMPTY): string {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Compact relative time for lists: "just now", "5m ago", "3h ago", "2d ago",
 * then an absolute short date once the value is older than a month.
 */
export function formatRelativeTime(value: DateInput, fallback = EMPTY): string {
  const date = toDate(value);
  if (!date) return fallback;

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 0) {
    // Future timestamps (expiry dates) read better as absolute dates.
    return formatDate(date);
  }
  if (diffSeconds < 45) return 'just now';

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return formatDate(
    date,
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' }
  );
}

/** Thousands separators: 12,480 */
export function formatNumber(
  value: number | null | undefined,
  fallback = EMPTY
): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return fallback;
  return new Intl.NumberFormat('en-US').format(value);
}

/** Percentage with at most one decimal: 97.6% */
export function formatPercent(
  value: number | null | undefined,
  fallback = EMPTY
): string {
  if (value === null || value === undefined || Number.isNaN(value))
    return fallback;
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

/** "5 members", "1 project" */
export function formatCount(
  count: number,
  singular: string,
  plural?: string
): string {
  return `${formatNumber(count)} ${pluralize(count, singular, plural)}`;
}

/** Middle-ellipsis for opaque identifiers: usr-9e37…0001 */
export function truncateHash(
  hash: string,
  options?: { startChars?: number; endChars?: number }
): string {
  const startChars = options?.startChars ?? 8;
  const endChars = options?.endChars ?? 8;
  if (hash.length <= startChars + endChars + 3) return hash;
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}
