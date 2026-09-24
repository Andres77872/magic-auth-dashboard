/**
 * Operator-facing messages for resync outcomes.
 */

import type { PatreonResyncResult } from '@/types/patreon.types';
import { ApiError } from '@/utils/error-handler';

export type ResyncToastVariant = 'success' | 'warning' | 'info' | 'error';

/** Operator-facing toast for a resync decision; `accepted: false` is not an error. */
export function describeResyncResult(result: PatreonResyncResult): {
  message: string;
  variant: ResyncToastVariant;
} {
  if (result.accepted) {
    return {
      message:
        result.message && /already queued|merged/i.test(result.message)
          ? 'A matching resync was already queued; your request was merged into it.'
          : 'Resync queued. It runs the next time the sync worker picks up jobs.',
      variant: 'success',
    };
  }
  if (result.status === 'not_linked') {
    return {
      message:
        'This user has no linked Patreon membership, so there is nothing to resync.',
      variant: 'info',
    };
  }
  if (result.status === 'disabled') {
    return {
      message:
        'Patreon sync is turned off (PATREON_SYNC_ENABLED), so nothing was queued.',
      variant: 'warning',
    };
  }
  return {
    message: result.message || `Resync not queued (${result.status}).`,
    variant: 'warning',
  };
}

/** Readable message for a failed resync request (rate limit, unknown user, …). */
export function describeResyncError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return err.retryAfterSeconds
        ? `Resync limit reached. Try again in ${err.retryAfterSeconds}s.`
        : 'Resync limit reached. Try again shortly.';
    }
    if (err.status === 404) return 'No active user has this user hash.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Failed to queue the resync.';
}
