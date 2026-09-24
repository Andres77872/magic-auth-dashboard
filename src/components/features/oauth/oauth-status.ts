/**
 * Shared vocabulary for the OAuth area: sentence-case labels and Badge variants for
 * statuses, provider and readiness labels, binding-conflict detection, catalog-drift
 * detection and allow-list URL validation.
 *
 * Kept out of the component modules (so fast refresh keeps working) and shared by the
 * connections list, the connection detail page and the project sign-in tab, so the
 * same status always reads and colours the same way.
 */

import type { BadgeProps } from '@/components/ui/badge';
import { ApiError } from '@/utils/error-handler';
import type {
  OAuthBindingInfo,
  OAuthConnectionStatus,
  OAuthProviderCatalogEntry,
  OAuthProvisioningMode,
  OAuthUrlKind,
} from '@/types/oauth.types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

interface StatusPresentation {
  label: string;
  variant: BadgeVariant;
}

function present(
  map: Record<string, StatusPresentation>,
  status?: string | null
): StatusPresentation {
  const key = status ?? '';
  return (
    map[key] ?? {
      label: key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Unknown',
      variant: 'secondary',
    }
  );
}

const CONNECTION_STATUS: Record<string, StatusPresentation> = {
  active: { label: 'Active', variant: 'success' },
  draft: { label: 'Draft', variant: 'info' },
  disabled: { label: 'Disabled', variant: 'warning' },
  archived: { label: 'Archived', variant: 'secondary' },
};

const CREDENTIAL_STATUS: Record<string, StatusPresentation> = {
  active: { label: 'Stored', variant: 'success' },
  rotating: { label: 'Rotating', variant: 'warning' },
  revoked: { label: 'Revoked', variant: 'destructive' },
  absent: { label: 'Not stored', variant: 'secondary' },
};

const CATALOG_STATUS: Record<string, StatusPresentation> = {
  enabled: { label: 'Enabled', variant: 'success' },
  degraded: { label: 'Degraded', variant: 'warning' },
  disabled: { label: 'Disabled', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'secondary' },
};

export function connectionStatusPresentation(
  status?: string | null
): StatusPresentation {
  return present(CONNECTION_STATUS, status);
}

export function credentialStatusPresentation(
  status?: string | null
): StatusPresentation {
  return present(CREDENTIAL_STATUS, status);
}

export function catalogStatusPresentation(
  status?: string | null
): StatusPresentation {
  return present(CATALOG_STATUS, status);
}

/** Status filter options for the connections list, in lifecycle order. */
export const CONNECTION_STATUS_OPTIONS: Array<{
  value: OAuthConnectionStatus;
  label: string;
}> = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'archived', label: 'Archived' },
];

/** Human labels for the provider types in api.auth's catalog. */
export const PROVIDER_TYPE_LABELS: Record<string, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  github: 'GitHub',
  discord: 'Discord',
  oidc: 'Generic OIDC',
  patreon: 'Patreon',
};

export function providerTypeLabel(providerType?: string | null): string {
  if (!providerType) return 'Unknown';
  return PROVIDER_TYPE_LABELS[providerType] ?? providerType;
}

/** Labels for the provider-specific restriction / parameter keys api.auth understands. */
const RESTRICTION_LABELS: Record<string, string> = {
  hosted_domains: 'Hosted domains',
  tenant_ids: 'Allowed tenant IDs',
  orgs: 'Allowed organizations',
  tenant: 'Tenant',
};

export function restrictionLabel(key: string): string {
  return RESTRICTION_LABELS[key] ?? key.replace(/_/g, ' ');
}

/** One-line consequence copy for each provisioning mode, shown beside the radio. */
export const PROVISIONING_MODE_OPTIONS: Array<{
  value: OAuthProvisioningMode;
  label: string;
  description: string;
  /** TRUE when the mode can create accounts and therefore needs a default user group. */
  requiresDefaultGroup: boolean;
}> = [
  {
    value: 'disabled',
    label: 'Disabled',
    description: 'Nobody can sign in or link an account through this provider.',
    requiresDefaultGroup: false,
  },
  {
    value: 'link_only',
    label: 'Link only',
    description:
      'Existing users may link this provider; no new account is ever created.',
    requiresDefaultGroup: false,
  },
  {
    value: 'auto_create',
    label: 'Auto-create',
    description:
      'A first-time sign-in creates an account in the default user group.',
    requiresDefaultGroup: true,
  },
  {
    value: 'both',
    label: 'Both',
    description:
      'Existing users may link, and a first-time sign-in creates an account.',
    requiresDefaultGroup: true,
  },
];

export function provisioningModeLabel(mode?: string | null): string {
  return (
    PROVISIONING_MODE_OPTIONS.find((option) => option.value === mode)?.label ??
    mode ??
    'Unknown'
  );
}

export function provisioningModeRequiresGroup(mode?: string | null): boolean {
  return mode === 'auto_create' || mode === 'both';
}

export const EXISTING_USER_POLICY_OPTIONS: Array<{
  value: 'deny' | 'join_default_group';
  label: string;
  description: string;
  warning?: string;
}> = [
  {
    value: 'deny',
    label: 'Deny',
    description: 'A user already known from another project is refused here.',
  },
  {
    value: 'join_default_group',
    label: 'Join default group',
    description:
      'A user already known from another project is added to the default group.',
    warning:
      'This grants access to an account that was created elsewhere. Only choose it when every project sharing this connection is equally trusted.',
  },
];

/** Readable titles for the readiness check identifiers api.auth returns. */
export const READINESS_CHECK_LABELS: Record<string, string> = {
  oauth_globally_disabled: 'Deployment switch',
  provider_type_disabled: 'Provider catalog',
  adapter_not_registered: 'Backend adapter',
  connection_not_active: 'Connection status',
  credentials_not_active: 'Credentials',
  binding_disabled: 'Enabled for this project',
  project_inactive: 'Project status',
  no_redirect_uri: 'Redirect URI',
  no_return_origin: 'Return origin',
  default_group_missing: 'Default user group',
  default_group_does_not_reach_project: 'Default group reaches project',
};

export function readinessCheckLabel(check: string): string {
  return READINESS_CHECK_LABELS[check] ?? check;
}

/**
 * The effective state of a binding is the AND across the deployment switch, the
 * provider catalog, the connection, its credentials and the binding's own flags —
 * which is exactly what the server's readiness roll-up already computed. We render
 * that answer rather than recomputing a second, divergent one.
 */
export function bindingEffectiveState(binding: OAuthBindingInfo): {
  label: string;
  variant: BadgeVariant;
  /** The first failing layer, so the badge can say why without opening the panel. */
  blockedBy?: string;
} {
  if (binding.ready) {
    return { label: 'Sign-in ready', variant: 'success' };
  }
  const firstFailure = binding.readiness.find((check) => !check.ok);
  const blockedBy = firstFailure
    ? readinessCheckLabel(firstFailure.check)
    : undefined;
  if (!binding.enabled) {
    return { label: 'Not enabled', variant: 'secondary', blockedBy };
  }
  return { label: 'Not ready', variant: 'warning', blockedBy };
}

/** "1 redirect URI · 2 return origins" — the allow-list at a glance. */
export function allowListSummary(
  binding: Pick<OAuthBindingInfo, 'urls'>
): string {
  const redirects = binding.urls.filter(
    (url) => url.kind === 'redirect_uri'
  ).length;
  const origins = binding.urls.filter(
    (url) => url.kind === 'return_origin'
  ).length;
  return `${redirects} redirect URI${redirects === 1 ? '' : 's'} · ${origins} return origin${origins === 1 ? '' : 's'}`;
}

/**
 * True when a binding write was refused because the project already uses the
 * connection or the connection key: api.auth answers 409 when the connection is already
 * bound to the project under another key (`uk_project_oauth_connection`), and the
 * dashboard's pre-check reports a taken key the same way (see `useOAuthConnections.ts`).
 */
export function isBindingConflict(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409;
}

/**
 * A provider catalog row is in an ERROR state when it is enabled but the running
 * backend registered no adapter for it — the drift the backend's start-up assertion
 * guards against, surfaced before the first login fails.
 */
export function isCatalogDrift(entry: OAuthProviderCatalogEntry): boolean {
  return entry.status === 'enabled' && !entry.adapter_registered;
}

// --- connection keys ------------------------------------------------------------------------

/**
 * api.auth lowercases the key and caps it at 64 characters; the slug rule keeps it
 * readable in sign-in URLs. Returns an error message, or `null` when acceptable.
 */
export function validateConnectionKey(value: string): string | null {
  const key = value.trim().toLowerCase();
  if (!key) return 'Enter a connection key';
  if (key.length > 64) return 'Use at most 64 characters';
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(key))
    return 'Use lowercase letters, digits, hyphens and underscores';
  return null;
}

// --- allow-listed URLs --------------------------------------------------------------------

const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export const URL_KIND_LABELS: Record<string, string> = {
  redirect_uri: 'Redirect URI',
  return_origin: 'Return origin',
};

/**
 * Returns an error message, or `null` when the value is acceptable.
 *
 * Mirrors `validate_redirect_uri` / `validate_origin` in api.auth's `url_safety.py`:
 * https outside development, no wildcards, no fragments, no embedded credentials, and
 * origins are scheme + host + optional port only. Frontend validation is for usability
 * — the server re-validates and remains authoritative.
 */
export function validateAllowedUrl(
  kind: OAuthUrlKind,
  value: string,
  options: { allowHttpLocalhost?: boolean } = {}
): string | null {
  const text = value.trim();
  if (!text) {
    return 'Enter a URL';
  }

  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    return 'URL must be absolute, for example https://app.example.com/auth/callback';
  }

  if (!parsed.protocol || !parsed.hostname) {
    return 'URL must be absolute';
  }

  const scheme = parsed.protocol.replace(':', '').toLowerCase();
  const isLocalHost = LOCAL_DEV_HOSTS.has(parsed.hostname.toLowerCase());
  if (
    scheme !== 'https' &&
    !(scheme === 'http' && options.allowHttpLocalhost && isLocalHost)
  ) {
    return 'URL must use https (plain http is only allowed for localhost in development)';
  }

  if (text.includes('*')) {
    return 'URL must not contain wildcards — matching is exact';
  }
  if (parsed.hash || text.endsWith('#')) {
    return 'URL must not contain a fragment';
  }
  if (parsed.username || parsed.password) {
    return 'URL must not contain credentials';
  }

  if (kind === 'return_origin') {
    if (text.endsWith('/')) {
      return 'Origin must not end with a slash';
    }
    // `new URL('https://host')` normalises an empty path to '/', so only a path with
    // real segments is a violation. A literal trailing slash was already rejected above.
    if ((parsed.pathname !== '' && parsed.pathname !== '/') || parsed.search) {
      return 'Origin must be scheme://host[:port] only';
    }
  }

  return null;
}
