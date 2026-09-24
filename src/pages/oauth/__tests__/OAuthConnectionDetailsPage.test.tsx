import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OAuthConnectionDetailsPage } from '../OAuthConnectionDetailsPage';
import type { UseOAuthConnectionReturn } from '@/hooks/useOAuthConnections';
import type {
  OAuthBindingInfo,
  OAuthConnectionInfo,
} from '@/types/oauth.types';

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  setBreadcrumbLabel: vi.fn(),
  isRoot: false,
  details: null as UseOAuthConnectionReturn | null,
}));

vi.mock('@/hooks/useOAuthConnections', () => ({
  useOAuthConnection: () => mocks.details,
}));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/hooks', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/contexts', () => ({
  useSetBreadcrumbLabel: mocks.setBreadcrumbLabel,
}));
vi.mock('@/components/features/shared-pickers', () => ({
  ProjectBatchPickerDialog: () => null,
  EntityCombobox: () => null,
  useProjectOptions: () => ({
    options: [],
    isLoading: false,
    error: null,
    truncated: false,
  }),
}));

const CONNECTION: OAuthConnectionInfo = {
  connection_hash: 'CONN/1',
  provider_type: 'google',
  display_name: 'Acme Google',
  status: 'active',
  client_id: 'client-123',
  scopes: 'openid email',
  identity_namespace: 'google',
  tenant_endpoints_allowed: false,
  catalog_status: 'enabled',
  binding_count: 0,
  linked_identity_count: 0,
  namespace_locked: false,
  credentials: {
    credential_status: 'active',
    has_client_secret: true,
    has_signing_key: false,
    client_secret_fingerprint: 'abc123def456',
  },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const BINDING: OAuthBindingInfo = {
  connection_key: 'google',
  connection_hash: 'CONN/1',
  provider_type: 'google',
  connection_display_name: 'Acme Google',
  connection_status: 'active',
  credential_status: 'active',
  project_hash: 'proj-1',
  project_name: 'Alpha',
  enabled: false,
  login_enabled: true,
  link_enabled: true,
  provisioning_mode: 'disabled',
  existing_user_policy: 'deny',
  init_mode: 'api',
  has_legacy_redeem: false,
  delivery_mode: 'bff',
  urls: [],
  ready: false,
  readiness: [
    {
      check: 'binding_disabled',
      ok: false,
      message: 'The provider is not enabled for this project.',
    },
  ],
};

function details(
  overrides: Partial<UseOAuthConnectionReturn> = {}
): UseOAuthConnectionReturn {
  return {
    connection: CONNECTION,
    bindings: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    pending: null,
    updateConnection: vi.fn().mockResolvedValue(CONNECTION),
    activateConnection: vi.fn().mockResolvedValue(undefined),
    disableConnection: vi.fn().mockResolvedValue(undefined),
    deleteConnection: vi.fn().mockResolvedValue('deleted'),
    setCredentials: vi.fn().mockResolvedValue(undefined),
    testCredentials: vi.fn().mockResolvedValue({ valid: true, problems: [] }),
    assignProject: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  );
}

function renderPage(url: string): void {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/oauth/:connectionHash"
          element={
            <>
              <OAuthConnectionDetailsPage />
              <LocationProbe />
            </>
          }
        />
        <Route path="/oauth" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRoot = false;
  mocks.details = details();
});

describe('OAuthConnectionDetailsPage tabs', () => {
  it('falls back to Overview for an unknown ?tab= value', () => {
    renderPage('/oauth/CONN%2F1?tab=bogus');

    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('heading', { name: 'Configuration' })
    ).toBeInTheDocument();
  });

  it('keeps the tab in the URL and preserves other query parameters', async () => {
    renderPage('/oauth/CONN%2F1?ref=list');

    fireEvent.click(screen.getByRole('tab', { name: /Projects/ }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('ref=list')
    );
    expect(screen.getByTestId('location')).toHaveTextContent('tab=projects');
    expect(screen.getByRole('tab', { name: /Projects/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('publishes the display name as the breadcrumb label', () => {
    renderPage('/oauth/CONN%2F1');
    expect(mocks.setBreadcrumbLabel).toHaveBeenCalledWith('Acme Google');
  });
});

describe('OAuthConnectionDetailsPage credentials', () => {
  it('shows admins the credential status and a note, never the form', () => {
    renderPage('/oauth/CONN%2F1?tab=credentials');

    expect(screen.getByText('abc123def456')).toBeInTheDocument();
    expect(
      screen.getByText(/only root users can store or rotate/i)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Client secret')).not.toBeInTheDocument();
  });

  it('shows root the write-only credentials form', () => {
    mocks.isRoot = true;
    renderPage('/oauth/CONN%2F1?tab=credentials');

    expect(screen.getByLabelText('Client secret')).toHaveAttribute(
      'type',
      'password'
    );
  });
});

describe('OAuthConnectionDetailsPage actions', () => {
  it('hides the root-only actions from admins', () => {
    renderPage('/oauth/CONN%2F1');

    expect(
      screen.queryByRole('button', { name: /edit/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /disable|activate/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'More connection actions' })
    ).not.toBeInTheDocument();
  });

  it('asks root to confirm before disabling and names the consequence', async () => {
    mocks.isRoot = true;
    const current = details();
    mocks.details = current;
    renderPage('/oauth/CONN%2F1');

    fireEvent.click(screen.getByRole('button', { name: 'Disable' }));
    expect(
      await screen.findByText(/stops accepting those sign-ins/i)
    ).toBeInTheDocument();
    expect(current.disableConnection).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Disable connection' }));
    await waitFor(() =>
      expect(current.disableConnection).toHaveBeenCalledTimes(1)
    );
    await waitFor(() =>
      expect(mocks.showToast).toHaveBeenCalledWith(
        'Acme Google is disabled',
        'success'
      )
    );
  });

  it('lists bindings with a link to each project sign-in tab', () => {
    mocks.details = details({ bindings: [BINDING] });
    renderPage('/oauth/CONN%2F1?tab=projects');

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Not enabled')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Configure sign-in for Alpha' })
    ).toHaveAttribute('href', '/projects/proj-1?tab=sign-in');
    expect(
      screen.getByRole('button', { name: /assign projects/i })
    ).toBeInTheDocument();
  });

  it('does not offer assignment of another project’s connection to admins', () => {
    mocks.details = details({
      connection: {
        ...CONNECTION,
        owner_project_hash: 'proj-9',
        owner_project_name: 'Owner project',
      },
    });
    renderPage('/oauth/CONN%2F1?tab=projects');

    expect(
      screen.queryByRole('button', { name: /assign projects/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/only root can bind it to other projects/i)
    ).toBeInTheDocument();
  });
});

describe('OAuthConnectionDetailsPage states', () => {
  it('shows an error with retry and no back button when the connection cannot be loaded', () => {
    const current = details({
      connection: null,
      error: 'OAuth connection not found',
    });
    mocks.details = current;
    renderPage('/oauth/CONN%2F1');

    expect(screen.getByText('OAuth connection not found')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /back/i })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(current.refetch).toHaveBeenCalledTimes(1);
  });
});
