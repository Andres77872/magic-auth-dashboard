/**
 * Semantic Badge variant mappings and shared vocabulary for OAuth statuses
 * (Meridian quiet-tint pills), plus binding-conflict detection, catalog-drift
 * detection and allow-list URL validation.
 *
 * Kept next to the feature components — and out of the component modules
 * themselves, so fast refresh keeps working — so the connections list, the
 * connection detail tabs and the project sign-in tab all colour the same status
 * the same way and validate the same URL the same way.
 */

import type { BadgeProps } from '@/components/ui/badge';
import type {
  OAuthBindingInfo,
  OAuthProviderCatalogEntry,
  OAuthProvisioningMode,
  OAuthUrlKind,
} from '@/types/oauth.types';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

export function connectionStatusVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'draft':
      return 'info';
    case 'disabled':
      return 'warning';
    case 'archived':
    default:
      return 'secondary';
  }
}

export function credentialStatusVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'rotating':
      return 'warning';
    case 'revoked':
      return 'destructive';
    case 'absent':
    default:
      return 'secondary';
  }
}

export function catalogStatusVariant(status?: string | null): BadgeVariant {
  switch (status) {
    case 'enabled':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'disabled':
      return 'secondary';
    case 'archived':
    default:
      return 'secondary';
  }
}

export function provisioningModeVariant(mode?: string | null): BadgeVariant {
  switch (mode) {
    case 'both':
    case 'auto_create':
      return 'warning';
    case 'link_only':
      return 'info';
    case 'disabled':
    default:
      return 'secondary';
  }
}

/** Human labels for the provider types api.auth ships adapters for. */
export const PROVIDER_TYPE_LABELS: Record<string, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  github: 'GitHub',
  discord: 'Discord',
  apple: 'Apple',
  oidc: 'Generic OIDC',
  patreon: 'Patreon',
};

export function providerTypeLabel(providerType?: string | null): string {
  if (!providerType) return 'Unknown';
  return PROVIDER_TYPE_LABELS[providerType] ?? providerType;
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
    description: 'Existing users may link this provider; no new account is ever created.',
    requiresDefaultGroup: false,
  },
  {
    value: 'auto_create',
    label: 'Auto-create',
    description: 'A first-time sign-in creates an account in the default user group.',
    requiresDefaultGroup: true,
  },
  {
    value: 'both',
    label: 'Both',
    description: 'Existing users may link, and a first-time sign-in creates an account.',
    requiresDefaultGroup: true,
  },
];

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
    description: 'A user already known from another project is added to this default group.',
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
  const blockedBy = firstFailure ? readinessCheckLabel(firstFailure.check) : undefined;
  if (!binding.enabled) {
    return { label: 'Not enabled', variant: 'secondary', blockedBy };
  }
  return { label: 'Not ready', variant: 'warning', blockedBy };
}

/**
 * True when a binding write failed because the project already reaches this provider
 * type through a DIFFERENT connection.
 *
 * api.auth rejects that with HTTP 409/400, but our apiClient (see api.client.ts
 * `handleResponse`) drops the status code into its `default` branch and re-throws a
 * plain `Error(message)` — so the status is unavailable downstream and the message is
 * the only signal. We therefore match the phrase rather than the whole sentence, so a
 * minor backend wording change degrades to a generic failure instead of breaking.
 */
export function isBindingConflict(err: unknown): boolean {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  return (
    /\balready\b/i.test(message) ||
    /\bduplicate\b/i.test(message) ||
    /belongs to another project/i.test(message)
  );
}

/**
 * A provider catalog row is in an ERROR state when it is enabled but the running
 * backend registered no adapter for it — the drift the backend's start-up assertion
 * guards against, surfaced before the first login fails.
 */
export function isCatalogDrift(entry: OAuthProviderCatalogEntry): boolean {
  return entry.status === 'enabled' && !entry.adapter_registered;
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
  options: { allowHttpLocalhost?: boolean } = {},
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
  if (scheme !== 'https' && !(scheme === 'http' && options.allowHttpLocalhost && isLocalHost)) {
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
