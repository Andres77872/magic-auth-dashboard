import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingCatalogItemModal } from '../BillingCatalogItemModal';
import type { CatalogItem } from '@/types/billing.types';

const billingService = vi.hoisted(() => ({
  createCatalogItem: vi.fn(),
  updateCatalogItem: vi.fn(),
}));
const showToast = vi.hoisted(() => vi.fn());

vi.mock('@/services/billing.service', () => ({ billingService }));
vi.mock('@/hooks/useToast', () => ({ useToast: () => ({ showToast }) }));

const item: CatalogItem = {
  item_hash: 'CAT1',
  item_type: 'subscription_plan',
  plan_code: 'plus',
  display_name: 'Plus',
  currency: 'usd',
  unit_amount: 999,
  recurring_interval: 'month',
  provider: 'stripe',
  features: { credits: 100 },
  metadata: {},
  sort_order: 0,
  active: true,
  provisioning_status: 'active',
};

describe('BillingCatalogItemModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends only the changed display name, so the Stripe price is not rotated', async () => {
    billingService.updateCatalogItem.mockResolvedValue({
      ...item,
      display_name: 'Plus monthly',
    });
    const onSaved = vi.fn();
    render(
      <BillingCatalogItemModal
        isOpen
        groupHash="BG1"
        item={item}
        onClose={vi.fn()}
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Plus monthly' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(billingService.updateCatalogItem).toHaveBeenCalledTimes(1)
    );
    expect(billingService.updateCatalogItem).toHaveBeenCalledWith(
      'BG1',
      'CAT1',
      { display_name: 'Plus monthly' }
    );
    expect(onSaved).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('Saved “Plus monthly”.', 'success');
  });

  it('sends a price change and says the Stripe price was replaced', async () => {
    billingService.updateCatalogItem.mockResolvedValue({
      ...item,
      unit_amount: 1299,
    });
    render(
      <BillingCatalogItemModal
        isOpen
        groupHash="BG1"
        item={item}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Amount (minor units)'), {
      target: { value: '1299' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(billingService.updateCatalogItem).toHaveBeenCalledWith(
        'BG1',
        'CAT1',
        { amount_cents: 1299 }
      )
    );
    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('Stripe price was replaced'),
      'success'
    );
  });

  it('validates JSON features before calling the API', async () => {
    render(
      <BillingCatalogItemModal
        isOpen
        groupHash="BG1"
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Plan code'), {
      target: { value: 'pro' },
    });
    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Pro' },
    });
    fireEvent.change(screen.getByLabelText('Features (JSON object)'), {
      target: { value: '[1, 2]' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Features must be a JSON object.'
    );
    expect(billingService.createCatalogItem).not.toHaveBeenCalled();
  });
});
