/**
 * Labels, badge tones and prerequisite mapping for billing statuses, shared by
 * the billing list and detail views.
 */

import type { BadgeProps } from '@/components/ui/badge';
import { ApiError } from '@/utils/error-handler';
import type { BillingCapability, CatalogItem } from '@/types/billing.types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

interface StatusDisplay {
  label: string;
  variant: BadgeVariant;
}

function humanize(value: string): string {
  const text = value.replace(/_/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const GROUP_STATUS: Record<string, StatusDisplay> = {
  active: { label: 'Active', variant: 'success' },
  suspended: { label: 'Suspended', variant: 'warning' },
  archived: { label: 'Archived', variant: 'secondary' },
};

const CREDENTIAL_STATUS: Record<string, StatusDisplay> = {
  active: { label: 'Connected', variant: 'success' },
  rotating: { label: 'Rotating', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'destructive' },
  absent: { label: 'Not connected', variant: 'secondary' },
};

const PROVISIONING_STATUS: Record<string, StatusDisplay> = {
  active: { label: 'Live', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'destructive' },
  archived: { label: 'Archived', variant: 'secondary' },
};

const SYNC_STATUS: Record<string, StatusDisplay> = {
  never: { label: 'Never synced', variant: 'secondary' },
  ok: { label: 'In sync', variant: 'success' },
  drift: { label: 'Drift', variant: 'warning' },
  error: { label: 'Sync error', variant: 'destructive' },
};

function lookup(
  table: Record<string, StatusDisplay>,
  status: string | null | undefined
): StatusDisplay {
  if (!status) return { label: 'Unknown', variant: 'secondary' };
  return table[status] ?? { label: humanize(status), variant: 'secondary' };
}

export const groupStatus = (status?: string | null): StatusDisplay =>
  lookup(GROUP_STATUS, status);
export const credentialStatus = (status?: string | null): StatusDisplay =>
  lookup(CREDENTIAL_STATUS, status);
export const provisioningStatus = (status?: string | null): StatusDisplay =>
  lookup(PROVISIONING_STATUS, status);
export const catalogSyncStatus = (status?: string | null): StatusDisplay =>
  lookup(SYNC_STATUS, status);

export const ITEM_TYPE_LABEL: Record<string, string> = {
  subscription_plan: 'Subscription plan',
  credit_package: 'Credit package',
};

/** Readiness codes from `_capability_missing_reasons` (admin_billing.py). */
const READINESS_LABEL: Record<string, string> = {
  BILLING_ENABLED: 'Billing is turned off on the server (BILLING_ENABLED)',
  STRIPE_BILLING_ENABLED:
    'Stripe billing is turned off on the server (STRIPE_BILLING_ENABLED)',
  BILLING_CHECKOUT_ENABLED:
    'Checkout is turned off on the server (BILLING_CHECKOUT_ENABLED)',
  STRIPE_CHECKOUT_ENABLED:
    'Stripe Checkout is turned off on the server (STRIPE_CHECKOUT_ENABLED)',
  BILLING_PORTAL_ENABLED:
    'The customer portal is turned off on the server (BILLING_PORTAL_ENABLED)',
  STRIPE_PORTAL_ENABLED:
    'The Stripe portal is turned off on the server (STRIPE_PORTAL_ENABLED)',
  STRIPE_WEBHOOKS_ENABLED:
    'Stripe webhooks are turned off on the server (STRIPE_WEBHOOKS_ENABLED)',
  billing_group_active: 'The group must be active',
  billing_group_credentials_active: 'Stripe credentials must be connected',
  stripe_secret_key: 'A Stripe secret key is required',
  active_catalog_price: 'At least one live catalog price is required',
  stripe_portal_configuration_id: 'A Stripe portal configuration is required',
  stripe_webhook_secret: 'A Stripe webhook signing secret is required',
};

export function readinessLabel(code: string): string {
  return READINESS_LABEL[code] ?? humanize(code);
}

const COMMON_PREREQUISITES = [
  'BILLING_ENABLED',
  'STRIPE_BILLING_ENABLED',
  'billing_group_active',
  'billing_group_credentials_active',
];

/** What must be in place before a capability can be switched ON (admin_billing.py `update_capabilities`). */
export const CAPABILITY_PREREQUISITES: Record<BillingCapability, string[]> = {
  checkout: [
    ...COMMON_PREREQUISITES,
    'BILLING_CHECKOUT_ENABLED',
    'STRIPE_CHECKOUT_ENABLED',
    'stripe_secret_key',
    'active_catalog_price',
  ],
  portal: [
    ...COMMON_PREREQUISITES,
    'BILLING_PORTAL_ENABLED',
    'STRIPE_PORTAL_ENABLED',
    'stripe_secret_key',
    'stripe_portal_configuration_id',
  ],
  webhooks: [
    ...COMMON_PREREQUISITES,
    'STRIPE_WEBHOOKS_ENABLED',
    'stripe_secret_key',
    'stripe_webhook_secret',
  ],
  provisioning: COMMON_PREREQUISITES,
};

/** Missing prerequisites (from readiness) that block turning `capability` on. */
export function missingFor(
  capability: BillingCapability,
  missing: string[]
): string[] {
  return CAPABILITY_PREREQUISITES[capability].filter((code) =>
    missing.includes(code)
  );
}

/** Amount in the currency's minor unit, formatted (e.g. 999 usd → $9.99). */
export function formatMoney(
  amount?: number | null,
  currency?: string | null
): string {
  if (amount === null || amount === undefined) return '—';
  const code = (currency || 'usd').toUpperCase();
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    });
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
    return formatter.format(amount / 10 ** digits);
  } catch {
    return `${amount} ${code}`;
  }
}

export function formatPrice(
  item: Pick<
    CatalogItem,
    'unit_amount' | 'currency' | 'recurring_interval' | 'item_type'
  >
): string {
  const money = formatMoney(item.unit_amount, item.currency);
  if (money === '—') return money;
  return item.item_type === 'subscription_plan' && item.recurring_interval
    ? `${money} / ${item.recurring_interval}`
    : money;
}

/**
 * True when attaching failed because the project already belongs to another
 * billing group. api.auth answers 409 (`CONF_*`) for that, and also reports any
 * other database failure of the attach as 409.
 */
export function isAttachConflict(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409;
}
