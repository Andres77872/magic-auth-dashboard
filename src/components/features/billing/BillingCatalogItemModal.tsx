/**
 * Create or edit a billing catalog item (subscription plan / credit package).
 *
 * One modal serves both modes. In edit mode `item_type` and `plan_code` are immutable (the
 * backend update contract omits them), and price changes reprovision the item in Stripe.
 * Note the read/write field-name shift: items are read as `unit_amount` but written as
 * `amount_cents`.
 */

import React, { useEffect, useState } from 'react';
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
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { billingService } from '@/services';
import { useToast } from '@/hooks';
import type { CatalogItem, CatalogItemCreateRequest, CatalogItemUpdateRequest } from '@/types';

interface BillingCatalogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupHash: string;
  /** Present = edit mode; absent/null = create mode. */
  item?: CatalogItem | null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

const EMPTY_FORM: CatalogItemCreateRequest = {
  item_type: 'subscription_plan',
  plan_code: '',
  display_name: '',
  currency: 'usd',
  recurring_interval: 'month',
};

function formFromItem(item: CatalogItem): CatalogItemCreateRequest {
  const hasFeatures = item.features && Object.keys(item.features).length > 0;
  const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;
  return {
    item_type: item.item_type,
    plan_code: item.plan_code,
    display_name: item.display_name,
    tier_code: item.tier_code ?? undefined,
    tier_name: item.tier_name ?? undefined,
    amount_cents: item.unit_amount ?? undefined,
    currency: item.currency ?? 'usd',
    recurring_interval: item.recurring_interval ?? 'month',
    lookup_key: item.lookup_key ?? undefined,
    features: hasFeatures ? JSON.stringify(item.features) : undefined,
    metadata: hasMetadata ? JSON.stringify(item.metadata) : undefined,
    sort_order: item.sort_order,
  };
}

function normalizedJsonObject(raw: string | undefined, field: string): string | undefined {
  if (!raw || raw.trim() === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${field} must be valid JSON`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${field} must be a JSON object`);
  }
  return JSON.stringify(parsed);
}

export function BillingCatalogItemModal({
  isOpen,
  onClose,
  onSuccess,
  groupHash,
  item,
}: BillingCatalogItemModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const isEdit = Boolean(item);
  const [form, setForm] = useState<CatalogItemCreateRequest>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(item ? formFromItem(item) : EMPTY_FORM);
    }
  }, [isOpen, item]);

  const update = (patch: Partial<CatalogItemCreateRequest>): void =>
    setForm((f) => ({ ...f, ...patch }));

  const isSubscription = form.item_type === 'subscription_plan';

  const save = async (): Promise<void> => {
    if (!form.display_name.trim()) {
      showToast('display_name is required', 'error');
      return;
    }
    if (!isEdit && !form.plan_code.trim()) {
      showToast('plan_code is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const amount_cents = form.amount_cents ? Number(form.amount_cents) : undefined;
      const recurring_interval = isSubscription ? form.recurring_interval : undefined;
      const features = normalizedJsonObject(form.features, 'features');
      const metadata = normalizedJsonObject(form.metadata, 'metadata');
      if (isEdit && item) {
        const payload: CatalogItemUpdateRequest = {
          display_name: form.display_name.trim(),
          tier_code: form.tier_code,
          tier_name: form.tier_name,
          amount_cents,
          currency: form.currency,
          recurring_interval,
          lookup_key: form.lookup_key,
          features,
          metadata,
          sort_order: form.sort_order,
        };
        await billingService.updateCatalogItem(groupHash, item.item_hash, payload);
        showToast('Catalog item updated (re-provisions to Stripe on price changes)', 'success');
      } else {
        await billingService.createCatalogItem(groupHash, {
          ...form,
          plan_code: form.plan_code.trim(),
          display_name: form.display_name.trim(),
          amount_cents,
          recurring_interval,
          features,
          metadata,
        });
        showToast('Catalog item created (provisions to Stripe when the group is enabled)', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(errorMessage(err, isEdit ? 'Update failed' : 'Create failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !saving && !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit catalog item' : 'New catalog item'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Type and plan code are fixed. Changing price, currency, or interval re-provisions the item in Stripe.'
              : 'Define a subscription plan or credit package. It provisions to Stripe when the group is enabled.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={form.item_type}
              onValueChange={(v) => update({ item_type: v as CatalogItemCreateRequest['item_type'] })}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subscription_plan">Subscription plan</SelectItem>
                <SelectItem value="credit_package">Credit package</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-plan-code">Plan code</Label>
            <Input
              id="cat-plan-code"
              placeholder="e.g. plus / payg_100"
              value={form.plan_code}
              onChange={(e) => update({ plan_code: e.target.value })}
              disabled={isEdit}
              fullWidth
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-display-name">Display name</Label>
            <Input
              id="cat-display-name"
              placeholder="e.g. Plus"
              value={form.display_name}
              onChange={(e) => update({ display_name: e.target.value })}
              fullWidth
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-amount">Amount (cents)</Label>
            <Input
              id="cat-amount"
              type="number"
              placeholder="999"
              value={form.amount_cents ?? ''}
              onChange={(e) => update({ amount_cents: e.target.value ? Number(e.target.value) : undefined })}
              fullWidth
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-currency">Currency</Label>
            <Input
              id="cat-currency"
              placeholder="usd"
              value={form.currency ?? ''}
              onChange={(e) => update({ currency: e.target.value })}
              fullWidth
            />
          </div>
          {isSubscription && (
            <div className="space-y-1.5">
              <Label>Interval</Label>
              <Select
                value={form.recurring_interval ?? 'month'}
                onValueChange={(v) => update({ recurring_interval: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">month</SelectItem>
                  <SelectItem value="year">year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cat-lookup">Lookup key (optional)</Label>
            <Input
              id="cat-lookup"
              placeholder="plus_monthly"
              value={form.lookup_key ?? ''}
              onChange={(e) => update({ lookup_key: e.target.value })}
              fullWidth
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cat-features">Features JSON (opaque)</Label>
            <Textarea
              id="cat-features"
              placeholder='{"daily_credit_limit":100}'
              value={form.features ?? ''}
              onChange={(e) => update({ features: e.target.value })}
              rows={4}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cat-metadata">Metadata JSON (opaque)</Label>
            <Textarea
              id="cat-metadata"
              placeholder='{"stripe_label":"Plus"}'
              value={form.metadata ?? ''}
              onChange={(e) => update({ metadata: e.target.value })}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void save()} loading={saving}>
            {isEdit ? 'Save changes' : 'Create catalog item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BillingCatalogItemModal;
