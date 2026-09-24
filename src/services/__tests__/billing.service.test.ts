import { beforeEach, describe, expect, it, vi } from 'vitest';
import { billingService } from '../billing.service';
import type { BillingGroup } from '@/types/billing.types';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  postForm: vi.fn(),
  putForm: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../api.client', () => ({ apiClient: client }));

const group: BillingGroup = {
  group_hash: 'BG1',
  name: 'Acme',
  description: null,
  owner_id: 'usr-internal',
  provider: 'stripe',
  status: 'active',
  checkout_enabled: false,
  portal_enabled: false,
  provisioning_enabled: true,
  webhooks_enabled: false,
  credential_status: 'active',
  has_secret_key: true,
  has_webhook_secret: false,
  project_count: 2,
  catalog_item_count: 3,
  last_catalog_synced_at: null,
  catalog_sync_status: 'never',
  created_at: '2026-01-01T10:00:00',
  updated_at: '2026-01-02T10:00:00',
};

describe('billingService reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the metrics payload', async () => {
    client.get.mockResolvedValue({
      success: true,
      metrics: {
        groups_total: 3,
        groups_active: 2,
        groups_suspended: 1,
        groups_archived: 0,
        credentials_active: 1,
        credentials_absent: 2,
        credentials_rotating: 0,
        credentials_revoked: 0,
        subscription_plans: 4,
        credit_packages: 3,
        catalog_active: 5,
        catalog_pending: 2,
        catalog_failed: 1,
        catalog_archived: 0,
        projects_mapped: 6,
      },
    });

    const metrics = await billingService.getMetrics();

    expect(client.get.mock.calls[0][0]).toBe('/admin/billing/metrics');
    expect(metrics.subscription_plans).toBe(4);
    expect(metrics.groups_total).toBe(3);
  });

  it('lists groups with search and pagination and reads naive timestamps as UTC', async () => {
    client.get.mockResolvedValue({
      success: true,
      billing_groups: [group],
      pagination: { limit: 25, offset: 25, total: 26, has_more: false },
    });

    const page = await billingService.listGroups({
      search: '  acme ',
      limit: 25,
      offset: 25,
    });

    expect(client.get).toHaveBeenCalledWith('/admin/billing', {
      search: 'acme',
      limit: 25,
      offset: 25,
    });
    expect(page).toMatchObject({
      total: 26,
      limit: 25,
      offset: 25,
      hasMore: false,
    });
    expect(page.groups[0].created_at).toBe('2026-01-01T10:00:00Z');
  });

  it('unwraps group details and fails loudly when the group is missing', async () => {
    client.get.mockResolvedValueOnce({
      success: true,
      billing_group: group,
      projects: [],
      catalog: [],
      credentials: {
        credential_status: 'active',
        has_secret_key: true,
        has_webhook_secret: false,
      },
      readiness: {
        ready: false,
        status: 'not_ready',
        missing: ['stripe_webhook_secret'],
        capabilities: {},
      },
    });
    client.get.mockResolvedValueOnce({
      success: true,
      billing_group: null,
      projects: [],
      catalog: [],
      credentials: null,
    });

    const details = await billingService.getGroup('BG 1');
    expect(client.get.mock.calls[0][0]).toBe('/admin/billing/BG%201');
    expect(details.group.name).toBe('Acme');
    expect(details.readiness?.missing).toEqual(['stripe_webhook_secret']);

    await expect(billingService.getGroup('BG1')).rejects.toThrow(
      /billing group/
    );
  });
});

describe('billingService writes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('attachProject POSTs the project_hash as form data', async () => {
    client.postForm.mockResolvedValue({ success: true, project: null });

    await billingService.attachProject('bg_123', 'proj_abc');

    expect(client.postForm).toHaveBeenCalledWith(
      '/admin/billing/bg_123/projects',
      { project_hash: 'proj_abc' }
    );
  });

  it('updateCatalogItem PUTs only the given fields and returns the item', async () => {
    client.putForm.mockResolvedValue({
      success: true,
      item: {
        item_hash: 'cat_789',
        item_type: 'subscription_plan',
        plan_code: 'plus',
        display_name: 'Plus (annual)',
        provider: 'stripe',
        features: {},
        metadata: {},
        sort_order: 0,
        active: true,
        provisioning_status: 'active',
      },
    });

    const item = await billingService.updateCatalogItem('bg_123', 'cat_789', {
      display_name: 'Plus (annual)',
      amount_cents: 9900,
    });

    expect(client.putForm).toHaveBeenCalledWith(
      '/admin/billing/bg_123/catalog/cat_789',
      {
        display_name: 'Plus (annual)',
        amount_cents: 9900,
      }
    );
    expect(item.display_name).toBe('Plus (annual)');
  });

  it('updateCapabilities PUTs JSON and returns the group', async () => {
    client.put.mockResolvedValue({
      success: true,
      billing_group: { ...group, checkout_enabled: true },
    });

    const updated = await billingService.updateCapabilities('bg_123', {
      checkout_enabled: true,
    });

    expect(client.put).toHaveBeenCalledWith(
      '/admin/billing/bg_123/capabilities',
      { checkout_enabled: true }
    );
    expect(updated.checkout_enabled).toBe(true);
  });

  it('credentials use JSON bodies (never form encoding)', async () => {
    const status = {
      success: true,
      credentials: {
        credential_status: 'active',
        has_secret_key: true,
        has_webhook_secret: true,
      },
    };
    client.post.mockResolvedValue(status);
    client.put.mockResolvedValue(status);

    await billingService.testCredentials('bg_123', { secret_key: 'sk_test_x' });
    await billingService.setCredentials('bg_123', {
      secret_key: 'sk_test_x',
      webhook_secret: 'whsec_y',
    });
    await billingService.rotateCredentials('bg_123', {
      secret_key: 'sk_test_z',
    });

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      '/admin/billing/bg_123/credentials/test',
      { secret_key: 'sk_test_x' }
    );
    expect(client.put).toHaveBeenCalledWith(
      '/admin/billing/bg_123/credentials',
      {
        secret_key: 'sk_test_x',
        webhook_secret: 'whsec_y',
      }
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      '/admin/billing/bg_123/credentials/rotate',
      { secret_key: 'sk_test_z' }
    );
    expect(client.postForm).not.toHaveBeenCalled();
    expect(client.putForm).not.toHaveBeenCalled();
  });

  it('catalog reconcile, sync and import use the management endpoints', async () => {
    const result = {
      gated: false,
      in_sync: 1,
      missing_ref_repaired: 0,
      drift: [],
      candidates: [],
    };
    client.get.mockResolvedValue({ success: true, result });
    client.post.mockResolvedValue({
      success: true,
      result,
      imported: [],
      skipped: [],
      conflicts: [],
    });

    await expect(billingService.reconcileCatalog('bg_123')).resolves.toEqual(
      result
    );
    await billingService.syncCatalog('bg_123');
    await billingService.importCatalog('bg_123', {
      price_fingerprints: ['abc123abc123'],
    });

    expect(client.get.mock.calls[0][0]).toBe(
      '/admin/billing/bg_123/catalog/reconcile'
    );
    expect(client.post).toHaveBeenNthCalledWith(
      1,
      '/admin/billing/bg_123/catalog/sync',
      {}
    );
    expect(client.post).toHaveBeenNthCalledWith(
      2,
      '/admin/billing/bg_123/catalog/import',
      {
        price_fingerprints: ['abc123abc123'],
      }
    );
  });

  it('deleteGroup and detachProject encode path segments', async () => {
    client.delete.mockResolvedValue({ success: true });

    await billingService.deleteGroup('bg/1');
    await billingService.detachProject('bg/1', 'proj 2');

    expect(client.delete).toHaveBeenNthCalledWith(1, '/admin/billing/bg%2F1');
    expect(client.delete).toHaveBeenNthCalledWith(
      2,
      '/admin/billing/bg%2F1/projects/proj%202'
    );
  });
});
