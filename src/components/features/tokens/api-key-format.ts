import type { ApiKey } from '@/types/api-key.types';

/** Recognisable, non-secret hint of the token: `sk_<public id>.…<last 4>`. */
export function apiKeyHint(
  key: Pick<ApiKey, 'public_id' | 'secret_last4'>
): string {
  return `sk_${key.public_id}.…${key.secret_last4}`;
}

/** `YYYY-MM-DD` for tomorrow (UTC), the earliest expiry the API accepts from a date picker. */
export function tomorrowUtcDate(now = new Date()): string {
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.toISOString().slice(0, 10);
}

/** A picked `YYYY-MM-DD` as the ISO instant the key stops working (00:00 UTC that day). */
export function expiryDateToIso(date: string): string {
  return `${date}T00:00:00Z`;
}

/** The `YYYY-MM-DD` (UTC) of an ISO timestamp, for prefilling a date input. */
export function isoToUtcDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

/**
 * Only keys that still authenticate can be revoked: the backend answers
 * `400 AUTH_1012` for revoked keys and for keys deactivated after expiring.
 */
export function canRevoke(
  key: Pick<ApiKey, 'is_active' | 'revoked_at'>
): boolean {
  return key.is_active && !key.revoked_at;
}
