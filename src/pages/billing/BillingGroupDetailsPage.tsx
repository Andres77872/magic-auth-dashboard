/**
 * Billing Group detail — Overview, Projects (attach/detach), Catalog editor, and
 * (root-only) Stripe credentials. Built from Meridian design-system primitives.
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CreditCard,
  FolderOpen,
  KeyRound,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  ToggleRight,
  UploadCloud,
} from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  CopyableId,
  EmptyState,
  ErrorState,
  LoadingSpinner,
  StatsGrid,
  type StatCardProps,
} from '@/components/common';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Switch,
  Checkbox,
} from '@/components/ui';
import {
  groupStatusVariant,
  credentialVariant,
  provisioningVariant,
  BillingAttachProjectsModal,
  BillingCatalogItemModal,
} from '@/components/features/billing';
import { useToast, useAuth } from '@/hooks';
import { billingService } from '@/services';
import type {
  BillingGroup,
  BillingGroupProject,
  CatalogItem,
  BillingCredentialsStatus,
  BillingGroupStatus,
  BillingGroupReadiness,
  CatalogReconcileResult,
} from '@/types';

type Tab = 'overview' | 'projects' | 'catalog' | 'credentials';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function BillingGroupDetailsPage(): React.JSX.Element {
  const { groupHash = '' } = useParams<{ groupHash: string }>();
  const navigate = useNavigate();
  const { userType } = useAuth();
  const isRoot = userType === 'root';

  const [tab, setTab] = React.useState<Tab>('overview');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<BillingGroup | null>(null);
  const [projects, setProjects] = React.useState<BillingGroupProject[]>([]);
  const [catalog, setCatalog] = React.useState<CatalogItem[]>([]);
  const [credentials, setCredentials] = React.useState<BillingCredentialsStatus | null>(null);
  const [readiness, setReadiness] = React.useState<BillingGroupReadiness | null>(null);
  const [version, setVersion] = React.useState(0);

  const reload = React.useCallback((): void => setVersion((v) => v + 1), []);

  React.useEffect(() => {
    let active = true;
    void (async (): Promise<void> => {
      try {
        const res = await billingService.getGroup(groupHash);
        if (active) {
          setGroup(res.billing_group);
          setProjects(res.projects || []);
          setCatalog(res.catalog || []);
          setCredentials(res.credentials || null);
          setReadiness(res.readiness || null);
          setError(null);
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load billing group'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [groupHash, version]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }
  if (error || !group) {
    return (
      <PageContainer>
        <ErrorState
          title="Couldn’t load billing group"
          message={error || 'Billing group not found'}
          onRetry={reload}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title={group.name}
          subtitle="Billing group — Stripe account, projects, and catalog"
          icon={<CreditCard size={24} />}
          actions={
            <Button
              variant="outline"
              onClick={() => {
                void navigate('/billing');
              }}
            >
              Back to billing
            </Button>
          }
        />

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="catalog">Catalog ({catalog.length})</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              group={group}
              projects={projects}
              catalog={catalog}
              credentials={credentials}
              readiness={readiness}
              onChanged={reload}
            />
          </TabsContent>
          <TabsContent value="projects">
            <ProjectsTab
              groupHash={groupHash}
              groupName={group.name}
              projects={projects}
              onChanged={reload}
            />
          </TabsContent>
          <TabsContent value="catalog">
            <CatalogTab groupHash={groupHash} catalog={catalog} onChanged={reload} />
          </TabsContent>
          <TabsContent value="credentials">
            <CredentialsTab groupHash={groupHash} credentials={credentials} isRoot={isRoot} onChanged={reload} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

function formatMoney(cents?: number | null, currency?: string | null): string {
  if (cents == null) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'usd').toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${cents} ${currency || ''}`.trim();
  }
}

function CapabilitySwitch({
  label,
  enabled,
  disabledReason,
  loading,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabledReason?: string;
  loading: boolean;
  onToggle: (enabled: boolean) => void;
}): React.JSX.Element {
  return (
    <div className="flex min-h-[64px] items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {disabledReason || (enabled ? 'enabled' : 'disabled')}
        </div>
      </div>
      <Switch
        checked={enabled}
        disabled={loading || (!enabled && Boolean(disabledReason))}
        onCheckedChange={(checked) => onToggle(Boolean(checked))}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${label}`}
      />
    </div>
  );
}

function OverviewTab({
  group,
  projects,
  catalog,
  credentials,
  readiness,
  onChanged,
}: {
  group: BillingGroup;
  projects: BillingGroupProject[];
  catalog: CatalogItem[];
  credentials: BillingCredentialsStatus | null;
  readiness: BillingGroupReadiness | null;
  onChanged: () => void;
}): React.JSX.Element {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(group.name);
  const [description, setDescription] = React.useState(group.description ?? '');
  const [status, setStatus] = React.useState<BillingGroupStatus>(group.status);
  const [saving, setSaving] = React.useState(false);
  const [capabilityLoading, setCapabilityLoading] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const startEdit = (): void => {
    setName(group.name);
    setDescription(group.description ?? '');
    setStatus(group.status);
    setEditing(true);
  };

  const toggleCapability = async (
    field: 'checkout_enabled' | 'portal_enabled' | 'provisioning_enabled' | 'webhooks_enabled',
    enabled: boolean,
  ): Promise<void> => {
    setCapabilityLoading(field);
    try {
      await billingService.updateCapabilities(group.group_hash, { [field]: enabled });
      showToast(`${field.replace('_enabled', '')} ${enabled ? 'enabled' : 'disabled'}`, 'success');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Capability update failed'), 'error');
    } finally {
      setCapabilityLoading(null);
    }
  };

  const saveEdit = async (): Promise<void> => {
    if (!name.trim()) {
      showToast('Group name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      await billingService.updateGroup(group.group_hash, {
        group_name: name.trim(),
        description: description.trim(),
        status,
      });
      showToast('Billing group updated', 'success');
      setEditing(false);
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Update failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    try {
      await billingService.deleteGroup(group.group_hash);
      showToast('Billing group deleted', 'success');
      void navigate('/billing');
    } catch (err) {
      showToast(errorMessage(err, 'Delete failed (active subscriptions?)'), 'error');
      setDeleting(false);
      setConfirmDelete(false);
      onChanged();
    }
  };

  const catalogActive = catalog.filter((c) => c.provisioning_status === 'active').length;
  const catalogPending = catalog.filter((c) => c.provisioning_status === 'pending').length;
  const catalogFailed = catalog.filter((c) => c.provisioning_status === 'failed').length;
  const credentialStatus = credentials?.credential_status ?? group.credential_status ?? 'absent';
  const catalogHasPrice = catalog.some((c) => c.active && c.provisioning_status === 'active' && c.provider_price_fingerprint);
  const credentialReady = credentialStatus === 'active' && Boolean(credentials?.has_secret_key ?? group.has_secret_key);
  const readinessMissing = readiness?.missing ?? [];
  const readinessReady = readiness?.ready ?? (credentialReady && catalogHasPrice);
  const capabilitiesOn = [
    group.checkout_enabled,
    group.portal_enabled,
    group.provisioning_enabled,
    group.webhooks_enabled,
  ].filter(Boolean).length;

  const stats: StatCardProps[] = [
    { title: 'Projects', value: projects.length, icon: <FolderOpen />, variant: 'primary' },
    {
      title: 'Catalog items',
      value: catalog.length,
      icon: <Package />,
      variant: catalogFailed > 0 ? 'warning' : 'info',
      subValue: `${catalogActive} active · ${catalogPending} pending · ${catalogFailed} failed`,
    },
    {
      title: 'Credentials',
      value: credentialStatus,
      icon: <KeyRound />,
      variant: credentialStatus === 'active' ? 'success' : 'warning',
    },
    {
      title: 'Capabilities',
      value: `${capabilitiesOn}/4`,
      icon: <ToggleRight />,
      variant: capabilitiesOn === 4 ? 'success' : 'default',
      subValue: 'checkout · portal · provisioning · webhooks',
    },
  ];

  return (
    <div className="space-y-4">
      <StatsGrid stats={stats} columns={4} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Overview</CardTitle>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="bg-name">Name</Label>
                <Input id="bg-name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bg-desc">Description</Label>
                <Input
                  id="bg-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BillingGroupStatus)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="suspended">suspended</SelectItem>
                    <SelectItem value="archived">archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void saveEdit()} loading={saving}>
                  Save changes
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {readinessReady ? (
                      <ShieldCheck className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                    <span className="font-medium">Operational readiness</span>
                    <Badge variant={readinessReady ? 'success' : 'warning'}>
                      {readiness?.status || (readinessReady ? 'ready' : 'not_ready')}
                    </Badge>
                  </div>
                  {readiness?.webhook_endpoint_path && (
                    <CopyableId id={readiness.webhook_endpoint_path} label="Stripe webhook endpoint" showFull />
                  )}
                </div>
                {readinessMissing.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {readinessMissing.map((item) => (
                      <Badge key={item} variant="secondary">{item}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={groupStatusVariant(group.status)}>{group.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Provider:</span>
                  <span>{group.provider}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Credentials:</span>
                  <Badge variant={credentialVariant(group.credential_status)}>{group.credential_status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <CapabilitySwitch
                  label="Checkout"
                  enabled={group.checkout_enabled}
                  loading={capabilityLoading === 'checkout_enabled'}
                  disabledReason={!group.checkout_enabled && !catalogHasPrice ? 'active catalog price required' : undefined}
                  onToggle={(checked) => void toggleCapability('checkout_enabled', checked)}
                />
                <CapabilitySwitch
                  label="Portal"
                  enabled={group.portal_enabled}
                  loading={capabilityLoading === 'portal_enabled'}
                  disabledReason={!group.portal_enabled && !credentialReady ? 'active credentials required' : undefined}
                  onToggle={(checked) => void toggleCapability('portal_enabled', checked)}
                />
                <CapabilitySwitch
                  label="Provisioning"
                  enabled={group.provisioning_enabled}
                  loading={capabilityLoading === 'provisioning_enabled'}
                  disabledReason={!group.provisioning_enabled && !credentialReady ? 'active credentials required' : undefined}
                  onToggle={(checked) => void toggleCapability('provisioning_enabled', checked)}
                />
                <CapabilitySwitch
                  label="Webhooks"
                  enabled={group.webhooks_enabled}
                  loading={capabilityLoading === 'webhooks_enabled'}
                  disabledReason={!group.webhooks_enabled && !(credentials?.has_webhook_secret ?? group.has_webhook_secret) ? 'webhook secret required' : undefined}
                  onToggle={(checked) => void toggleCapability('webhooks_enabled', checked)}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Capabilities are gated server-side: a group must be active with active credentials before they
                can be enabled.
              </div>
              <div>
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  Delete group
                </Button>
              </div>
            </>
          )}
        </CardContent>

        <ConfirmDialog
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void handleDelete()}
          title="Delete billing group"
          message="Delete this billing group? This is blocked if it has active subscriptions."
          confirmText="Delete"
          variant="danger"
          isLoading={deleting}
        />
      </Card>
    </div>
  );
}

function ProjectsTab({
  groupHash,
  groupName,
  projects,
  onChanged,
}: {
  groupHash: string;
  groupName: string;
  projects: BillingGroupProject[];
  onChanged: () => void;
}): React.JSX.Element {
  const { showToast } = useToast();
  const [showAttach, setShowAttach] = React.useState(false);
  const [pendingDetach, setPendingDetach] = React.useState<string | null>(null);
  const [detaching, setDetaching] = React.useState(false);

  const detach = async (): Promise<void> => {
    if (!pendingDetach) return;
    setDetaching(true);
    try {
      await billingService.detachProject(groupHash, pendingDetach);
      showToast('Project detached', 'success');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Detach failed'), 'error');
    } finally {
      setDetaching(false);
      setPendingDetach(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Projects</CardTitle>
        <Button onClick={() => setShowAttach(true)} aria-label="Attach projects to billing group">
          <Plus size={16} className="mr-1" /> Attach projects
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <EmptyState
            icon={<FolderOpen />}
            title="No projects attached"
            description="Attach a project to bring it under this billing group's Stripe account and catalog."
            action={
              <Button onClick={() => setShowAttach(true)}>
                <Plus size={16} className="mr-1" /> Attach projects
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Hash</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.project_hash}>
                  <TableCell className="font-medium">{p.project_name || p.project_hash}</TableCell>
                  <TableCell>
                    <CopyableId id={p.project_hash} label="Project hash" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingDetach(p.project_hash)}
                      aria-label={`Detach ${p.project_name || p.project_hash}`}
                    >
                      Detach
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <BillingAttachProjectsModal
        isOpen={showAttach}
        onClose={() => setShowAttach(false)}
        onSuccess={onChanged}
        groupHash={groupHash}
        groupName={groupName}
        attachedProjectHashes={projects.map((p) => p.project_hash)}
      />

      <ConfirmDialog
        isOpen={pendingDetach !== null}
        onClose={() => setPendingDetach(null)}
        onConfirm={() => void detach()}
        title="Detach project"
        message="Detach this project from the billing group? Its users will lose this group's plan."
        confirmText="Detach"
        variant="warning"
        isLoading={detaching}
      />
    </Card>
  );
}

function CatalogTab({
  groupHash,
  catalog,
  onChanged,
}: {
  groupHash: string;
  catalog: CatalogItem[];
  onChanged: () => void;
}): React.JSX.Element {
  const { showToast } = useToast();
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);
  const [pendingArchive, setPendingArchive] = React.useState<string | null>(null);
  const [reconcileResult, setReconcileResult] = React.useState<CatalogReconcileResult | null>(null);
  const [selectedImports, setSelectedImports] = React.useState<Set<string>>(new Set());
  const [reconciling, setReconciling] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);

  const archive = async (): Promise<void> => {
    if (!pendingArchive) return;
    setArchiving(true);
    try {
      await billingService.archiveCatalogItem(groupHash, pendingArchive, true);
      showToast('Catalog item archived', 'success');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Archive failed'), 'error');
    } finally {
      setArchiving(false);
      setPendingArchive(null);
    }
  };

  const runReconcile = async (): Promise<void> => {
    setReconciling(true);
    try {
      const res = await billingService.reconcileCatalog(groupHash);
      setReconcileResult(res.result);
      setSelectedImports(new Set((res.result?.candidates || []).filter((c) => !c.plan_code_conflict).map((c) => c.price_fingerprint)));
      showToast('Catalog reconcile complete', res.result?.error ? 'warning' : 'success');
    } catch (err) {
      showToast(errorMessage(err, 'Catalog reconcile failed'), 'error');
    } finally {
      setReconciling(false);
    }
  };

  const runSync = async (): Promise<void> => {
    setSyncing(true);
    try {
      const res = await billingService.syncCatalog(groupHash);
      setReconcileResult(res.result);
      showToast('Catalog sync complete', res.result?.error ? 'warning' : 'success');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Catalog sync failed'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const importSelected = async (): Promise<void> => {
    if (selectedImports.size === 0) {
      showToast('Select at least one import candidate', 'warning');
      return;
    }
    setImporting(true);
    try {
      const res = await billingService.importCatalog(groupHash, { price_fingerprints: Array.from(selectedImports) });
      showToast(`Imported ${res.imported?.length || 0} catalog item(s)`, 'success');
      await runReconcile();
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Catalog import failed'), 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Catalog</CardTitle>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void runReconcile()} loading={reconciling}>
            <RefreshCw size={16} /> Reconcile
          </Button>
          <Button variant="outline" onClick={() => void runSync()} loading={syncing}>
            <RefreshCw size={16} /> Sync
          </Button>
          <Button onClick={() => setShowCreate(true)} aria-label="Create catalog item">
            <Plus size={16} /> New catalog item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {reconcileResult && (
          <div className="mx-4 rounded-md border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={reconcileResult.error ? 'warning' : 'success'}>
                {reconcileResult.error || 'reconciled'}
              </Badge>
              <span>{reconcileResult.in_sync} in sync</span>
              <span>{reconcileResult.missing_ref_repaired} repaired</span>
              <span>{reconcileResult.drift.length} drift</span>
              <span>{reconcileResult.candidates.length} import candidates</span>
            </div>
            {reconcileResult.drift.length > 0 && (
              <div className="mt-3 space-y-1">
                {reconcileResult.drift.map((d) => (
                  <div key={`${d.item_hash}-${d.drift_kind}`} className="text-xs text-muted-foreground">
                    {d.plan_code}: {d.drift_kind}
                  </div>
                ))}
              </div>
            )}
            {reconcileResult.candidates.length > 0 && (
              <div className="mt-3 space-y-2">
                {reconcileResult.candidates.map((candidate) => (
                  <div key={candidate.price_fingerprint} className="flex items-center justify-between gap-3 rounded-sm border border-border p-2">
                    <Checkbox
                      checked={selectedImports.has(candidate.price_fingerprint)}
                      disabled={candidate.plan_code_conflict}
                      onCheckedChange={(checked) => {
                        setSelectedImports((current) => {
                          const next = new Set(current);
                          if (checked) next.add(candidate.price_fingerprint);
                          else next.delete(candidate.price_fingerprint);
                          return next;
                        });
                      }}
                      label={`${candidate.plan_code} · ${formatMoney(candidate.unit_amount, candidate.currency)}`}
                    />
                    {candidate.plan_code_conflict && <Badge variant="warning">conflict</Badge>}
                  </div>
                ))}
                <Button variant="outline" onClick={() => void importSelected()} loading={importing}>
                  <UploadCloud size={16} /> Import selected
                </Button>
              </div>
            )}
          </div>
        )}
        {catalog.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No catalog items yet"
            description="Create a subscription plan or credit package. Items provision to Stripe when the group is enabled."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-1" /> New catalog item
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Provisioning</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((c) => (
                <TableRow key={c.item_hash}>
                  <TableCell>{c.item_type}</TableCell>
                  <TableCell className="font-mono text-xs">{c.plan_code}</TableCell>
                  <TableCell>{c.display_name}</TableCell>
                  <TableCell>
                    {formatMoney(c.unit_amount, c.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant={provisioningVariant(c.provisioning_status)}>{c.provisioning_status}</Badge>
                      {!c.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                    </div>
                    {c.provisioning_status === 'failed' && c.provisioning_error && (
                      <div className="mt-1 text-xs text-destructive">{c.provisioning_error}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(c)}
                        aria-label={`Edit ${c.display_name}`}
                      >
                        <Pencil size={14} className="mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingArchive(c.item_hash)}
                        aria-label={`Archive ${c.display_name}`}
                      >
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <BillingCatalogItemModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={onChanged}
        groupHash={groupHash}
      />
      <BillingCatalogItemModal
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        onSuccess={onChanged}
        groupHash={groupHash}
        item={editingItem}
      />

      <ConfirmDialog
        isOpen={pendingArchive !== null}
        onClose={() => setPendingArchive(null)}
        onConfirm={() => void archive()}
        title="Archive catalog item"
        message="Archive this catalog item? It will no longer be offered to projects."
        confirmText="Archive"
        variant="warning"
        isLoading={archiving}
      />
    </Card>
  );
}

function CredentialsTab({
  groupHash,
  credentials,
  isRoot,
  onChanged,
}: {
  groupHash: string;
  credentials: BillingCredentialsStatus | null;
  isRoot: boolean;
  onChanged: () => void;
}): React.JSX.Element {
  const { showToast } = useToast();
  const [secretKey, setSecretKey] = React.useState('');
  const [webhookSecret, setWebhookSecret] = React.useState('');
  const [portalConfig, setPortalConfig] = React.useState('');
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const active = credentials?.credential_status === 'active';

  const credentialPayload = (): { secret_key: string; webhook_secret?: string; portal_configuration_id?: string } => ({
    secret_key: secretKey.trim(),
    webhook_secret: webhookSecret.trim() || undefined,
    portal_configuration_id: portalConfig.trim() || undefined,
  });

  const testConnection = async (): Promise<void> => {
    if (!secretKey.trim()) {
      showToast('Stripe secret key is required', 'error');
      return;
    }
    setTesting(true);
    try {
      const result = await billingService.testCredentials(groupHash, credentialPayload());
      setTestResult(
        result.valid
          ? `valid${result.livemode === true ? ' · live mode' : result.livemode === false ? ' · test mode' : ''}${result.account_fingerprint ? ` · ${result.account_fingerprint}` : ''}`
          : 'invalid',
      );
      showToast(result.valid ? 'Stripe credentials validated' : 'Stripe credentials invalid', result.valid ? 'success' : 'error');
    } catch (err) {
      setTestResult(null);
      showToast(errorMessage(err, 'Credential test failed'), 'error');
    } finally {
      setTesting(false);
    }
  };

  const save = async (): Promise<void> => {
    if (!secretKey.trim()) {
      showToast('Stripe secret key is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = credentialPayload();
      // Already-configured account → rotate (POST /rotate); first-time → set (PUT).
      if (active) {
        await billingService.rotateCredentials(groupHash, payload);
        showToast('Credentials rotated (encrypted; never echoed)', 'success');
      } else {
        await billingService.setCredentials(groupHash, payload);
        showToast('Credentials saved (encrypted; never echoed)', 'success');
      }
      setSecretKey('');
      setWebhookSecret('');
      setPortalConfig('');
      onChanged();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to save credentials'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={credentialVariant(credentials?.credential_status)}>
              {credentials?.credential_status || 'absent'}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Secret key: </span>
            {credentials?.has_secret_key ? `set (${credentials?.secret_key_fingerprint})` : 'not set'}
          </div>
          <div>
            <span className="text-muted-foreground">Webhook secret: </span>
            {credentials?.has_webhook_secret ? `set (${credentials?.webhook_secret_fingerprint})` : 'not set'}
          </div>
          <div>
            <span className="text-muted-foreground">Set at: </span>
            {credentials?.credentials_set_at || '—'}
          </div>
        </div>

        {!isRoot ? (
          <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
            Only root users can set or rotate Stripe credentials.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cred-secret">Stripe secret key</Label>
              <Input
                id="cred-secret"
                type="password"
                placeholder="sk_live_…"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-webhook">Webhook signing secret (optional)</Label>
              <Input
                id="cred-webhook"
                type="password"
                placeholder="whsec_…"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cred-portal">Portal configuration id (optional)</Label>
              <Input
                id="cred-portal"
                value={portalConfig}
                onChange={(e) => setPortalConfig(e.target.value)}
              />
            </div>
            {testResult && (
              <div className="rounded-md border border-border p-2 text-sm text-muted-foreground">
                {testResult}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void testConnection()} loading={testing} disabled={saving}>
                Test connection
              </Button>
              <Button onClick={() => void save()} loading={saving} disabled={testing}>
                {active ? 'Rotate credentials' : 'Save credentials'}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Secrets are encrypted server-side and never returned — only presence flags and fingerprints are shown.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BillingGroupDetailsPage;
