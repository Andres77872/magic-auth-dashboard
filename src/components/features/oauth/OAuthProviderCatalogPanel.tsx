/**
 * OAuth provider catalog — the deployment-wide kill switch per provider type.
 *
 * One row per provider type: name, protocol, whether the RUNNING backend has an adapter,
 * catalog status and the catalog-level sign-in / linking gates. A type that is enabled
 * with no registered adapter is flagged, because that data/code drift breaks sign-in.
 * Admins can read the catalog; only root can change it (api.auth enforces this too).
 */

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Panel } from '@/components/common/Panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useOAuthProviders } from '@/hooks/useOAuthConnections';
import { useToast } from '@/hooks/useToast';
import { useUserType } from '@/hooks/useUserType';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/utils/formatters';
import type {
  OAuthCatalogStatus,
  OAuthProviderCatalogEntry,
  OAuthProviderCatalogUpdateRequest,
} from '@/types/oauth.types';
import {
  catalogStatusPresentation,
  isCatalogDrift,
  providerTypeLabel,
} from './oauth-status';

const CATALOG_STATUSES: Array<{ value: OAuthCatalogStatus; label: string }> = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'archived', label: 'Archived' },
];

function isCatalogStatus(value: string): value is OAuthCatalogStatus {
  return CATALOG_STATUSES.some((status) => status.value === value);
}

interface PendingStop {
  entry: OAuthProviderCatalogEntry;
  status: OAuthCatalogStatus;
}

export function OAuthProviderCatalogPanel(): React.JSX.Element {
  const { isRoot } = useUserType();
  const { showToast } = useToast();
  const {
    providers,
    oauthEnabled,
    isLoading,
    isRefreshing,
    error,
    refetch,
    pendingProvider,
    updateProvider,
  } = useOAuthProviders();
  const [pendingStop, setPendingStop] = React.useState<PendingStop | null>(
    null
  );

  const apply = async (
    entry: OAuthProviderCatalogEntry,
    changes: OAuthProviderCatalogUpdateRequest
  ): Promise<void> => {
    try {
      await updateProvider(entry.provider_type, changes);
      showToast(
        `${entry.display_name || providerTypeLabel(entry.provider_type)} updated`,
        'success'
      );
    } catch (err) {
      showToast(
        err instanceof Error && err.message
          ? err.message
          : 'The provider could not be updated.',
        'error'
      );
    }
  };

  const requestStatus = (
    entry: OAuthProviderCatalogEntry,
    status: OAuthCatalogStatus
  ): void => {
    if (status === entry.status) return;
    // Disabling or archiving stops every connection of the type: confirm first.
    if (status === 'disabled' || status === 'archived') {
      setPendingStop({ entry, status });
      return;
    }
    void apply(entry, { status });
  };

  const drift = providers.filter(isCatalogDrift);

  const statusCell = (entry: OAuthProviderCatalogEntry): React.ReactNode => {
    if (!isRoot) {
      const status = catalogStatusPresentation(entry.status);
      return (
        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      );
    }
    return (
      <Select
        value={entry.status}
        onValueChange={(next) => {
          if (isCatalogStatus(next)) requestStatus(entry, next);
        }}
        disabled={pendingProvider === entry.provider_type}
      >
        <SelectTrigger
          className="h-8 w-32 text-[13px]"
          aria-label={`${providerTypeLabel(entry.provider_type)} status`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATALOG_STATUSES.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              {status.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Panel
      title="OAuth providers"
      description="Deployment-wide switch per provider type. Changes reach every instance within 30 seconds."
      padding="none"
      actions={
        <>
          {oauthEnabled !== null && (
            <Badge variant={oauthEnabled ? 'success' : 'warning'} size="sm">
              {oauthEnabled ? 'OAuth on' : 'OAuth off for this deployment'}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefreshing}
            aria-label="Refresh OAuth providers"
          >
            <RefreshCw
              className={cn(isRefreshing && 'animate-spin')}
              aria-hidden="true"
            />
          </Button>
        </>
      }
    >
      {error && providers.length === 0 ? (
        <ErrorState
          variant="inline"
          size="sm"
          title="The provider catalog could not be loaded"
          message={error}
          onRetry={() => void refetch()}
          isRetrying={isRefreshing}
        />
      ) : (
        <>
          {drift.length > 0 && (
            <div
              role="alert"
              className="flex items-start gap-2 border-b border-border bg-destructive/5 px-5 py-3 text-xs text-destructive"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                {drift
                  .map((entry) => providerTypeLabel(entry.provider_type))
                  .join(', ')}{' '}
                {drift.length === 1 ? 'is' : 'are'} enabled but the running
                backend has no adapter, so sign-in through{' '}
                {drift.length === 1 ? 'it' : 'them'} fails. Disable the type or
                deploy a backend that registers the adapter.
              </span>
            </div>
          )}
          <Table aria-busy={isLoading || undefined}>
            <TableCaption className="sr-only">
              OAuth provider catalog
            </TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Provider</TableHead>
                <TableHead className="hidden md:table-cell">Protocol</TableHead>
                <TableHead>Adapter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sign-in</TableHead>
                <TableHead>Linking</TableHead>
                <TableHead className="pr-5 text-right">Connections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && providers.length === 0 ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index} className="hover:bg-transparent">
                    <TableCell colSpan={7} className="px-5">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : providers.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="px-5 py-6 text-center text-[13px] text-muted-foreground"
                  >
                    The provider catalog is empty: no OAuth provider type is
                    registered in the database.
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((entry) => {
                  const busy = pendingProvider === entry.provider_type;
                  const label = providerTypeLabel(entry.provider_type);
                  return (
                    <TableRow key={entry.provider_type}>
                      <TableCell className="pl-5">
                        <div className="text-[13px] font-medium text-foreground">
                          {entry.display_name || label}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {entry.provider_type}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs uppercase text-muted-foreground md:table-cell">
                        {entry.protocol}
                      </TableCell>
                      <TableCell>
                        {entry.adapter_registered ? (
                          <Badge variant="success" size="sm">
                            Registered
                          </Badge>
                        ) : (
                          <Badge
                            variant={
                              isCatalogDrift(entry)
                                ? 'destructive'
                                : 'secondary'
                            }
                            size="sm"
                          >
                            Not registered
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{statusCell(entry)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={entry.login_enabled}
                          // Patreon is link-only; api.auth refuses to enable it for sign-in.
                          disabled={
                            !isRoot || busy || entry.provider_type === 'patreon'
                          }
                          onCheckedChange={(checked) =>
                            void apply(entry, {
                              login_enabled: checked === true,
                            })
                          }
                          aria-label={`${label} sign-in allowed`}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={entry.link_enabled}
                          disabled={!isRoot || busy}
                          onCheckedChange={(checked) =>
                            void apply(entry, {
                              link_enabled: checked === true,
                            })
                          }
                          aria-label={`${label} account linking allowed`}
                        />
                      </TableCell>
                      <TableCell className="pr-5 text-right tabular-nums">
                        {formatNumber(entry.connection_count)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </>
      )}

      <ConfirmDialog
        isOpen={pendingStop !== null}
        onClose={() => setPendingStop(null)}
        onConfirm={() => {
          if (!pendingStop) return;
          const { entry, status } = pendingStop;
          setPendingStop(null);
          void apply(entry, { status });
        }}
        variant="warning"
        title={`${pendingStop?.status === 'archived' ? 'Archive' : 'Disable'} ${
          pendingStop
            ? providerTypeLabel(pendingStop.entry.provider_type)
            : 'provider'
        }?`}
        message={
          <>
            Every{' '}
            {pendingStop
              ? providerTypeLabel(pendingStop.entry.provider_type)
              : ''}{' '}
            connection stops serving sign-in in every project, including
            sign-ins already in progress.
            {pendingStop &&
              pendingStop.entry.connection_count > 0 &&
              ` ${formatNumber(pendingStop.entry.connection_count)} connection${pendingStop.entry.connection_count === 1 ? ' is' : 's are'} affected.`}
          </>
        }
        confirmText={
          pendingStop?.status === 'archived'
            ? 'Archive provider'
            : 'Disable provider'
        }
      />
    </Panel>
  );
}

export default OAuthProviderCatalogPanel;
