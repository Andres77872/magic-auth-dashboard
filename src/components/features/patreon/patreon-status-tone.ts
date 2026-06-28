/**
 * Shared Patreon status tone helpers.
 *
 * The canonical implementation now lives in `@/lib/status-tone` so it can be
 * shared across the dashboard (system health monitor, etc.). This module is kept
 * as a re-export so existing Patreon imports continue to work unchanged.
 */

export { statusTone, toneClasses } from '@/lib/status-tone';
export type { StatusTone } from '@/lib/status-tone';
