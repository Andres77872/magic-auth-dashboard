/**
 * Billing group (`/billing/:groupHash`): overview (readiness, capabilities),
 * attached projects, catalog and — for root — Stripe credentials. Sections
 * live in `?tab=`.
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CreditCard,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { ActionsMenu } from '@/components/common/ActionsMenu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { PageContainer } from '@/components/common/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { TabNavigation } from '@/components/common/TabNavigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BillingCatalogTab,
  BillingCredentialsTab,
  BillingGroupFormDialog,
  BillingOverviewTab,
  BillingProjectsTab,
  groupStatus,
  useBillingGroup,
  useBillingGroupMutations,
} from '@/components/features/billing';
import { useSetBreadcrumbLabel } from '@/contexts';
import { useTabParam } from '@/hooks/useTabParam';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { cn } from '@/lib/utils';
import { formatCount } from '@/utils/formatters';
import { ROUTES } from '@/utils/routes';

type BillingTab = 'overview' | 'projects' | 'catalog' | 'credentials';
const ADMIN_TABS: readonly BillingTab[] = ['overview', 'projects', 'catalog'];
const ROOT_TABS: readonly BillingTab[] = [...ADMIN_TABS, 'credentials'];

export function BillingGroupDetailsPage(): React.JSX.Element {
  const { groupHash = '' } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isRoot } = useUserType();
  const { details, isLoading, isRefreshing, error, refetch } =
    useBillingGroup(groupHash);
  const { deleteGroup, pending } = useBillingGroupMutations();
  const [activeTab, setActiveTab] = useTabParam<BillingTab>(
    isRoot ? ROOT_TABS : ADMIN_TABS,
    'overview'
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const group = details?.group ?? null;
  useSetBreadcrumbLabel(group?.name);

  const refresh = (): void => void refetch();

  const confirmDelete = async (): Promise<void> => {
    if (!group) return;
    try {
      await deleteGroup(group.group_hash);
      showToast(`Deleted billing group “${group.name}”`, 'success');
      void navigate(ROUTES.BILLING);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'The billing group could not be deleted.',
        'error'
      );
      setDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mb-6 space-y-2" aria-hidden="true">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-64 w-full" />
      </PageContainer>
    );
  }

  if (!details || !group) {
    return (
      <PageContainer>
        <ErrorState
          title="This billing group could not be loaded"
          message={error ?? 'The billing group was not found.'}
          onRetry={refresh}
          isRetrying={isRefreshing}
        />
      </PageContainer>
    );
  }

  const status = groupStatus(group.status);
  const liveItems = details.catalog.filter(
    (item) => item.provisioning_status !== 'archived'
  ).length;

  return (
    <PageContainer>
      <PageHeader
        title={group.name}
        icon={
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
            <CreditCard className="h-5 w-5" />
          </span>
        }
        badge={
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        }
        subtitle={`Stripe billing group · ${formatCount(details.projects.length, 'project')} · ${formatCount(liveItems, 'catalog item')}`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={refresh}
              disabled={isRefreshing}
              aria-label="Refresh billing group"
            >
              <RefreshCw
                className={cn(isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <ActionsMenu
              ariaLabel="More actions"
              triggerIcon={<MoreHorizontal className="h-4 w-4" />}
              triggerClassName="h-[34px] w-[34px] border border-input bg-card"
              items={[
                {
                  key: 'delete',
                  label: 'Delete group',
                  icon: <Trash2 />,
                  onClick: () => setDeleteOpen(true),
                  destructive: true,
                },
              ]}
            />
          </>
        }
      />

      <TabNavigation
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'projects', label: 'Projects', count: details.projects.length },
          { id: 'catalog', label: 'Catalog', count: liveItems },
          ...(isRoot
            ? [{ id: 'credentials', label: 'Stripe credentials' }]
            : []),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Billing group sections"
        className="mb-6"
      />

      <div
        role="tabpanel"
        className={cn('transition-opacity', isRefreshing && 'opacity-80')}
      >
        {activeTab === 'overview' && (
          <BillingOverviewTab details={details} onChanged={refresh} />
        )}
        {activeTab === 'projects' && (
          <BillingProjectsTab details={details} onChanged={refresh} />
        )}
        {activeTab === 'catalog' && (
          <BillingCatalogTab details={details} onChanged={refresh} />
        )}
        {activeTab === 'credentials' && isRoot && (
          <BillingCredentialsTab details={details} onChanged={refresh} />
        )}
      </div>

      <BillingGroupFormDialog
        isOpen={editOpen}
        group={group}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => {
          setEditOpen(false);
          showToast(`Saved “${saved.name}”`, 'success');
          refresh();
        }}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void confirmDelete()}
        title="Delete billing group?"
        message={
          <>
            This permanently deletes{' '}
            <span className="font-medium text-foreground">{group.name}</span>{' '}
            with its project mappings, catalog, customers and purchase history.
            Nothing changes in Stripe. Groups with active subscriptions
            can&apos;t be deleted.
          </>
        }
        confirmText="Delete group"
        confirmationPhrase={group.name}
        isLoading={pending === 'delete'}
      />
    </PageContainer>
  );
}

export default BillingGroupDetailsPage;
