/**
 * Create / edit an OAuth connection (root).
 *
 * Per-provider-type field branching is built in from the start — Google takes hosted
 * domains, Microsoft a tenant plus tenant ids, GitHub organisations, and generic OIDC
 * the issuer and endpoint set. Endpoint and issuer fields are editable ONLY when the
 * catalog marks the provider type `tenant_endpoints_allowed`; for built-in types they
 * read "provided by the adapter", which is also what the server enforces.
 *
 * Once any identity is linked (`namespace_locked`), the namespace-affecting inputs —
 * issuer, discovery URL and the Microsoft tenant — are disabled with a visible reason
 * rather than left editable for the server to reject: changing them changes WHO the
 * connection's subjects are.
 *
 * Controlled `useState` form + `validateForm()`, per repository convention (no
 * react-hook-form, no zod).
 */

import React from 'react';
import { Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks';
import { validateRequired } from '@/utils/validators';
import type {
  OAuthConnectionCreateRequest,
  OAuthConnectionInfo,
  OAuthConnectionUpdateRequest,
  OAuthProviderCatalogEntry,
} from '@/types/oauth.types';
import { providerTypeLabel } from './oauth-status';

const ENDPOINT_FIELDS = [
  { key: 'discovery_url', label: 'Discovery URL', placeholder: 'https://idp.example.com/.well-known/openid-configuration' },
  { key: 'authorize_endpoint', label: 'Authorize endpoint', placeholder: 'https://idp.example.com/authorize' },
  { key: 'token_endpoint', label: 'Token endpoint', placeholder: 'https://idp.example.com/token' },
  { key: 'jwks_uri', label: 'JWKS URI', placeholder: 'https://idp.example.com/jwks' },
  { key: 'userinfo_endpoint', label: 'Userinfo endpoint', placeholder: 'https://idp.example.com/userinfo' },
] as const;

type EndpointField = (typeof ENDPOINT_FIELDS)[number]['key'];

interface FormData {
  provider_type: string;
  display_name: string;
  client_id: string;
  scopes: string;
  owner_project_hash: string;
  issuer: string;
  discovery_url: string;
  authorize_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint: string;
  /** Google — one hosted domain per line. */
  hosted_domains: string;
  /** Microsoft — a tenant GUID, or `common` / `organizations` / `consumers`. */
  tenant: string;
  /** Microsoft — one tenant id per line. */
  tenant_ids: string;
  /** GitHub — one organisation login per line. */
  orgs: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const EMPTY_FORM: FormData = {
  provider_type: '',
  display_name: '',
  client_id: '',
  scopes: '',
  owner_project_hash: '',
  issuer: '',
  discovery_url: '',
  authorize_endpoint: '',
  token_endpoint: '',
  jwks_uri: '',
  userinfo_endpoint: '',
  hosted_domains: '',
  tenant: '',
  tenant_ids: '',
  orgs: '',
};

function linesToList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToLines(value: unknown): string {
  return Array.isArray(value) ? value.map((item) => String(item)).join('\n') : '';
}

function restrictionList(
  connection: OAuthConnectionInfo | null | undefined,
  key: string,
): string {
  return listToLines(connection?.restrictions?.[key]);
}

function stringParam(params: Record<string, unknown> | null | undefined, key: string): string {
  const value = params?.[key];
  return typeof value === 'string' ? value : '';
}

function formFromConnection(connection: OAuthConnectionInfo): FormData {
  return {
    provider_type: connection.provider_type,
    display_name: connection.display_name,
    client_id: connection.client_id ?? '',
    scopes: connection.scopes ?? '',
    owner_project_hash: connection.owner_project_hash ?? '',
    issuer: connection.issuer ?? '',
    discovery_url: connection.discovery_url ?? '',
    authorize_endpoint: connection.authorize_endpoint ?? '',
    token_endpoint: connection.token_endpoint ?? '',
    jwks_uri: connection.jwks_uri ?? '',
    userinfo_endpoint: connection.userinfo_endpoint ?? '',
    hosted_domains: restrictionList(connection, 'hosted_domains'),
    tenant: stringParam(connection.provider_params, 'tenant'),
    tenant_ids: restrictionList(connection, 'tenant_ids'),
    orgs: restrictionList(connection, 'orgs'),
  };
}

export interface OAuthConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Catalog entries drive the provider selector and the `tenant_endpoints_allowed` gate. */
  providers: OAuthProviderCatalogEntry[];
  /** Present in edit mode; omitted when creating. */
  connection?: OAuthConnectionInfo | null;
  onCreate: (request: OAuthConnectionCreateRequest) => Promise<OAuthConnectionInfo>;
  onUpdate: (
    connectionHash: string,
    request: OAuthConnectionUpdateRequest,
  ) => Promise<OAuthConnectionInfo>;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function OAuthConnectionFormModal({
  isOpen,
  onClose,
  onSuccess,
  providers,
  connection,
  onCreate,
  onUpdate,
}: OAuthConnectionFormModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const isEdit = Boolean(connection);
  const [form, setForm] = React.useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [saving, setSaving] = React.useState(false);

  // Patreon is configured through the Patreon integration and the server refuses it here.
  const selectableProviders = React.useMemo(
    () =>
      providers.filter(
        (entry) =>
          entry.provider_type !== 'patreon' &&
          entry.status !== 'archived' &&
          (entry.login_enabled || entry.link_enabled),
      ),
    [providers],
  );

  // Seed the form when the dialog opens (or switches to another connection) using the
  // "adjust state during render" pattern rather than an effect, so there is no
  // cascading re-render. Same idiom as `components/navigation/NavigationItem`.
  const instanceKey = isOpen ? (connection?.connection_hash ?? 'new') : null;
  const [seededFor, setSeededFor] = React.useState<string | null>(null);
  if (instanceKey !== seededFor) {
    setSeededFor(instanceKey);
    if (instanceKey !== null) {
      setErrors({});
      setForm(connection ? formFromConnection(connection) : EMPTY_FORM);
    }
  }

  const catalogEntry = providers.find((entry) => entry.provider_type === form.provider_type);
  const endpointsAllowed = Boolean(catalogEntry?.tenant_endpoints_allowed);
  const namespaceLocked = Boolean(connection?.namespace_locked);
  const lockReason = namespaceLocked
    ? `${connection?.linked_identity_count ?? 0} linked identities — create a new connection instead`
    : undefined;

  const handleInputChange =
    (field: keyof FormData) =>
    (value: string): void => {
      setForm((previous) => ({ ...previous, [field]: value }));
      setErrors((previous) => {
        if (!previous[field]) return previous;
        const next = { ...previous };
        delete next[field];
        return next;
      });
    };

  const validateForm = (): boolean => {
    const next: FormErrors = {};

    if (!isEdit) {
      const providerCheck = validateRequired(form.provider_type, 'Provider type');
      if (!providerCheck.isValid) next.provider_type = providerCheck.error;
    }

    const nameCheck = validateRequired(form.display_name, 'Display name');
    if (!nameCheck.isValid) next.display_name = nameCheck.error;

    const clientCheck = validateRequired(form.client_id, 'Client id');
    if (!clientCheck.isValid) next.client_id = clientCheck.error;

    if (endpointsAllowed) {
      const issuerCheck = validateRequired(form.issuer, 'Issuer');
      if (!issuerCheck.isValid) {
        next.issuer = issuerCheck.error;
      } else if (!/^https:\/\//i.test(form.issuer.trim())) {
        next.issuer = 'Issuer must be an https URL';
      }
      if (!form.discovery_url.trim() && !form.authorize_endpoint.trim()) {
        next.discovery_url = 'Provide a discovery URL, or the authorize and token endpoints';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildRestrictions = (): Record<string, unknown> | undefined => {
    const restrictions: Record<string, unknown> = {};
    if (form.provider_type === 'google' && form.hosted_domains.trim()) {
      restrictions.hosted_domains = linesToList(form.hosted_domains);
    }
    if (form.provider_type === 'microsoft' && form.tenant_ids.trim()) {
      restrictions.tenant_ids = linesToList(form.tenant_ids);
    }
    if (form.provider_type === 'github' && form.orgs.trim()) {
      restrictions.orgs = linesToList(form.orgs);
    }
    return Object.keys(restrictions).length > 0 ? restrictions : undefined;
  };

  const buildProviderParams = (): Record<string, unknown> | undefined => {
    if (form.provider_type === 'microsoft' && form.tenant.trim()) {
      return { tenant: form.tenant.trim().toLowerCase() };
    }
    return undefined;
  };

  const endpointPayload = (): Partial<Record<EndpointField | 'issuer', string | undefined>> => {
    if (!endpointsAllowed) return {};
    return {
      issuer: form.issuer.trim() || undefined,
      discovery_url: form.discovery_url.trim() || undefined,
      authorize_endpoint: form.authorize_endpoint.trim() || undefined,
      token_endpoint: form.token_endpoint.trim() || undefined,
      jwks_uri: form.jwks_uri.trim() || undefined,
      userinfo_endpoint: form.userinfo_endpoint.trim() || undefined,
    };
  };

  const submit = async (): Promise<void> => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (isEdit && connection) {
        await onUpdate(connection.connection_hash, {
          display_name: form.display_name.trim(),
          client_id: form.client_id.trim(),
          scopes: form.scopes.trim() || undefined,
          restrictions: buildRestrictions(),
          provider_params: buildProviderParams(),
          ...endpointPayload(),
        });
        showToast('Connection updated', 'success');
      } else {
        await onCreate({
          provider_type: form.provider_type,
          display_name: form.display_name.trim(),
          client_id: form.client_id.trim(),
          scopes: form.scopes.trim() || undefined,
          owner_project_hash: form.owner_project_hash.trim() || undefined,
          restrictions: buildRestrictions(),
          provider_params: buildProviderParams(),
          ...endpointPayload(),
        });
        showToast('Connection created as draft — store its credentials next', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(errorMessage(err, isEdit ? 'Update failed' : 'Create failed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !saving && !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit connection' : 'New OAuth connection'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Non-secret configuration. Credentials are managed on the credentials tab.'
              : 'A connection holds one provider client. It is created as a draft and becomes usable once its credentials are stored and it is activated.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="oauth-provider-type">Provider type</Label>
            {isEdit ? (
              <p className="text-sm">
                {providerTypeLabel(form.provider_type)}{' '}
                <span className="text-xs text-muted-foreground">
                  (a connection cannot change provider type)
                </span>
              </p>
            ) : (
              <Select
                value={form.provider_type || undefined}
                onValueChange={handleInputChange('provider_type')}
              >
                <SelectTrigger id="oauth-provider-type" className="w-full sm:w-80">
                  <SelectValue placeholder="Choose a provider type" />
                </SelectTrigger>
                <SelectContent>
                  {selectableProviders.map((entry) => (
                    <SelectItem key={entry.provider_type} value={entry.provider_type}>
                      {entry.display_name || providerTypeLabel(entry.provider_type)}
                      {entry.adapter_registered ? '' : ' (no adapter)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.provider_type && (
              <p className="text-xs text-destructive">{errors.provider_type}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oauth-display-name">Display name</Label>
            <Input
              id="oauth-display-name"
              value={form.display_name}
              onChange={(event) => handleInputChange('display_name')(event.target.value)}
              error={errors.display_name}
              placeholder="Acme Google Workspace"
              fullWidth
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oauth-client-id">Client id</Label>
            <Input
              id="oauth-client-id"
              value={form.client_id}
              onChange={(event) => handleInputChange('client_id')(event.target.value)}
              error={errors.client_id}
              placeholder="Provider-issued client id (not secret)"
              fullWidth
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oauth-scopes">Scopes</Label>
            <Input
              id="oauth-scopes"
              value={form.scopes}
              onChange={(event) => handleInputChange('scopes')(event.target.value)}
              placeholder={catalogEntry?.default_scopes || 'openid email profile'}
              helperText="Space-separated. Left blank, the provider catalog default is used."
              fullWidth
            />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="oauth-owner-project">Owner project hash (optional)</Label>
              <Input
                id="oauth-owner-project"
                value={form.owner_project_hash}
                onChange={(event) => handleInputChange('owner_project_hash')(event.target.value)}
                placeholder="Leave blank for a platform-owned connection"
                helperText="A project-owned connection can only be bound elsewhere by root."
                fullWidth
              />
            </div>
          )}

          {/* --- per-provider-type branching ------------------------------------------- */}
          {form.provider_type === 'google' && (
            <div className="space-y-1.5">
              <Label htmlFor="oauth-hosted-domains">Hosted domains</Label>
              <Textarea
                id="oauth-hosted-domains"
                rows={3}
                value={form.hosted_domains}
                onChange={(event) => handleInputChange('hosted_domains')(event.target.value)}
                placeholder={'example.com\nexample.org'}
              />
              <p className="text-xs text-muted-foreground">
                One Google Workspace domain per line. Leave blank to accept any Google account.
              </p>
            </div>
          )}

          {form.provider_type === 'microsoft' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="oauth-tenant">Tenant</Label>
                <Input
                  id="oauth-tenant"
                  value={form.tenant}
                  onChange={(event) => handleInputChange('tenant')(event.target.value)}
                  placeholder="common, organizations, consumers, or a tenant GUID"
                  disabled={namespaceLocked}
                  helperText={lockReason}
                  fullWidth
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oauth-tenant-ids">Allowed tenant ids</Label>
                <Textarea
                  id="oauth-tenant-ids"
                  rows={3}
                  value={form.tenant_ids}
                  onChange={(event) => handleInputChange('tenant_ids')(event.target.value)}
                  placeholder="One tenant GUID per line"
                />
              </div>
            </>
          )}

          {form.provider_type === 'github' && (
            <div className="space-y-1.5">
              <Label htmlFor="oauth-orgs">Allowed organisations</Label>
              <Textarea
                id="oauth-orgs"
                rows={3}
                value={form.orgs}
                onChange={(event) => handleInputChange('orgs')(event.target.value)}
                placeholder={'acme-inc\nacme-labs'}
              />
              <p className="text-xs text-muted-foreground">
                One organisation login per line. Requires the <code>read:org</code> scope.
              </p>
            </div>
          )}

          {form.provider_type && !endpointsAllowed && (
            <p className="rounded-md border border-border p-3 text-xs text-muted-foreground">
              Endpoints and issuer for {providerTypeLabel(form.provider_type)} are provided by the
              adapter and cannot be set here.
            </p>
          )}

          {endpointsAllowed && (
            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="text-sm font-medium">Endpoints</div>
              {namespaceLocked && (
                <p className="flex items-start gap-2 text-xs text-warning">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Issuer and discovery URL are locked: {lockReason}.
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="oauth-issuer">Issuer</Label>
                <Input
                  id="oauth-issuer"
                  value={form.issuer}
                  onChange={(event) => handleInputChange('issuer')(event.target.value)}
                  error={errors.issuer}
                  placeholder="https://idp.example.com"
                  disabled={namespaceLocked}
                  fullWidth
                />
              </div>
              {ENDPOINT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={`oauth-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`oauth-${field.key}`}
                    value={form[field.key]}
                    onChange={(event) => handleInputChange(field.key)(event.target.value)}
                    error={errors[field.key]}
                    placeholder={field.placeholder}
                    disabled={namespaceLocked && field.key === 'discovery_url'}
                    fullWidth
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving}>
            {isEdit ? 'Save changes' : 'Create connection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OAuthConnectionFormModal;
