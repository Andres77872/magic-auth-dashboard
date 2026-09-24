/**
 * Create or edit a catalog item (subscription plan / credit package).
 *
 * Items are read as `unit_amount` and written as `amount_cents` (minor units).
 * On edit only changed fields are sent: sending any price field — even with
 * the same value — rotates the Stripe price, so price fields go out only when
 * they actually change. `item_type`, `plan_code`, `tier_code` and
 * `lookup_key` can't be changed after creation.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import type {
  CatalogItem,
  CatalogItemCreateRequest,
  CatalogItemType,
  CatalogItemUpdateRequest,
} from '@/types/billing.types';
import { ValueSelect } from '@/components/features/shared-pickers';
import { formatMoney } from './billing-status';
import { useCatalogMutations } from './useBilling';

export interface BillingCatalogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (item: CatalogItem) => void;
  groupHash: string;
  /** Present = edit mode. */
  item?: CatalogItem | null;
}

const INTERVALS = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
  { value: 'week', label: 'Weekly' },
  { value: 'day', label: 'Daily' },
] as const;
type Interval = (typeof INTERVALS)[number]['value'];

interface FormState {
  itemType: CatalogItemType;
  planCode: string;
  displayName: string;
  tierCode: string;
  tierName: string;
  amount: string;
  currency: string;
  interval: Interval;
  lookupKey: string;
  features: string;
  metadata: string;
  sortOrder: string;
}

function isInterval(value: string | null | undefined): value is Interval {
  return INTERVALS.some((interval) => interval.value === value);
}

function jsonText(value: Record<string, unknown> | undefined): string {
  return value && Object.keys(value).length > 0
    ? JSON.stringify(value, null, 2)
    : '';
}

function initialForm(item?: CatalogItem | null): FormState {
  return {
    itemType: item?.item_type ?? 'subscription_plan',
    planCode: item?.plan_code ?? '',
    displayName: item?.display_name ?? '',
    tierCode: item?.tier_code ?? '',
    tierName: item?.tier_name ?? '',
    amount:
      item?.unit_amount !== null && item?.unit_amount !== undefined
        ? String(item.unit_amount)
        : '',
    currency: item?.currency ?? 'usd',
    interval: isInterval(item?.recurring_interval)
      ? item.recurring_interval
      : 'month',
    lookupKey: item?.lookup_key ?? '',
    features: jsonText(item?.features),
    metadata: jsonText(item?.metadata),
    sortOrder: String(item?.sort_order ?? 0),
  };
}

/** Normalised JSON object text, `undefined` when empty; throws a readable error otherwise. */
function jsonObject(raw: string, field: string): string | undefined {
  if (!raw.trim()) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${field} must be valid JSON.`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${field} must be a JSON object.`);
  }
  return JSON.stringify(parsed);
}

function Field({
  id,
  label,
  helper,
  children,
  wide = false,
}: {
  id: string;
  label: string;
  helper?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}): React.JSX.Element {
  return (
    <div className={wide ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
      <label
        htmlFor={id}
        className="block text-[13px] font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {helper && <p className="m-0 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

export function BillingCatalogItemModal({
  isOpen,
  onClose,
  onSaved,
  groupHash,
  item,
}: BillingCatalogItemModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const { createItem, updateItem, pending } = useCatalogMutations(groupHash);
  const isEdit = Boolean(item);
  const [form, setForm] = useState<FormState>(() => initialForm(item));
  const [error, setError] = useState<string | null>(null);
  const saving = pending === 'save';

  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const openKey = isOpen ? (item?.item_hash ?? 'new') : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (openKey) {
      setForm(initialForm(item));
      setError(null);
    }
  }

  const update = (patch: Partial<FormState>): void =>
    setForm((current) => ({ ...current, ...patch }));
  const isSubscription = form.itemType === 'subscription_plan';
  const amountNumber = form.amount.trim() ? Number(form.amount) : undefined;
  const amountPreview =
    amountNumber !== undefined && Number.isInteger(amountNumber)
      ? formatMoney(amountNumber, form.currency)
      : null;

  const buildCreate = (): CatalogItemCreateRequest => ({
    item_type: form.itemType,
    plan_code: form.planCode.trim(),
    display_name: form.displayName.trim(),
    tier_code: form.tierCode.trim() || undefined,
    tier_name: form.tierName.trim() || undefined,
    amount_cents: amountNumber,
    currency: form.currency.trim().toLowerCase() || undefined,
    recurring_interval: isSubscription ? form.interval : undefined,
    lookup_key: form.lookupKey.trim() || undefined,
    features: jsonObject(form.features, 'Features'),
    metadata: jsonObject(form.metadata, 'Metadata'),
    sort_order: Number(form.sortOrder) || 0,
  });

  const buildUpdate = (original: CatalogItem): CatalogItemUpdateRequest => {
    const request: CatalogItemUpdateRequest = {};
    const initial = initialForm(original);
    if (form.displayName.trim() !== initial.displayName)
      request.display_name = form.displayName.trim();
    if (form.tierName.trim() && form.tierName.trim() !== initial.tierName)
      request.tier_name = form.tierName.trim();
    if (form.amount.trim() !== initial.amount && amountNumber !== undefined)
      request.amount_cents = amountNumber;
    const currency = form.currency.trim().toLowerCase();
    if (currency && currency !== initial.currency) request.currency = currency;
    if (isSubscription && form.interval !== initial.interval)
      request.recurring_interval = form.interval;
    if (form.features.trim() && form.features !== initial.features)
      request.features = jsonObject(form.features, 'Features');
    if (form.metadata.trim() && form.metadata !== initial.metadata)
      request.metadata = jsonObject(form.metadata, 'Metadata');
    if (form.sortOrder !== initial.sortOrder)
      request.sort_order = Number(form.sortOrder) || 0;
    return request;
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!form.displayName.trim()) return setError('Enter a display name.');
    if (!isEdit && !form.planCode.trim()) return setError('Enter a plan code.');
    if (
      amountNumber !== undefined &&
      (!Number.isInteger(amountNumber) || amountNumber < 0)
    ) {
      return setError(
        'Enter the amount as a whole number of minor units (for example 999 for $9.99).'
      );
    }
    if (form.currency.trim() && !/^[a-z]{3}$/i.test(form.currency.trim())) {
      return setError('Use a three-letter currency code such as usd.');
    }
    setError(null);
    try {
      if (item) {
        const request = buildUpdate(item);
        if (Object.keys(request).length === 0)
          return setError('Nothing has changed.');
        const saved = await updateItem(item.item_hash, request);
        showToast(
          request.amount_cents !== undefined ||
            request.currency ||
            request.recurring_interval
            ? `Saved “${saved.display_name}”. The Stripe price was replaced.`
            : `Saved “${saved.display_name}”.`,
          'success'
        );
        onSaved(saved);
      } else {
        const saved = await createItem(buildCreate());
        showToast(
          saved.provisioning_status === 'active'
            ? `Created “${saved.display_name}” and its Stripe price.`
            : saved.provisioning_status === 'failed'
              ? `Created “${saved.display_name}”, but Stripe provisioning failed.`
              : `Created “${saved.display_name}”. It provisions to Stripe once the group allows it.`,
          saved.provisioning_status === 'failed' ? 'warning' : 'success'
        );
        onSaved(saved);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The catalog item could not be saved.'
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit catalog item' : 'Add catalog item'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Type, plan code, tier code and lookup key are fixed. Changing the price, currency or interval replaces the Stripe price.'
              : 'A subscription plan or credit package. It is provisioned in the group’s Stripe account when provisioning is on.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => void save(event)}
          noValidate
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field id="catalog-type" label="Type">
              {isEdit ? (
                <Input
                  id="catalog-type"
                  value={
                    isSubscription ? 'Subscription plan' : 'Credit package'
                  }
                  disabled
                  className="h-8 text-[13px]"
                />
              ) : (
                <ValueSelect<CatalogItemType>
                  value={form.itemType}
                  onChange={(itemType) => update({ itemType })}
                  options={[
                    { value: 'subscription_plan', label: 'Subscription plan' },
                    { value: 'credit_package', label: 'Credit package' },
                  ]}
                  ariaLabel="Type"
                  className="w-full"
                />
              )}
            </Field>
            <Field
              id="catalog-plan-code"
              label="Plan code"
              helper={
                isEdit
                  ? undefined
                  : 'Unique among active items, e.g. plus or credits_100.'
              }
            >
              <Input
                id="catalog-plan-code"
                value={form.planCode}
                onChange={(event) => update({ planCode: event.target.value })}
                disabled={isEdit || saving}
                className="h-8 font-mono text-[13px]"
              />
            </Field>
            <Field id="catalog-name" label="Display name">
              <Input
                id="catalog-name"
                value={form.displayName}
                onChange={(event) =>
                  update({ displayName: event.target.value })
                }
                disabled={saving}
                className="h-8 text-[13px]"
              />
            </Field>
            <Field id="catalog-tier-name" label="Tier name">
              <Input
                id="catalog-tier-name"
                value={form.tierName}
                onChange={(event) => update({ tierName: event.target.value })}
                disabled={saving}
                className="h-8 text-[13px]"
              />
            </Field>
            <Field
              id="catalog-amount"
              label="Amount (minor units)"
              helper={
                amountPreview
                  ? `= ${amountPreview}`
                  : 'Required for Stripe provisioning.'
              }
            >
              <Input
                id="catalog-amount"
                inputMode="numeric"
                value={form.amount}
                onChange={(event) => update({ amount: event.target.value })}
                placeholder="999"
                disabled={saving}
                className="h-8 text-[13px]"
              />
            </Field>
            <Field id="catalog-currency" label="Currency">
              <Input
                id="catalog-currency"
                value={form.currency}
                onChange={(event) => update({ currency: event.target.value })}
                maxLength={3}
                disabled={saving}
                className="h-8 w-24 font-mono text-[13px] uppercase"
              />
            </Field>
            {isSubscription && (
              <Field id="catalog-interval" label="Billing interval">
                <ValueSelect<Interval>
                  value={form.interval}
                  onChange={(interval) => update({ interval })}
                  options={INTERVALS.map((interval) => ({
                    value: interval.value,
                    label: interval.label,
                  }))}
                  ariaLabel="Billing interval"
                  className="w-full"
                />
              </Field>
            )}
            <Field id="catalog-sort" label="Sort order">
              <Input
                id="catalog-sort"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(event) => update({ sortOrder: event.target.value })}
                disabled={saving}
                className="h-8 w-24 text-[13px]"
              />
            </Field>
            {!isEdit && (
              <>
                <Field id="catalog-tier-code" label="Tier code (optional)">
                  <Input
                    id="catalog-tier-code"
                    value={form.tierCode}
                    onChange={(event) =>
                      update({ tierCode: event.target.value })
                    }
                    disabled={saving}
                    className="h-8 font-mono text-[13px]"
                  />
                </Field>
                <Field id="catalog-lookup" label="Stripe lookup key (optional)">
                  <Input
                    id="catalog-lookup"
                    value={form.lookupKey}
                    onChange={(event) =>
                      update({ lookupKey: event.target.value })
                    }
                    disabled={saving}
                    className="h-8 font-mono text-[13px]"
                  />
                </Field>
              </>
            )}
            <Field
              id="catalog-features"
              label="Features (JSON object)"
              helper="Passed through to your product unchanged; features.credits is shown as credits."
              wide
            >
              <Textarea
                id="catalog-features"
                value={form.features}
                onChange={(event) => update({ features: event.target.value })}
                placeholder='{"credits": 100}'
                rows={3}
                disabled={saving}
                className="font-mono text-xs"
              />
            </Field>
            <Field
              id="catalog-metadata"
              label="Metadata (JSON object)"
              helper="Stored for admins only."
              wide
            >
              <Textarea
                id="catalog-metadata"
                value={form.metadata}
                onChange={(event) => update({ metadata: event.target.value })}
                rows={3}
                disabled={saving}
                className="font-mono text-xs"
              />
            </Field>
          </div>

          {error && (
            <p
              role="alert"
              className="m-0 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save changes' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BillingCatalogItemModal;
