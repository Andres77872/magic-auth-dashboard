import {
  deleteJson,
  getJson,
  postFormJson,
  postJson,
  putFormJson,
  putJson,
  seg,
} from './request';
import { asUtcTimestamp } from '@/utils/formatters';
import type { PaginationParams } from '@/types/api.types';
import type {
  BillingCapabilitiesUpdateRequest,
  BillingCredentialsStatus,
  BillingCredentialsStatusResponse,
  BillingGroup,
  BillingGroupCreateRequest,
  BillingGroupDetails,
  BillingGroupDetailsResponse,
  BillingGroupPage,
  BillingGroupProject,
  BillingGroupResponse,
  BillingGroupUpdateRequest,
  BillingMetrics,
  BillingMetricsResponse,
  CatalogImportRequest,
  CatalogImportResponse,
  CatalogItem,
  CatalogItemCreateRequest,
  CatalogItemResponse,
  CatalogItemUpdateRequest,
  CatalogReconcileResponse,
  CatalogReconcileResult,
  CredentialValidationResponse,
  ListBillingGroupsResponse,
  StripeCredentialsRequest,
} from '@/types/billing.types';

/**
 * Billing administration (api.auth `admin_billing.py`, prefix `/admin/billing`).
 *
 * Routes answer Pydantic models with `success`/`message` plus a route-specific
 * key (`billing_groups`, `billing_group`, `item`, …); methods return that
 * payload. Group and catalog writes are Form-encoded; capabilities, catalog
 * import and credentials are JSON (credentials never go through a form).
 * Credential writes are root-only server-side; reads expose presence flags and
 * fingerprints only — secrets are never returned.
 */

const BASE = '/admin/billing';

function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`The billing response did not include ${what}.`);
  }
  return value;
}

function normalizeGroup(group: BillingGroup): BillingGroup {
  return {
    ...group,
    last_catalog_synced_at: asUtcTimestamp(group.last_catalog_synced_at),
    created_at: asUtcTimestamp(group.created_at),
    updated_at: asUtcTimestamp(group.updated_at),
  };
}

function normalizeProject(project: BillingGroupProject): BillingGroupProject {
  return { ...project, added_at: asUtcTimestamp(project.added_at) };
}

function normalizeItem(item: CatalogItem): CatalogItem {
  return {
    ...item,
    provisioned_at: asUtcTimestamp(item.provisioned_at),
    created_at: asUtcTimestamp(item.created_at),
    updated_at: asUtcTimestamp(item.updated_at),
  };
}

function normalizeCredentials(
  credentials: BillingCredentialsStatus
): BillingCredentialsStatus {
  return {
    ...credentials,
    credentials_set_at: asUtcTimestamp(credentials.credentials_set_at),
  };
}

class BillingService {
  // --- metrics ----------------------------------------------------------------------------

  /** `GET /admin/billing/metrics` — counts over the groups the caller manages. */
  async getMetrics(): Promise<BillingMetrics> {
    const res = await getJson<BillingMetricsResponse>(`${BASE}/metrics`);
    return required(res.metrics, 'metrics');
  }

  // --- groups -----------------------------------------------------------------------------

  /** `GET /admin/billing` — newest first; `search` matches the name or group hash. */
  async listGroups(
    params: PaginationParams & { search?: string } = {}
  ): Promise<BillingGroupPage> {
    const res = await getJson<ListBillingGroupsResponse>(BASE, {
      limit: params.limit,
      offset: params.offset,
      search: params.search?.trim() || undefined,
    });
    const groups = res.billing_groups.map(normalizeGroup);
    const limit = res.pagination?.limit ?? params.limit ?? groups.length;
    const offset = res.pagination?.offset ?? params.offset ?? 0;
    const total = res.pagination?.total ?? offset + groups.length;
    return {
      groups,
      total,
      limit,
      offset,
      hasMore: res.pagination?.has_more ?? offset + groups.length < total,
    };
  }

  async getGroup(groupHash: string): Promise<BillingGroupDetails> {
    const res = await getJson<BillingGroupDetailsResponse>(
      `${BASE}/${seg(groupHash)}`
    );
    return {
      group: normalizeGroup(required(res.billing_group, 'the billing group')),
      projects: res.projects.map(normalizeProject),
      catalog: res.catalog.map(normalizeItem),
      credentials: normalizeCredentials(
        required(res.credentials, 'the credential status')
      ),
      readiness: res.readiness ?? null,
    };
  }

  async createGroup(data: BillingGroupCreateRequest): Promise<BillingGroup> {
    const res = await postFormJson<BillingGroupResponse>(BASE, data);
    return normalizeGroup(required(res.billing_group, 'the new billing group'));
  }

  /** Empty fields keep their value server-side, so a description can't be cleared. */
  async updateGroup(
    groupHash: string,
    data: BillingGroupUpdateRequest
  ): Promise<BillingGroup> {
    const res = await putFormJson<BillingGroupResponse>(
      `${BASE}/${seg(groupHash)}`,
      data
    );
    return normalizeGroup(
      required(res.billing_group, 'the updated billing group')
    );
  }

  /** JSON; turning a capability on is refused (400, `details.missing`) until its prerequisites are met. */
  async updateCapabilities(
    groupHash: string,
    data: BillingCapabilitiesUpdateRequest
  ): Promise<BillingGroup> {
    const res = await putJson<BillingGroupResponse>(
      `${BASE}/${seg(groupHash)}/capabilities`,
      data
    );
    return normalizeGroup(
      required(res.billing_group, 'the updated billing group')
    );
  }

  /** Permanent; cascades to mappings, catalog and history. 409 while subscriptions are active. */
  async deleteGroup(groupHash: string): Promise<void> {
    await deleteJson(`${BASE}/${seg(groupHash)}`);
  }

  // --- group <-> project membership -------------------------------------------------------

  /** 409 when the project is attached to another billing group. */
  async attachProject(groupHash: string, projectHash: string): Promise<void> {
    await postFormJson(`${BASE}/${seg(groupHash)}/projects`, {
      project_hash: projectHash,
    });
  }

  async detachProject(groupHash: string, projectHash: string): Promise<void> {
    await deleteJson(`${BASE}/${seg(groupHash)}/projects/${seg(projectHash)}`);
  }

  // --- credentials (root only; JSON, write-only) ------------------------------------------

  async setCredentials(
    groupHash: string,
    data: StripeCredentialsRequest
  ): Promise<BillingCredentialsStatus> {
    const res = await putJson<BillingCredentialsStatusResponse>(
      `${BASE}/${seg(groupHash)}/credentials`,
      data
    );
    return normalizeCredentials(
      required(res.credentials, 'the credential status')
    );
  }

  async rotateCredentials(
    groupHash: string,
    data: StripeCredentialsRequest
  ): Promise<BillingCredentialsStatus> {
    const res = await postJson<BillingCredentialsStatusResponse>(
      `${BASE}/${seg(groupHash)}/credentials/rotate`,
      data
    );
    return normalizeCredentials(
      required(res.credentials, 'the credential status')
    );
  }

  /** Validates with Stripe without saving. Invalid credentials answer 400. */
  async testCredentials(
    groupHash: string,
    data: StripeCredentialsRequest
  ): Promise<CredentialValidationResponse> {
    return postJson<CredentialValidationResponse>(
      `${BASE}/${seg(groupHash)}/credentials/test`,
      data
    );
  }

  // --- catalog ----------------------------------------------------------------------------

  async createCatalogItem(
    groupHash: string,
    data: CatalogItemCreateRequest
  ): Promise<CatalogItem> {
    const res = await postFormJson<CatalogItemResponse>(
      `${BASE}/${seg(groupHash)}/catalog`,
      data
    );
    return normalizeItem(required(res.item, 'the catalog item'));
  }

  async updateCatalogItem(
    groupHash: string,
    itemHash: string,
    data: CatalogItemUpdateRequest
  ): Promise<CatalogItem> {
    const res = await putFormJson<CatalogItemResponse>(
      `${BASE}/${seg(groupHash)}/catalog/${seg(itemHash)}`,
      data
    );
    return normalizeItem(required(res.item, 'the catalog item'));
  }

  /**
   * `archived=true` archives (leaves the S2S catalog); `archived=false` only
   * sets an inactive, non-archived item active again.
   */
  async archiveCatalogItem(
    groupHash: string,
    itemHash: string,
    archived = true
  ): Promise<CatalogItem> {
    const res = await postFormJson<CatalogItemResponse>(
      `${BASE}/${seg(groupHash)}/catalog/${seg(itemHash)}/archive`,
      { archived }
    );
    return normalizeItem(required(res.item, 'the catalog item'));
  }

  /** Read-only comparison with the group's Stripe prices. `error` is set (with `success: false`) on failure. */
  async reconcileCatalog(groupHash: string): Promise<CatalogReconcileResult> {
    const res = await getJson<CatalogReconcileResponse>(
      `${BASE}/${seg(groupHash)}/catalog/reconcile`
    );
    return required(res.result, 'a reconcile result');
  }

  /** Reconcile and adopt matching Stripe prices (never creates anything in Stripe). */
  async syncCatalog(groupHash: string): Promise<CatalogReconcileResult> {
    const res = await postJson<CatalogReconcileResponse>(
      `${BASE}/${seg(groupHash)}/catalog/sync`,
      {}
    );
    return required(res.result, 'a sync result');
  }

  async importCatalog(
    groupHash: string,
    data: CatalogImportRequest
  ): Promise<CatalogImportResponse> {
    return postJson<CatalogImportResponse>(
      `${BASE}/${seg(groupHash)}/catalog/import`,
      data
    );
  }
}

export const billingService = new BillingService();
export default BillingService;
