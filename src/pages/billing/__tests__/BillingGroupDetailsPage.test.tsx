import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BillingGroupDetailsPage } from '../BillingGroupDetailsPage';
import type { BillingGroupDetails } from '@/types/billing.types';

const mocks = vi.hoisted(() => ({
  isRoot: false,
  showToast: vi.fn(),
  setBreadcrumb: vi.fn(),
}));
const billingService = vi.hoisted(() => ({
  getGroup: vi.fn(),
  deleteGroup: vi.fn(),
  updateCatalogItem: vi.fn(),
}));

vi.mock('@/services/billing.service', () => ({ billingService }));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/contexts', () => ({ useSetBreadcrumbLabel: mocks.setBreadcrumb }));

const details: BillingGroupDetails = {
  group: {
    group_hash: 'BG1',
    name: 'Acme billing',
    description: null,
    owner_id: null,
    provider: 'stripe',
    status: 'active',
    checkout_enabled: false,
    portal_enabled: false,
    provisioning_enabled: false,
    webhooks_enabled: false,
    credential_status: 'absent',
    has_secret_key: false,
    has_webhook_secret: false,
    project_count: 0,
    catalog_item_count: 1,
    last_catalog_synced_at: null,
    catalog_sync_status: 'never',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  projects: [],
  catalog: [
    {
      item_hash: 'CAT1',
      item_type: 'subscription_plan',
      plan_code: 'plus',
      display_name: 'Plus',
      currency: 'usd',
      unit_amount: 999,
      recurring_interval: 'month',
      provider: 'stripe',
      features: {},
      metadata: {},
      sort_order: 0,
      active: false,
      provisioning_status: 'pending',
    },
  ],
  credentials: {
    credential_status: 'absent',
    has_secret_key: false,
    has_webhook_secret: false,
  },
  readiness: {
    ready: false,
    status: 'not_ready',
    missing: ['billing_group_credentials_active', 'stripe_secret_key'],
    capabilities: {},
    webhook_endpoint_path: '/billing/stripe/webhook/BG1',
  },
};

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/billing/:groupHash"
          element={<BillingGroupDetailsPage />}
        />
        <Route path="/billing" element={<div>Billing list</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BillingGroupDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isRoot = false;
    billingService.getGroup.mockResolvedValue(details);
  });

  it('publishes the group name as the breadcrumb and shows readiness blockers', async () => {
    renderAt('/billing/BG1');

    expect(
      await screen.findByRole('heading', { name: 'Acme billing' })
    ).toBeInTheDocument();
    expect(billingService.getGroup).toHaveBeenCalledWith('BG1');
    expect(mocks.setBreadcrumb).toHaveBeenLastCalledWith('Acme billing');
    expect(
      screen.getAllByText('Stripe credentials must be connected').length
    ).toBeGreaterThan(0);
    // Checkout can't be switched on while prerequisites are missing.
    expect(screen.getByRole('switch', { name: 'Checkout' })).toBeDisabled();
  });

  it('hides the credentials tab from admins and falls back to overview', async () => {
    renderAt('/billing/BG1?tab=credentials');

    await screen.findByRole('heading', { name: 'Acme billing' });
    expect(
      screen.queryByRole('tab', { name: 'Stripe credentials' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('shows root the credentials tab without any secret values', async () => {
    mocks.isRoot = true;
    renderAt('/billing/BG1?tab=credentials');

    expect(
      await screen.findByRole('heading', { name: 'Connect Stripe' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Secret key')).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('deletes only after the group name is typed', async () => {
    billingService.deleteGroup.mockResolvedValue(undefined);
    renderAt('/billing/BG1');

    await screen.findByRole('heading', { name: 'Acme billing' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'More actions' }), {
      key: 'Enter',
    });
    fireEvent.click(await screen.findByText('Delete group'));

    const dialog = await screen.findByRole('dialog', {
      name: 'Delete billing group?',
    });
    const confirm = within(dialog).getByRole('button', {
      name: 'Delete group',
    });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'Acme billing' },
    });
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(billingService.deleteGroup).toHaveBeenCalledWith('BG1')
    );
    expect(await screen.findByText('Billing list')).toBeInTheDocument();
  });
});
