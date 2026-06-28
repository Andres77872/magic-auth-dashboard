/**
 * Billing Groups list + create (admin).
 *
 * A billing group owns one Stripe account + one catalog and can span multiple projects.
 * From here an admin creates groups and drills into a group to manage projects, catalog,
 * and (root-only) Stripe credentials.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from '@/components/common';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { groupStatusVariant, credentialVariant } from '@/components/features/billing';
import { useToast } from '@/hooks';
import { billingService } from '@/services';
import type { BillingGroup } from '@/types';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function BillingGroupsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [groups, setGroups] = React.useState<BillingGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [version, setVersion] = React.useState(0);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newDescription, setNewDescription] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void (async (): Promise<void> => {
      try {
        const res = await billingService.listGroups({ search: query || undefined, limit: 100 });
        if (active) {
          setGroups(res.billing_groups || []);
          setError(null);
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load billing groups'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [query, version]);

  const handleCreate = async (): Promise<void> => {
    if (!newName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }
    setCreating(true);
    try {
      const res = await billingService.createGroup({
        group_name: newName.trim(),
        description: newDescription.trim() || undefined,
      });
      showToast('Billing group created', 'success');
      setShowCreate(false);
      setNewName('');
      setNewDescription('');
      if (res.billing_group?.group_hash) {
        void navigate(`/billing/${res.billing_group.group_hash}`);
      } else {
        setVersion((v) => v + 1);
      }
    } catch (err) {
      showToast(errorMessage(err, 'Failed to create billing group'), 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          subtitle="Billing groups — each owns a Stripe account and a catalog shared across its projects"
          icon={<CreditCard size={24} />}
          actions={
            <Button onClick={() => setShowCreate((v) => !v)}>
              <Plus size={16} className="mr-1" /> New billing group
            </Button>
          }
        />

        {showCreate && (
          <Card>
            <CardContent className="space-y-3 pt-4">
              <Input placeholder="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => void handleCreate()} disabled={creating}>
                  {creating ? 'Creating…' : 'Create'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search billing groups…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setQuery(search);
            }}
          />
          <Button variant="outline" onClick={() => setQuery(search)}>
            Search
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorState
            title="Couldn’t load billing groups"
            message={error}
            onRetry={() => setVersion((v) => v + 1)}
          />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={32} />}
            title="No billing groups"
            description="Create a billing group to define a Stripe account and catalog for one or more projects."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} className="mr-1" /> New billing group
              </Button>
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credentials</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Catalog</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow
                      key={g.group_hash}
                      className="cursor-pointer"
                      onClick={() => {
                        void navigate(`/billing/${g.group_hash}`);
                      }}
                    >
                      <TableCell className="font-medium">
                        {g.name}
                        {g.description ? (
                          <div className="text-xs text-muted-foreground">{g.description}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={groupStatusVariant(g.status)}>{g.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={credentialVariant(g.credential_status)}>{g.credential_status}</Badge>
                      </TableCell>
                      <TableCell>{g.project_count ?? 0}</TableCell>
                      <TableCell>{g.catalog_item_count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

export default BillingGroupsPage;
