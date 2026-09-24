/**
 * A billing group's catalog: plans and credit packages, their Stripe
 * provisioning state, and reconcile / sync / import against the group's
 * Stripe account.
 */

import React, { useMemo, useState } from 'react';
import {
  ArchiveRestore,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Archive,
  Upload,
} from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataView } from '@/components/common/DataView';
import type { DataViewColumn } from '@/components/common/DataView.types';
import { Panel } from '@/components/common/Panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/useToast';
import { formatNumber, formatRelativeTime } from '@/utils/formatters';
import type {
  BillingGroupDetails,
  CatalogItem,
  CatalogReconcileResult,
} from '@/types/billing.types';
import { BillingCatalogItemModal } from './BillingCatalogItemModal';
import {
  ITEM_TYPE_LABEL,
  formatMoney,
  formatPrice,
  provisioningStatus,
} from './billing-status';
import { useCatalogMutations } from './useBilling';

export interface BillingCatalogTabProps {
  details: BillingGroupDetails;
  onChanged: () => void;
}

const DRIFT_LABEL: Record<string, string> = {
  amount_mismatch: 'Amount differs from Stripe',
  interval_mismatch: 'Interval differs from Stripe',
  unresolved: 'Price not found among active Stripe prices',
  price_archived: 'Stripe price archived',
};

function ReconcilePanel({
  result,
  selected,
  onToggle,
  onImport,
  importing,
  onDismiss,
}: {
  result: CatalogReconcileResult;
  selected: Set<string>;
  onToggle: (fingerprint: string, checked: boolean) => void;
  onImport: () => void;
  importing: boolean;
  onDismiss: () => void;
}): React.JSX.Element {
  return (
    <Panel
      title="Stripe comparison"
      description={
        result.synced_at
          ? `Checked ${formatRelativeTime(result.synced_at)}`
          : 'Local catalog compared with active Stripe prices'
      }
      actions={
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      }
      className="mb-4"
    >
      {result.error ? (
        <p role="alert" className="m-0 text-[13px] text-destructive">
          {result.gated
            ? `Stripe can't be reached for this group (${result.error}). Check that billing is enabled and the credentials are connected.`
            : `The Stripe comparison failed: ${result.error}`}
        </p>
      ) : (
        <div className="space-y-4">
          <p className="m-0 text-[13px] text-muted-foreground">
            {formatNumber(result.in_sync)} in sync ·{' '}
            {formatNumber(result.drift.length)} drifted ·{' '}
            {formatNumber(result.candidates.length)} Stripe prices not in the
            catalog
            {result.missing_ref_repaired > 0 &&
              ` · ${formatNumber(result.missing_ref_repaired)} references repaired`}
          </p>
          {result.drift.length > 0 && (
            <ul className="m-0 list-none space-y-1 p-0">
              {result.drift.map((drift) => (
                <li
                  key={`${drift.item_hash}-${drift.drift_kind}`}
                  className="flex flex-wrap items-center gap-2 text-[13px]"
                >
                  <span className="font-mono text-xs text-foreground">
                    {drift.plan_code}
                  </span>
                  <Badge variant="warning" size="sm">
                    {DRIFT_LABEL[drift.drift_kind] ?? drift.drift_kind}
                  </Badge>
                  {drift.drift_kind === 'amount_mismatch' && (
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(drift.local_unit_amount)} here ·{' '}
                      {formatNumber(drift.stripe_unit_amount)} in Stripe
                    </span>
                  )}
                  {drift.drift_kind === 'interval_mismatch' && (
                    <span className="text-xs text-muted-foreground">
                      {drift.local_interval ?? '—'} here ·{' '}
                      {drift.stripe_interval ?? '—'} in Stripe
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {result.candidates.length > 0 && (
            <div className="space-y-2">
              <p className="m-0 text-xs font-medium text-foreground">
                Import Stripe prices into the catalog
              </p>
              <ul className="m-0 list-none divide-y divide-border rounded-md border border-border p-0">
                {result.candidates.map((candidate) => {
                  const id = `import-${candidate.price_fingerprint}`;
                  return (
                    <li
                      key={candidate.price_fingerprint}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Checkbox
                        id={id}
                        checked={selected.has(candidate.price_fingerprint)}
                        disabled={candidate.plan_code_conflict || importing}
                        onCheckedChange={(checked) =>
                          onToggle(
                            candidate.price_fingerprint,
                            checked === true
                          )
                        }
                      />
                      <label
                        htmlFor={id}
                        className="min-w-0 flex-1 text-[13px]"
                      >
                        <span className="font-medium text-foreground">
                          {candidate.display_name}
                        </span>{' '}
                        <span className="font-mono text-xs text-muted-foreground">
                          {candidate.plan_code}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {formatMoney(
                            candidate.unit_amount,
                            candidate.currency
                          )}
                          {candidate.recurring_interval
                            ? ` / ${candidate.recurring_interval}`
                            : ' one-time'}
                        </span>
                      </label>
                      {candidate.plan_code_conflict && (
                        <Badge variant="warning" size="sm">
                          Plan code in use
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Button
                variant="secondary"
                size="sm"
                onClick={onImport}
                loading={importing}
                disabled={selected.size === 0}
              >
                <Upload aria-hidden="true" />
                Import{' '}
                {selected.size > 0 ? `${selected.size} selected` : 'selected'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

export function BillingCatalogTab({
  details,
  onChanged,
}: BillingCatalogTabProps): React.JSX.Element {
  const { group, catalog } = details;
  const { showToast } = useToast();
  const { reconcile, sync, importPrices, setArchived, pending } =
    useCatalogMutations(group.group_hash);
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<{ item: CatalogItem | null } | null>(
    null
  );
  const [archiveTarget, setArchiveTarget] = useState<CatalogItem | null>(null);
  const [result, setResult] = useState<CatalogReconcileResult | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const archivedCount = catalog.filter(
    (item) => item.provisioning_status === 'archived'
  ).length;
  const rows = useMemo(
    () =>
      showArchived
        ? catalog
        : catalog.filter((item) => item.provisioning_status !== 'archived'),
    [catalog, showArchived]
  );

  const runReconcile = async (write: boolean): Promise<void> => {
    try {
      const next = write ? await sync() : await reconcile();
      setResult(next);
      setSelected(
        new Set(
          next.candidates
            .filter((c) => !c.plan_code_conflict)
            .map((c) => c.price_fingerprint)
        )
      );
      if (next.error)
        showToast(`The Stripe comparison failed: ${next.error}`, 'warning');
      else if (write)
        showToast(
          `Catalog synced. ${next.missing_ref_repaired} references repaired.`,
          'success'
        );
      if (write) onChanged();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The catalog could not be compared with Stripe.',
        'error'
      );
    }
  };

  const runImport = async (): Promise<void> => {
    try {
      const response = await importPrices(Array.from(selected));
      const parts = [`Imported ${response.imported.length}`];
      if (response.conflicts.length)
        parts.push(`${response.conflicts.length} plan code conflicts`);
      if (response.skipped.length)
        parts.push(`${response.skipped.length} skipped`);
      showToast(
        parts.join(' · '),
        response.imported.length > 0 ? 'success' : 'warning'
      );
      onChanged();
      await runReconcile(false);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The prices could not be imported.',
        'error'
      );
    }
  };

  const confirmArchive = async (): Promise<void> => {
    if (!archiveTarget) return;
    try {
      await setArchived(archiveTarget.item_hash, true);
      showToast(`Archived “${archiveTarget.display_name}”`, 'success');
      setArchiveTarget(null);
      onChanged();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'The item could not be archived.',
        'error'
      );
    }
  };

  const reactivate = async (item: CatalogItem): Promise<void> => {
    try {
      await setArchived(item.item_hash, false);
      showToast(`“${item.display_name}” is active again`, 'success');
      onChanged();
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The item could not be reactivated.',
        'error'
      );
    }
  };

  const columns: DataViewColumn<CatalogItem>[] = [
    {
      key: 'display_name',
      header: 'Item',
      render: (_value, item) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">
            {item.display_name}
          </div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {item.plan_code}
          </div>
        </div>
      ),
    },
    {
      key: 'item_type',
      header: 'Type',
      hideOnMobile: true,
      render: (_value, item) => (
        <span className="text-muted-foreground">
          {ITEM_TYPE_LABEL[item.item_type] ?? item.item_type}
        </span>
      ),
    },
    {
      key: 'unit_amount',
      header: 'Price',
      render: (_value, item) => (
        <span className="tabular-nums">{formatPrice(item)}</span>
      ),
    },
    {
      key: 'provisioning_status',
      header: 'Stripe',
      render: (_value, item) => {
        const display = provisioningStatus(item.provisioning_status);
        return (
          <div className="min-w-0">
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge variant={display.variant} size="sm">
                {display.label}
              </Badge>
              {!item.active && item.provisioning_status !== 'archived' && (
                <span className="text-xs text-muted-foreground">Inactive</span>
              )}
            </span>
            {item.provisioning_status === 'failed' &&
              item.provisioning_error && (
                <div
                  className="mt-0.5 max-w-[280px] truncate text-xs text-destructive"
                  title={item.provisioning_error}
                >
                  {item.provisioning_error}
                </div>
              )}
          </div>
        );
      },
    },
    {
      key: 'provider_price_fingerprint',
      header: 'Price ref',
      hideOnMobile: true,
      render: (_value, item) =>
        item.provider_price_fingerprint ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {item.provider_price_fingerprint}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'item_hash',
      header: '',
      align: 'right',
      width: '48px',
      render: (_value, item) => {
        const archived = item.provisioning_status === 'archived';
        return (
          <ActionsMenu
            ariaLabel={`Actions for ${item.display_name}`}
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <Pencil />,
                onClick: () => setEditor({ item }),
                hidden: archived,
              },
              {
                key: 'activate',
                label: 'Set active',
                icon: <ArchiveRestore />,
                onClick: () => void reactivate(item),
                hidden: archived || item.active,
              },
              {
                key: 'archive',
                label: 'Archive',
                icon: <Archive />,
                onClick: () => setArchiveTarget(item),
                destructive: true,
                hidden: archived,
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      {result && (
        <ReconcilePanel
          result={result}
          selected={selected}
          importing={pending === 'import'}
          onToggle={(fingerprint, checked) =>
            setSelected((current) => {
              const next = new Set(current);
              if (checked) next.add(fingerprint);
              else next.delete(fingerprint);
              return next;
            })
          }
          onImport={() => void runImport()}
          onDismiss={() => setResult(null)}
        />
      )}

      <DataView<CatalogItem>
        data={rows}
        columns={columns}
        keyExtractor={(item) => item.item_hash}
        rowClassName={(item) =>
          item.provisioning_status === 'archived' ? 'opacity-60' : ''
        }
        toolbarFilters={
          archivedCount > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={showArchived}
                onCheckedChange={(checked) => setShowArchived(checked === true)}
              />
              Show {archivedCount} archived
            </label>
          ) : undefined
        }
        toolbarActions={
          <>
            <Button
              variant="secondary"
              onClick={() => void runReconcile(false)}
              loading={pending === 'reconcile'}
            >
              {pending !== 'reconcile' && <RefreshCw aria-hidden="true" />}
              Compare with Stripe
            </Button>
            <Button
              variant="secondary"
              onClick={() => void runReconcile(true)}
              loading={pending === 'sync'}
              title="Adopt matching Stripe prices for items missing a price reference. Nothing is created in Stripe."
            >
              Sync
            </Button>
            <Button onClick={() => setEditor({ item: null })}>
              <Plus aria-hidden="true" />
              Add item
            </Button>
          </>
        }
        emptyIcon={<Package className="h-8 w-8" />}
        emptyMessage={
          catalog.length > 0 ? 'Only archived items' : 'No catalog items yet'
        }
        emptyDescription={
          catalog.length > 0
            ? 'Show archived items to see them.'
            : 'Add a subscription plan or credit package, or import prices from Stripe.'
        }
        caption="Catalog"
      />

      <BillingCatalogItemModal
        isOpen={editor !== null}
        item={editor?.item ?? null}
        groupHash={group.group_hash}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          onChanged();
        }}
      />

      <ConfirmDialog
        isOpen={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        variant="warning"
        title="Archive catalog item?"
        message={
          <>
            <span className="font-medium text-foreground">
              {archiveTarget?.display_name}
            </span>{' '}
            leaves the catalog projects can sell. Existing Stripe prices and
            subscriptions are not changed, and archived items can&apos;t be
            reactivated.
          </>
        }
        confirmText="Archive item"
        isLoading={pending === 'archive'}
      />
    </>
  );
}

export default BillingCatalogTab;
