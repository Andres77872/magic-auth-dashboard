/**
 * Billing data and mutation hooks. Reads go through `useAsyncData`; every
 * mutation resolves only after the API confirms and rethrows failures so the
 * caller can toast the backend message.
 */

import { useCallback, useState } from 'react';
import { billingService } from '@/services/billing.service';
import { useAsyncData } from '@/hooks/useAsyncData';
import type {
  BillingCapabilitiesUpdateRequest,
  BillingCredentialsStatus,
  BillingGroup,
  BillingGroupCreateRequest,
  BillingGroupDetails,
  BillingGroupPage,
  BillingGroupUpdateRequest,
  CatalogImportResponse,
  CatalogItem,
  CatalogItemCreateRequest,
  CatalogItemUpdateRequest,
  CatalogReconcileResult,
  CredentialValidationResponse,
  StripeCredentialsRequest,
} from '@/types/billing.types';

export interface UseBillingGroupsOptions {
  search?: string;
  limit: number;
  offset: number;
}

export interface UseBillingGroupsReturn {
  page: BillingGroupPage | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** `GET /admin/billing` with server-side search and offset pagination. */
export function useBillingGroups({
  search,
  limit,
  offset,
}: UseBillingGroupsOptions): UseBillingGroupsReturn {
  const fetcher = useCallback(
    () =>
      billingService.listGroups({ search: search || undefined, limit, offset }),
    [search, limit, offset]
  );
  const { data, isLoading, isRefreshing, error, refetch } =
    useAsyncData(fetcher);
  return { page: data, isLoading, isRefreshing, error, refetch };
}

export interface UseBillingGroupReturn {
  details: BillingGroupDetails | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** One billing group with projects, catalog, credential status and readiness. */
export function useBillingGroup(groupHash: string): UseBillingGroupReturn {
  const fetcher = useCallback(
    () => billingService.getGroup(groupHash),
    [groupHash]
  );
  const { data, isLoading, isRefreshing, error, refetch } = useAsyncData(
    fetcher,
    { enabled: Boolean(groupHash) }
  );
  return { details: data, isLoading, isRefreshing, error, refetch };
}

/** Tracks which mutation is in flight so buttons can show progress. */
function usePending<K extends string>(): {
  pending: K | null;
  run: <T>(kind: K, action: () => Promise<T>) => Promise<T>;
} {
  const [pending, setPending] = useState<K | null>(null);
  const run = useCallback(
    async <T>(kind: K, action: () => Promise<T>): Promise<T> => {
      setPending(kind);
      try {
        return await action();
      } finally {
        setPending(null);
      }
    },
    []
  );
  return { pending, run };
}

export type BillingGroupMutation =
  | 'create'
  | 'update'
  | 'capabilities'
  | 'delete'
  | 'detach';

export function useBillingGroupMutations(): {
  pending: BillingGroupMutation | null;
  createGroup: (data: BillingGroupCreateRequest) => Promise<BillingGroup>;
  updateGroup: (
    groupHash: string,
    data: BillingGroupUpdateRequest
  ) => Promise<BillingGroup>;
  updateCapabilities: (
    groupHash: string,
    data: BillingCapabilitiesUpdateRequest
  ) => Promise<BillingGroup>;
  deleteGroup: (groupHash: string) => Promise<void>;
  detachProject: (groupHash: string, projectHash: string) => Promise<void>;
} {
  const { pending, run } = usePending<BillingGroupMutation>();
  return {
    pending,
    createGroup: useCallback(
      (data) => run('create', () => billingService.createGroup(data)),
      [run]
    ),
    updateGroup: useCallback(
      (groupHash, data) =>
        run('update', () => billingService.updateGroup(groupHash, data)),
      [run]
    ),
    updateCapabilities: useCallback(
      (groupHash, data) =>
        run('capabilities', () =>
          billingService.updateCapabilities(groupHash, data)
        ),
      [run]
    ),
    deleteGroup: useCallback(
      (groupHash) => run('delete', () => billingService.deleteGroup(groupHash)),
      [run]
    ),
    detachProject: useCallback(
      (groupHash, projectHash) =>
        run('detach', () =>
          billingService.detachProject(groupHash, projectHash)
        ),
      [run]
    ),
  };
}

export type CatalogMutation =
  | 'save'
  | 'archive'
  | 'reconcile'
  | 'sync'
  | 'import';

export function useCatalogMutations(groupHash: string): {
  pending: CatalogMutation | null;
  createItem: (data: CatalogItemCreateRequest) => Promise<CatalogItem>;
  updateItem: (
    itemHash: string,
    data: CatalogItemUpdateRequest
  ) => Promise<CatalogItem>;
  setArchived: (itemHash: string, archived: boolean) => Promise<CatalogItem>;
  reconcile: () => Promise<CatalogReconcileResult>;
  sync: () => Promise<CatalogReconcileResult>;
  importPrices: (priceFingerprints: string[]) => Promise<CatalogImportResponse>;
} {
  const { pending, run } = usePending<CatalogMutation>();
  return {
    pending,
    createItem: useCallback(
      (data) =>
        run('save', () => billingService.createCatalogItem(groupHash, data)),
      [run, groupHash]
    ),
    updateItem: useCallback(
      (itemHash, data) =>
        run('save', () =>
          billingService.updateCatalogItem(groupHash, itemHash, data)
        ),
      [run, groupHash]
    ),
    setArchived: useCallback(
      (itemHash, archived) =>
        run('archive', () =>
          billingService.archiveCatalogItem(groupHash, itemHash, archived)
        ),
      [run, groupHash]
    ),
    reconcile: useCallback(
      () => run('reconcile', () => billingService.reconcileCatalog(groupHash)),
      [run, groupHash]
    ),
    sync: useCallback(
      () => run('sync', () => billingService.syncCatalog(groupHash)),
      [run, groupHash]
    ),
    importPrices: useCallback(
      (priceFingerprints) =>
        run('import', () =>
          billingService.importCatalog(groupHash, {
            price_fingerprints: priceFingerprints,
          })
        ),
      [run, groupHash]
    ),
  };
}

export type CredentialsMutation = 'test' | 'save';

export function useCredentialsMutations(groupHash: string): {
  pending: CredentialsMutation | null;
  testCredentials: (
    data: StripeCredentialsRequest
  ) => Promise<CredentialValidationResponse>;
  /** PUT for a first save, POST `/rotate` when credentials already exist. */
  saveCredentials: (
    data: StripeCredentialsRequest,
    rotate: boolean
  ) => Promise<BillingCredentialsStatus>;
} {
  const { pending, run } = usePending<CredentialsMutation>();
  return {
    pending,
    testCredentials: useCallback(
      (data) =>
        run('test', () => billingService.testCredentials(groupHash, data)),
      [run, groupHash]
    ),
    saveCredentials: useCallback(
      (data, rotate) =>
        run('save', () =>
          rotate
            ? billingService.rotateCredentials(groupHash, data)
            : billingService.setCredentials(groupHash, data)
        ),
      [run, groupHash]
    ),
  };
}
