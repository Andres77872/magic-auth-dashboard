import { beforeEach, describe, expect, it, vi } from 'vitest';
import { billingService } from '../billing.service';
import { apiClient } from '../api.client';
import type { BillingMetricsResponse } from '@/types/billing.types';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    postForm: vi.fn(),
    putForm: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('billingService.getMetrics', () => {
  const mockedApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GETs the admin metrics aggregate endpoint and returns counts', async () => {
    const response: BillingMetricsResponse = {
      success: true,
      message: 'ok',
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
    };
    mockedApiClient.get.mockResolvedValue(response);

    const result = await billingService.getMetrics();

    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/billing/metrics');
    expect(result.metrics.subscription_plans).toBe(4);
    expect(result.metrics.credit_packages).toBe(3);
    expect(result.metrics.groups_total).toBe(3);
  });
});

describe('billingService project + catalog writes', () => {
  const mockedApiClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('attachProject POSTs the project_hash as form data to the group projects endpoint', async () => {
    mockedApiClient.postForm.mockResolvedValue({ success: true } as never);

    await billingService.attachProject('bg_123', 'proj_abc');

    expect(mockedApiClient.postForm.mock.calls[0]).toEqual([
      '/admin/billing/bg_123/projects',
      { project_hash: 'proj_abc' },
    ]);
  });

  it('updateCatalogItem PUTs the editable fields to the catalog item endpoint', async () => {
    mockedApiClient.putForm.mockResolvedValue({ success: true } as never);

    await billingService.updateCatalogItem('bg_123', 'cat_789', {
      display_name: 'Plus (annual)',
      amount_cents: 9900,
      recurring_interval: 'year',
    });

    expect(mockedApiClient.putForm.mock.calls[0]).toEqual([
      '/admin/billing/bg_123/catalog/cat_789',
      { display_name: 'Plus (annual)', amount_cents: 9900, recurring_interval: 'year' },
    ]);
  });

  it('updateCapabilities PUTs JSON to the capability endpoint', async () => {
    mockedApiClient.put.mockResolvedValue({ success: true } as never);

    await billingService.updateCapabilities('bg_123', { checkout_enabled: true, portal_enabled: false });

    expect(mockedApiClient.put.mock.calls[0]).toEqual([
      '/admin/billing/bg_123/capabilities',
      { checkout_enabled: true, portal_enabled: false },
    ]);
  });

  it('testCredentials POSTs JSON without form encoding', async () => {
    mockedApiClient.post.mockResolvedValue({ success: true, valid: true } as never);

    await billingService.testCredentials('bg_123', { secret_key: 'sk_test_x' });

    expect(mockedApiClient.post.mock.calls[0]).toEqual([
      '/admin/billing/bg_123/credentials/test',
      { secret_key: 'sk_test_x' },
    ]);
  });

  it('catalog reconcile, sync, and import use the management endpoints', async () => {
    mockedApiClient.get.mockResolvedValue({ success: true, result: { drift: [], candidates: [] } } as never);
    mockedApiClient.post.mockResolvedValue({ success: true } as never);

    await billingService.reconcileCatalog('bg_123');
    await billingService.syncCatalog('bg_123');
    await billingService.importCatalog('bg_123', { price_fingerprints: ['abc123abc123'] });

    expect(mockedApiClient.get.mock.calls[0][0]).toBe('/admin/billing/bg_123/catalog/reconcile');
    expect(mockedApiClient.post.mock.calls[0]).toEqual(['/admin/billing/bg_123/catalog/sync', {}]);
    expect(mockedApiClient.post.mock.calls[1]).toEqual([
      '/admin/billing/bg_123/catalog/import',
      { price_fingerprints: ['abc123abc123'] },
    ]);
  });
});
