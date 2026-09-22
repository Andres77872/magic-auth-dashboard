/**
 * Provider catalog panel for the System page (root only) — the global kill switch.
 *
 * One row per provider type: code, display name, protocol, whether the RUNNING
 * backend has an adapter registered, catalog status and the login/link capability
 * flags. A type that is enabled in the catalog with no registered adapter renders as
 * an ERROR state, because that data/code drift is exactly what the backend's start-up
 * assertion guards against.
 */

import React from 'react';
import { AlertTriangle, KeyRound } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingSpinner,
} from '@/components/common';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth, useToast } from '@/hooks';
import { oauthService } from '@/services/oauth.service';
import type { OAuthCatalogStatus, OAuthProviderCatalogEntry } from '@/types/oauth.types';
import { catalogStatusVariant, isCatalogDrift, providerTypeLabel } from './oauth-status';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OAuthProviderCatalogPanel(): React.JSX.Element {
  const { userType } = useAuth();
  const isRoot = userType === 'root';
  const { showToast } = useToast();

  const [providers, setProviders] = React.useState<OAuthProviderCatalogEntry[]>([]);
  const [oauthEnabled, setOauthEnabled] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [version, setVersion] = React.useState(0);
  const [pending, setPending] = React.useState<string | null>(null);

  const reload = React.useCallback((): void => setVersion((value) => value + 1), []);

  React.useEffect(() => {
    let active = true;
    void (async (): Promise<void> => {
      try {
        const response = await oauthService.listProviders();
        if (active) {
          setProviders(response.providers || []);
          setOauthEnabled(response.oauth_enabled !== false);
          setError(null);
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Failed to load the OAuth provider catalog'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return (): void => {
      active = false;
    };
  }, [version]);

  const update = async (
    entry: OAuthProviderCatalogEntry,
    changes: { status?: OAuthCatalogStatus; login_enabled?: boolean; link_enabled?: boolean },
  ): Promise<void> => {
    setPending(entry.provider_type);
    try {
      await oauthService.updateProvider(entry.provider_type, changes);
      showToast(`${providerTypeLabel(entry.provider_type)} updated`, 'success');
      reload();
    } catch (err) {
      showToast(errorMessage(err, 'Provider update failed'), 'error');
    } finally {
      setPending(null);
    }
  };

  const drift = providers.filter(isCatalogDrift);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>OAuth providers</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={oauthEnabled ? 'success' : 'warning'}>
            {oauthEnabled ? 'OAUTH_ENABLED' : 'OAuth disabled deployment-wide'}
          </Badge>
          <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorState title="Couldn’t load the provider catalog" message={error} onRetry={reload} />
        ) : providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The provider catalog is empty — no OAuth provider type is registered in the database.
          </p>
        ) : (
          <>
            {drift.length > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {drift.map((entry) => entry.provider_type).join(', ')} enabled in the catalog
                  with no adapter in the running backend. Sign-in through
                  {drift.length === 1 ? ' it' : ' them'} will fail — disable the type or deploy a
                  backend that registers the adapter.
                </span>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Adapter</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Connections</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((entry) => {
                  const busy = pending === entry.provider_type;
                  const driftRow = isCatalogDrift(entry);
                  return (
                    <TableRow key={entry.provider_type}>
                      <TableCell className="font-medium">
                        {entry.display_name || providerTypeLabel(entry.provider_type)}
                        <div className="font-mono text-xs text-muted-foreground">
                          {entry.provider_type}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{entry.protocol}</TableCell>
                      <TableCell>
                        {entry.adapter_registered ? (
                          <Badge variant="success">registered</Badge>
                        ) : (
                          <Badge variant={driftRow ? 'destructive' : 'secondary'}>
                            not registered
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isRoot ? (
                          <Select
                            value={String(entry.status)}
                            onValueChange={(next) =>
                              void update(entry, { status: next as OAuthCatalogStatus })
                            }
                            disabled={busy}
                          >
                            <SelectTrigger
                              className="w-36"
                              aria-label={`${entry.provider_type} status`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enabled">enabled</SelectItem>
                              <SelectItem value="degraded">degraded</SelectItem>
                              <SelectItem value="disabled">disabled</SelectItem>
                              <SelectItem value="archived">archived</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={catalogStatusVariant(entry.status)}>{entry.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={entry.login_enabled}
                          disabled={!isRoot || busy}
                          onCheckedChange={(checked) =>
                            void update(entry, { login_enabled: Boolean(checked) })
                          }
                          aria-label={`${entry.provider_type} login enabled`}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={entry.link_enabled}
                          disabled={!isRoot || busy}
                          onCheckedChange={(checked) =>
                            void update(entry, { link_enabled: Boolean(checked) })
                          }
                          aria-label={`${entry.provider_type} link enabled`}
                        />
                      </TableCell>
                      <TableCell>{entry.connection_count}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              This is the deployment-wide kill switch. Disabling a type stops every connection of
              that type in every project, including in-flight sign-ins at the callback re-check.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default OAuthProviderCatalogPanel;
