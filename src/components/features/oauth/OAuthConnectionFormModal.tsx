/**
 * Create / edit an OAuth connection (root).
 *
 * Per-provider-type fields: Google takes hosted domains, Microsoft a tenant plus
 * allowed tenant IDs, GitHub organizations, and generic OIDC the issuer and endpoint
 * set. Endpoint and issuer fields exist only for provider types whose catalog entry
 * allows tenant endpoints; built-in types use the adapter's endpoints, which is also
 * what api.auth enforces.
 *
 * Once an identity is linked (`namespace_locked`), the namespace-affecting inputs —
 * issuer, discovery URL and the Microsoft tenant — are disabled with the reason.
 *
 * Edits send only what changed (api.auth keeps omitted fields). A cleared text field is
 * sent as `''` and cleared restrictions as `{}`: the transport turns `null` into `''`,
 * which api.auth rejects for its object-typed fields. Validation mirrors the adapters'
 * `validate_connection` rules because api.auth only returns "OAuth connection is
 * invalid" (the individual problems are debug-only).
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
import {
  EntityCombobox,
  useProjectOptions,
} from '@/components/features/shared-pickers';
import { useToast } from '@/hooks/useToast';
import type {
  OAuthConnectionCreateRequest,
  OAuthConnectionInfo,
  OAuthConnectionUpdateRequest,
  OAuthProviderCatalogEntry,
} from '@/types/oauth.types';
import { providerTypeLabel } from './oauth-status';

const ENDPOINT_FIELDS = [
  {
    key: 'discovery_url',
    label: 'Discovery URL',
    placeholder: 'https://idp.example.com/.well-known/openid-configuration',
  },
  {
    key: 'authorize_endpoint',
    label: 'Authorize endpoint',
    placeholder: 'https://idp.example.com/authorize',
  },
  {
    key: 'token_endpoint',
    label: 'Token endpoint',
    placeholder: 'https://idp.example.com/token',
  },
  {
    key: 'jwks_uri',
    label: 'JWKS URI',
    placeholder: 'https://idp.example.com/jwks',
  },
  {
    key: 'userinfo_endpoint',
    label: 'Userinfo endpoint',
    placeholder: 'https://idp.example.com/userinfo',
  },
] as const;

type EndpointField = (typeof ENDPOINT_FIELDS)[number]['key'];
type UrlField = EndpointField | 'issuer';

/** Restriction key each provider type manages from this form. */
const RESTRICTION_FIELD: Record<
  string,
  'hosted_domains' | 'tenant_ids' | 'orgs'
> = {
  google: 'hosted_domains',
  microsoft: 'tenant_ids',
  github: 'orgs',
};

const MICROSOFT_TENANT_ALIASES = new Set([
  'common',
  'organizations',
  'consumers',
]);
const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  /** Google hosted domains / Microsoft tenant IDs / GitHub organizations, one per line. */
  restriction_list: string;
  /** Microsoft: a tenant GUID, or `common` / `organizations` / `consumers`. */
  tenant: string;
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
  restriction_list: '',
  tenant: '',
};

function linesToList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToLines(value: unknown): string {
  return Array.isArray(value)
    ? value.map((item) => String(item)).join('\n')
    : '';
}

function stringParam(
  params: Record<string, unknown> | null | undefined,
  key: string
): string {
  const value = params?.[key];
  return typeof value === 'string' ? value : '';
}

/** Order-independent comparison for flat JSON objects. */
function sameJson(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const stable = (value: Record<string, unknown>): string =>
    JSON.stringify(value, Object.keys(value).sort());
  return stable(a) === stable(b);
}

function formFromConnection(connection: OAuthConnectionInfo): FormData {
  const restrictionKey = RESTRICTION_FIELD[connection.provider_type];
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
    restriction_list: restrictionKey
      ? listToLines(connection.restrictions?.[restrictionKey])
      : '',
    tenant: stringParam(connection.provider_params, 'tenant'),
  };
}

/** Stored restrictions with this form's managed key replaced (other keys are kept). */
function mergedRestrictions(
  form: FormData,
  stored: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(stored ?? {}) };
  const key = RESTRICTION_FIELD[form.provider_type];
  if (key) {
    const list = linesToList(form.restriction_list);
    if (list.length > 0) next[key] = list;
    else delete next[key];
  }
  return next;
}

function mergedProviderParams(
  form: FormData,
  stored: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...(stored ?? {}) };
  if (form.provider_type === 'microsoft') {
    const tenant = form.tenant.trim().toLowerCase();
    if (tenant) next.tenant = tenant;
    else delete next.tenant;
  }
  return next;
}

function scopeSet(scopes: string): Set<string> {
  return new Set(scopes.split(/\s+/).filter(Boolean));
}

function validate(
  form: FormData,
  options: {
    isEdit: boolean;
    endpointsAllowed: boolean;
    effectiveScopes: string;
  }
): FormErrors {
  const errors: FormErrors = {};
  const scopes = scopeSet(options.effectiveScopes);
  const typedScopes = form.scopes.trim();

  if (!options.isEdit && !form.provider_type)
    errors.provider_type = 'Choose a provider type';
  if (!form.display_name.trim()) errors.display_name = 'Enter a display name';
  else if (form.display_name.trim().length > 120)
    errors.display_name = 'Use at most 120 characters';
  if (!form.client_id.trim()) errors.client_id = 'Enter the client ID';
  else if (form.client_id.trim().length > 512)
    errors.client_id = 'Use at most 512 characters';

  const list = linesToList(form.restriction_list);
  switch (form.provider_type) {
    case 'google':
      if (
        typedScopes &&
        !(scopes.size === 2 && scopes.has('openid') && scopes.has('email'))
      ) {
        errors.scopes = 'Google connections use exactly "openid email"';
      }
      if (list.some((domain) => domain.includes('/') || domain.includes(' '))) {
        errors.restriction_list = 'Enter bare domains, such as example.com';
      }
      break;
    case 'microsoft': {
      const tenant = form.tenant.trim().toLowerCase();
      if (
        tenant &&
        !MICROSOFT_TENANT_ALIASES.has(tenant) &&
        !GUID_RE.test(tenant)
      ) {
        errors.tenant = 'Use a tenant GUID, common, organizations or consumers';
      }
      if (list.some((id) => !GUID_RE.test(id)))
        errors.restriction_list = 'Each tenant ID must be a GUID';
      if (typedScopes && !(scopes.has('openid') && scopes.has('profile'))) {
        errors.scopes = 'Microsoft connections need at least "openid profile"';
      }
      break;
    }
    case 'github':
      if (list.length > 0 && !scopes.has('read:org')) {
        errors.scopes = 'Add the read:org scope to restrict by organization';
      }
      break;
    default:
      break;
  }

  if (options.endpointsAllowed) {
    if (!form.issuer.trim()) errors.issuer = 'Enter the issuer';
    else if (!/^https:\/\//i.test(form.issuer.trim()))
      errors.issuer = 'The issuer must be an https URL';
    const hasDiscovery = Boolean(form.discovery_url.trim());
    const hasExplicit = Boolean(
      form.authorize_endpoint.trim() &&
      form.token_endpoint.trim() &&
      form.jwks_uri.trim()
    );
    if (!hasDiscovery && !hasExplicit) {
      errors.discovery_url =
        'Enter a discovery URL, or the authorize, token and JWKS endpoints';
    }
    if (typedScopes && !scopes.has('openid'))
      errors.scopes = 'OpenID Connect scopes must include "openid"';
  }

  return errors;
}

export interface OAuthConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Catalog entries for the provider selector (create mode). */
  providers?: OAuthProviderCatalogEntry[];
  /** Present in edit mode; omitted when creating. */
  connection?: OAuthConnectionInfo | null;
  /** Create mode: resolves with the new draft connection. */
  onCreate?: (
    request: OAuthConnectionCreateRequest
  ) => Promise<OAuthConnectionInfo>;
  /** Edit mode: resolves with the updated connection (after the page refetched it). */
  onUpdate?: (
    request: OAuthConnectionUpdateRequest
  ) => Promise<OAuthConnectionInfo>;
  /** Called after a successful save, before the dialog closes. */
  onSaved?: (connection: OAuthConnectionInfo) => void;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function OAuthConnectionFormModal({
  isOpen,
  onClose,
  providers = [],
  connection,
  onCreate,
  onUpdate,
  onSaved,
}: OAuthConnectionFormModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const isEdit = Boolean(connection);
  const [form, setForm] = React.useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [saving, setSaving] = React.useState(false);
  const ownerOptions = useProjectOptions(isOpen && !isEdit);

  // Patreon is configured through the Patreon integration and api.auth refuses it here;
  // archived types and types that allow neither sign-in nor linking are refused too.
  const selectableProviders = React.useMemo(
    () =>
      providers.filter(
        (entry) =>
          entry.provider_type !== 'patreon' &&
          entry.status !== 'archived' &&
          (entry.login_enabled || entry.link_enabled)
      ),
    [providers]
  );

  // Seed the form when the dialog opens (or switches connection) — adjust state during
  // render rather than in an effect, so there is no cascading re-render.
  const instanceKey = isOpen ? (connection?.connection_hash ?? 'new') : null;
  const [seededFor, setSeededFor] = React.useState<string | null>(null);
  if (instanceKey !== seededFor) {
    setSeededFor(instanceKey);
    if (instanceKey !== null) {
      setErrors({});
      setForm(connection ? formFromConnection(connection) : EMPTY_FORM);
    }
  }

  const catalogEntry = providers.find(
    (entry) => entry.provider_type === form.provider_type
  );
  const endpointsAllowed = connection
    ? connection.tenant_endpoints_allowed
    : Boolean(catalogEntry?.tenant_endpoints_allowed);
  const namespaceLocked = Boolean(connection?.namespace_locked);
  const lockReason = namespaceLocked
    ? `Locked: ${connection?.linked_identity_count ?? 0} identities are linked. Create a new connection to change it.`
    : undefined;
  const defaultScopes = connection
    ? connection.scopes
    : catalogEntry?.default_scopes;
  const restrictionKey = RESTRICTION_FIELD[form.provider_type];

  const buildUpdate = (
    current: OAuthConnectionInfo
  ): OAuthConnectionUpdateRequest => {
    const request: OAuthConnectionUpdateRequest = {};
    const displayName = form.display_name.trim();
    const clientId = form.client_id.trim();
    const scopes = form.scopes.trim();
    if (displayName !== current.display_name)
      request.display_name = displayName;
    if (clientId !== (current.client_id ?? '')) request.client_id = clientId;
    // A blank scopes field keeps the stored scopes.
    if (scopes && scopes !== (current.scopes ?? '')) request.scopes = scopes;
    if (current.tenant_endpoints_allowed) {
      const fields: UrlField[] = [
        'issuer',
        ...ENDPOINT_FIELDS.map((field) => field.key),
      ];
      for (const field of fields) {
        const next = form[field].trim();
        if (next !== (current[field] ?? '')) request[field] = next;
      }
    }
    const restrictions = mergedRestrictions(form, current.restrictions);
    if (!sameJson(restrictions, current.restrictions ?? {}))
      request.restrictions = restrictions;
    const params = mergedProviderParams(form, current.provider_params);
    if (!sameJson(params, current.provider_params ?? {}))
      request.provider_params = params;
    return request;
  };

  const buildCreate = (): OAuthConnectionCreateRequest => {
    const restrictions = mergedRestrictions(form, null);
    const params = mergedProviderParams(form, null);
    const endpoint = (field: UrlField): string | undefined =>
      endpointsAllowed ? form[field].trim() || undefined : undefined;
    return {
      provider_type: form.provider_type,
      display_name: form.display_name.trim(),
      client_id: form.client_id.trim(),
      scopes: form.scopes.trim() || undefined,
      owner_project_hash: form.owner_project_hash.trim() || undefined,
      issuer: endpoint('issuer'),
      discovery_url: endpoint('discovery_url'),
      authorize_endpoint: endpoint('authorize_endpoint'),
      token_endpoint: endpoint('token_endpoint'),
      jwks_uri: endpoint('jwks_uri'),
      userinfo_endpoint: endpoint('userinfo_endpoint'),
      restrictions:
        Object.keys(restrictions).length > 0 ? restrictions : undefined,
      provider_params: Object.keys(params).length > 0 ? params : undefined,
    };
  };

  const pendingUpdate = connection ? buildUpdate(connection) : null;
  const unchanged =
    pendingUpdate !== null && Object.keys(pendingUpdate).length === 0;

  const setField =
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

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    const found = validate(form, {
      isEdit,
      endpointsAllowed,
      effectiveScopes: form.scopes.trim() || defaultScopes || '',
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      let saved: OAuthConnectionInfo;
      if (connection && pendingUpdate) {
        if (!onUpdate) throw new Error('Editing is not available here.');
        saved = await onUpdate(pendingUpdate);
        showToast('Connection updated', 'success');
      } else {
        if (!onCreate) throw new Error('Creating is not available here.');
        saved = await onCreate(buildCreate());
        showToast(
          'Connection created as a draft. Store its credentials next.',
          'success'
        );
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      showToast(
        errorMessage(
          err,
          isEdit
            ? 'The connection could not be updated.'
            : 'The connection could not be created.'
        ),
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const restrictionCopy: Record<
    string,
    { label: string; placeholder: string; help: string }
  > = {
    hosted_domains: {
      label: 'Hosted domains',
      placeholder: 'example.com\nexample.org',
      help: 'One Google Workspace domain per line. Leave empty to accept any Google account.',
    },
    tenant_ids: {
      label: 'Allowed tenant IDs',
      placeholder: 'One tenant GUID per line',
      help: 'Only accounts from these Microsoft Entra tenants can sign in. Leave empty to allow any.',
    },
    orgs: {
      label: 'Allowed organizations',
      placeholder: 'acme-inc\nacme-labs',
      help: 'One GitHub organization login per line. Requires the read:org scope.',
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !saving && !open && onClose()}
    >
      <DialogContent size="lg">
        <form
          onSubmit={(event) => void submit(event)}
          noValidate
          className="contents"
        >
          <DialogHeader>
            <DialogTitle>
              {isEdit ? 'Edit connection' : 'Create OAuth connection'}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Non-secret configuration. Credentials are managed on the Credentials tab.'
                : 'A connection holds one provider app registration. It starts as a draft; store its credentials, then activate it.'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-0.5">
            <div className="space-y-1.5">
              <Label htmlFor="oauth-provider-type">Provider type</Label>
              {isEdit ? (
                <p id="oauth-provider-type" className="m-0 text-[13px]">
                  {providerTypeLabel(form.provider_type)}{' '}
                  <span className="text-xs text-muted-foreground">
                    (can&apos;t be changed)
                  </span>
                </p>
              ) : (
                <>
                  <Select
                    value={form.provider_type || undefined}
                    onValueChange={setField('provider_type')}
                    disabled={saving}
                  >
                    <SelectTrigger
                      id="oauth-provider-type"
                      className="w-full sm:w-80"
                      aria-invalid={Boolean(errors.provider_type)}
                    >
                      <SelectValue placeholder="Choose a provider type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableProviders.map((entry) => (
                        <SelectItem
                          key={entry.provider_type}
                          value={entry.provider_type}
                        >
                          {entry.display_name ||
                            providerTypeLabel(entry.provider_type)}
                          {entry.adapter_registered ? '' : ' (no adapter)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.provider_type && (
                    <p className="m-0 text-xs text-destructive">
                      {errors.provider_type}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="oauth-display-name">Display name</Label>
                <Input
                  id="oauth-display-name"
                  value={form.display_name}
                  onChange={(event) =>
                    setField('display_name')(event.target.value)
                  }
                  error={errors.display_name}
                  placeholder="Acme Google Workspace"
                  disabled={saving}
                  fullWidth
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="oauth-client-id">Client ID</Label>
                <Input
                  id="oauth-client-id"
                  value={form.client_id}
                  onChange={(event) =>
                    setField('client_id')(event.target.value)
                  }
                  error={errors.client_id}
                  placeholder="Issued by the provider (not secret)"
                  spellCheck={false}
                  autoComplete="off"
                  disabled={saving}
                  fullWidth
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="oauth-scopes">Scopes</Label>
              <Input
                id="oauth-scopes"
                value={form.scopes}
                onChange={(event) => setField('scopes')(event.target.value)}
                error={errors.scopes}
                placeholder={defaultScopes || 'openid email profile'}
                helperText={
                  isEdit
                    ? 'Space-separated. Leave empty to keep the stored scopes.'
                    : 'Space-separated. Leave empty to use the provider default.'
                }
                spellCheck={false}
                disabled={saving}
                fullWidth
              />
            </div>

            {form.provider_type === 'microsoft' && (
              <div className="space-y-1.5">
                <Label htmlFor="oauth-tenant">Tenant</Label>
                <Input
                  id="oauth-tenant"
                  value={form.tenant}
                  onChange={(event) => setField('tenant')(event.target.value)}
                  error={errors.tenant}
                  placeholder="common"
                  disabled={saving || namespaceLocked}
                  helperText={
                    lockReason ??
                    'A tenant GUID, or common, organizations or consumers. Empty means common.'
                  }
                  spellCheck={false}
                  fullWidth
                />
              </div>
            )}

            {restrictionKey && (
              <div className="space-y-1.5">
                <Label htmlFor="oauth-restrictions">
                  {restrictionCopy[restrictionKey].label}
                </Label>
                <Textarea
                  id="oauth-restrictions"
                  rows={3}
                  value={form.restriction_list}
                  onChange={(event) =>
                    setField('restriction_list')(event.target.value)
                  }
                  error={errors.restriction_list}
                  placeholder={restrictionCopy[restrictionKey].placeholder}
                  helperText={restrictionCopy[restrictionKey].help}
                  spellCheck={false}
                  disabled={saving}
                />
              </div>
            )}

            {form.provider_type && !endpointsAllowed && (
              <p className="m-0 text-xs text-muted-foreground">
                {providerTypeLabel(form.provider_type)} uses the adapter&apos;s
                built-in endpoints and issuer.
              </p>
            )}

            {endpointsAllowed && (
              <fieldset className="m-0 space-y-3 rounded-md border border-border p-3">
                <legend className="px-1 text-[13px] font-medium">
                  Issuer and endpoints
                </legend>
                {namespaceLocked && (
                  <p className="m-0 flex items-start gap-2 text-xs text-warning">
                    <Lock
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Issuer and discovery URL are locked:{' '}
                    {connection?.linked_identity_count ?? 0} identities are
                    linked. Create a new connection to change them.
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="oauth-issuer">Issuer</Label>
                  <Input
                    id="oauth-issuer"
                    value={form.issuer}
                    onChange={(event) => setField('issuer')(event.target.value)}
                    error={errors.issuer}
                    placeholder="https://idp.example.com"
                    disabled={saving || namespaceLocked}
                    spellCheck={false}
                    fullWidth
                  />
                </div>
                {ENDPOINT_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={`oauth-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`oauth-${field.key}`}
                      value={form[field.key]}
                      onChange={(event) =>
                        setField(field.key)(event.target.value)
                      }
                      error={errors[field.key]}
                      placeholder={field.placeholder}
                      disabled={
                        saving ||
                        (namespaceLocked && field.key === 'discovery_url')
                      }
                      spellCheck={false}
                      fullWidth
                    />
                  </div>
                ))}
                <p className="m-0 text-xs text-muted-foreground">
                  Enter a discovery URL, or the authorize, token and JWKS
                  endpoints.
                </p>
              </fieldset>
            )}

            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="oauth-owner-project">
                  Owner project (optional)
                </Label>
                <EntityCombobox
                  id="oauth-owner-project"
                  value={form.owner_project_hash}
                  options={ownerOptions.options}
                  onChange={(option) =>
                    setField('owner_project_hash')(option?.value ?? '')
                  }
                  placeholder="Shared with every project"
                  searchPlaceholder="Search projects"
                  isLoading={ownerOptions.isLoading}
                  error={ownerOptions.error}
                  emptyText="No projects match"
                  clearable
                  disabled={saving}
                  className="w-full sm:w-80"
                />
                <p className="m-0 text-xs text-muted-foreground">
                  Leave empty for a shared connection. Only root can bind a
                  project-owned connection to other projects.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={unchanged}>
              {isEdit ? 'Save changes' : 'Create connection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default OAuthConnectionFormModal;
