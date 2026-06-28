/**
 * Semantic Badge variant mappings for billing statuses (Meridian quiet-tint pills).
 * Keeps status colors consistent across the billing list and detail pages.
 */

import type { BadgeProps } from '@/components/ui/badge';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export function groupStatusVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'warning';
    case 'archived':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function credentialVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'rotating':
      return 'warning';
    case 'revoked':
      return 'destructive';
    case 'absent':
    default:
      return 'secondary';
  }
}

export function provisioningVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'failed':
      return 'destructive';
    case 'pending':
      return 'warning';
    case 'archived':
    default:
      return 'secondary';
  }
}

/**
 * True when an attach failure is a "project already in another billing group" conflict.
 *
 * api.auth raises this as HTTP 409 with the canonical message below, but our apiClient
 * (see api.client.ts `handleResponse`) drops the status code into the `default` branch and
 * re-throws a plain `Error(message)` — so the HTTP status is unavailable downstream and the
 * message is the only signal we get. We therefore match the phrase (not the whole sentence) so
 * minor backend wording changes degrade gracefully to a generic failure rather than break.
 */
export function isAttachConflict(err: unknown): boolean {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  return /already attached to another billing group/i.test(message);
}
